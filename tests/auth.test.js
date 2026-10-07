import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import process from "node:process";
import test from "node:test";

// Each scenario boots a fresh module graph, like a page reload, without a backend.
function scenario(name, body, setup = "") {
    test(name, () => {
        const result = spawnSync(process.execPath, ["--input-type=module", "--eval", `
            import assert from 'node:assert/strict';
            import axios from 'axios';
            const storage = new Map();
            Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
                getItem: key => storage.get(key) ?? null,
                setItem: (key, value) => storage.set(key, String(value)),
                removeItem: key => storage.delete(key),
            }});
            const tokens = { accessToken: 'opaque-access', refreshToken: 'opaque-refresh', expiresIn: 3600, tokenType: 'Bearer' };
            const renewed = { ...tokens, accessToken: 'renewed-access', refreshToken: 'renewed-refresh' };
            const user = { id: 'owner-id', role: 'HorseOwner', active: true, emailVerified: true, email: 'owner@example.test' };
            ${setup}
            const { default: api } = await import('./src/services/api.js');
            const auth = await import('./src/services/authService.js');
            const store = await import('./src/services/sessionStore.js');
            const reply = (config, data, status = 200) => ({ config, data, status, statusText: '', headers: {} });
            function reject(config, status, data = '') {
                throw new axios.AxiosError('Request failed', 'ERR_BAD_RESPONSE', config, null, reply(config, data, status));
            }
            function seed() {
                store.clearSession();
                store.setTokens(tokens, store.getSession().generation);
                store.setCurrentUser(user, store.getSession().generation);
            }
            function deferred() {
                let resolve;
                const promise = new Promise(done => { resolve = done; });
                return { promise, resolve };
            }
            ${body}
        `], { cwd: new URL("../", import.meta.url), encoding: "utf8", timeout: 15000 });
        assert.equal(result.status, 0, result.error?.message || result.stderr || result.stdout);
    });
}

const savedSession = `storage.set('hrcms.session', JSON.stringify({ ...tokens, expiresAt: Date.now() - 1000, user }));`;

scenario("login persists tokens first, then authenticates only after /me", `
    const calls = [];
    api.defaults.adapter = async config => {
        calls.push(config.url);
        if (config.url === '/api/auth/login') {
            assert.equal(config.headers.get('Authorization'), undefined);
            assert.deepEqual(JSON.parse(config.data), { email: user.email, password: 'test-password' });
            return reply(config, tokens);
        }
        assert.equal(config.headers.get('Authorization'), 'Bearer opaque-access');
        assert.notEqual(store.getSession().status, 'authenticated');
        const saved = JSON.parse(storage.get('hrcms.session'));
        assert.equal(saved.refreshToken, tokens.refreshToken);
        assert.ok(saved.expiresAt > Date.now() + 3590000);
        assert.equal(saved.user, null);
        return reply(config, user);
    };
    assert.deepEqual(await auth.login({ email: user.email, password: 'test-password' }), user);
    assert.deepEqual(calls, ['/api/auth/login', '/api/auth/me']);
    assert.equal(store.getSession().status, 'authenticated');
    assert.deepEqual(JSON.parse(storage.get('hrcms.session')).user, user);
`);

scenario("invalid login never refreshes and reports backend credentials error", `
    let calls = 0;
    api.defaults.adapter = async config => { calls++; return reject(config, 401, { error: 'invalid_credentials' }); };
    await assert.rejects(auth.login({}), /Invalid email or password/);
    assert.equal(calls, 1);
    assert.equal(store.getSession().status, 'anonymous');
`);

scenario("malformed token response or failed profile never leaves a session", `
    api.defaults.adapter = async config => reply(config, { accessToken: 'incomplete' });
    await assert.rejects(auth.login({}), /invalid authentication response/);
    assert.equal(storage.has('hrcms.session'), false);
    api.defaults.adapter = async config => config.url.endsWith('/login') ? reply(config, tokens) : reject(config, 503);
    await assert.rejects(auth.login({}));
    assert.equal(store.getSession().status, 'anonymous');
    assert.equal(storage.has('hrcms.session'), false);
`);

scenario("startup distrusts cached user and shares one /me request", `
    assert.equal(store.getSession().status, 'loading');
    assert.equal(store.getSession().user, null);
    let calls = 0;
    api.defaults.adapter = async config => { calls++; assert.equal(config.url, '/api/auth/me'); return reply(config, user); };
    await Promise.all([auth.restoreSession(), auth.restoreSession()]);
    assert.equal(calls, 1);
    assert.equal(store.getSession().status, 'authenticated');
`, savedSession);

scenario("startup expired access token refreshes once then fetches /me again", `
    const calls = [];
    api.defaults.adapter = async config => {
        calls.push(config.url);
        if (config.url.endsWith('/refresh')) {
            assert.equal(config.headers.get('Authorization'), undefined);
            assert.deepEqual(JSON.parse(config.data), { refreshToken: tokens.refreshToken });
            return reply(config, renewed);
        }
        if (config.headers.get('Authorization') === 'Bearer opaque-access') return reject(config, 401);
        return reply(config, user);
    };
    await auth.restoreSession();
    assert.deepEqual(calls, ['/api/auth/me', '/api/auth/refresh', '/api/auth/me']);
    assert.equal(store.getSession().status, 'authenticated');
    assert.equal(store.getSession().refreshToken, renewed.refreshToken);
`, savedSession);

scenario("startup invalid refresh clears all session data without looping", `
    const calls = [];
    api.defaults.adapter = async config => { calls.push(config.url); return reject(config, 401); };
    await auth.restoreSession();
    assert.deepEqual(calls, ['/api/auth/me', '/api/auth/refresh']);
    assert.equal(store.getSession().status, 'anonymous');
    assert.equal(storage.has('hrcms.session'), false);
`, savedSession);

scenario("corrupt and legacy storage cannot authenticate or crash startup", `
    api.defaults.adapter = async () => { throw new Error('No request expected'); };
    await auth.restoreSession();
    assert.equal(store.getSession().status, 'anonymous');
    assert.equal(storage.size, 0);
`, `storage.set('hrcms.session', '{broken'); storage.set('user', 'undefined'); storage.set('accessToken', 'legacy');`);

scenario("unavailable storage still permits an in-memory login and logout", `
    api.defaults.adapter = async config => reply(config, config.url.endsWith('/login') ? tokens : config.url.endsWith('/me') ? user : '', config.url.endsWith('/logout') ? 204 : 200);
    await auth.login({});
    assert.equal(store.getSession().status, 'authenticated');
    await auth.logout();
    assert.equal(store.getSession().status, 'anonymous');
`, `Object.defineProperty(globalThis, 'localStorage', { get() { throw new Error('Storage disabled'); } });`);

scenario("concurrent and late 401s share one refresh and retry each request once", `
    seed();
    const bothStarted = deferred();
    let initial = 0, refreshes = 0;
    const attempts = new Map();
    api.defaults.adapter = async config => {
        attempts.set(config.url, (attempts.get(config.url) || 0) + 1);
        if (config.url.endsWith('/refresh')) { refreshes++; return reply(config, renewed); }
        if (config.headers.get('Authorization') === 'Bearer opaque-access') {
            if (++initial === 2) bothStarted.resolve();
            await bothStarted.promise;
            if (config.url === '/api/late') await new Promise(done => setTimeout(done, 20));
            return reject(config, 401);
        }
        return reply(config, { ok: true });
    };
    await Promise.all([api.get('/api/first'), api.get('/api/late')]);
    assert.equal(refreshes, 1);
    assert.equal(attempts.get('/api/first'), 2);
    assert.equal(attempts.get('/api/late'), 2);
`);

scenario("simultaneous 401s wait for the same in-flight refresh", `
    seed();
    let refreshes = 0, successes = 0;
    api.defaults.adapter = async config => {
        if (config.url.endsWith('/refresh')) { refreshes++; await new Promise(done => setTimeout(done, 20)); return reply(config, renewed); }
        if (config.headers.get('Authorization') === 'Bearer opaque-access') return reject(config, 401);
        successes++; return reply(config, {});
    };
    await Promise.all([api.get('/api/a'), api.get('/api/b'), api.get('/api/c')]);
    assert.equal(refreshes, 1);
    assert.equal(successes, 3);
`);

scenario("a second 401 stops retrying and clears the session", `
    seed();
    let refreshes = 0, requests = 0;
    api.defaults.adapter = async config => {
        if (config.url.endsWith('/refresh')) { refreshes++; return reply(config, renewed); }
        requests++; return reject(config, 401);
    };
    await assert.rejects(api.get('/api/protected'));
    assert.equal(refreshes, 1);
    assert.equal(requests, 2);
    assert.equal(store.getSession().status, 'anonymous');
`);

scenario("403 and 409 never trigger refresh or clear an authenticated session", `
    seed();
    let calls = 0;
    api.defaults.adapter = async config => { calls++; return reject(config, Number(config.url.slice(1)), { detail: 'Not allowed', title: 'forbidden' }); };
    for (const status of [403, 409]) await assert.rejects(api.get('/' + status), /Not allowed/);
    assert.equal(calls, 2);
    assert.equal(store.getSession().status, 'authenticated');
`);

scenario("logout sends bearer token, handles 204, and always clears even on network failure", `
    seed();
    api.defaults.adapter = async config => {
        assert.equal(config.url, '/api/auth/logout');
        assert.equal(config.headers.get('Authorization'), 'Bearer opaque-access');
        return reply(config, '', 204);
    };
    await auth.logout();
    assert.equal(store.getSession().status, 'anonymous');
    seed();
    api.defaults.adapter = async config => { throw new axios.AxiosError('offline', 'ERR_NETWORK', config); };
    await assert.rejects(auth.logout(), /Unable to reach/);
    assert.equal(store.getSession().status, 'anonymous');
    assert.equal(storage.has('hrcms.session'), false);
`);

scenario("logout refreshes an expired token before requesting server revocation", `
    seed();
    const calls = [];
    api.defaults.adapter = async config => {
        calls.push(config.url);
        if (config.url.endsWith('/refresh')) return reply(config, renewed);
        if (config.headers.get('Authorization') === 'Bearer opaque-access') return reject(config, 401);
        return reply(config, '', 204);
    };
    await auth.logout();
    assert.deepEqual(calls, ['/api/auth/logout', '/api/auth/refresh', '/api/auth/logout']);
    assert.equal(store.getSession().status, 'anonymous');
`);

scenario("a late refresh cannot restore a session after logout", `
    seed();
    const started = deferred(), release = deferred();
    api.defaults.adapter = async config => {
        if (config.url.endsWith('/refresh')) { started.resolve(); await release.promise; return reply(config, renewed); }
        if (config.url.endsWith('/logout')) return reply(config, '', 204);
        return reject(config, 401);
    };
    const request = api.get('/api/protected');
    const rejected = assert.rejects(request);
    await started.promise;
    await auth.logout();
    release.resolve();
    await rejected;
    assert.equal(store.getSession().status, 'anonymous');
    assert.equal(storage.has('hrcms.session'), false);
`);

scenario("late /me from an abandoned login cannot authenticate", `
    const started = deferred(), release = deferred();
    api.defaults.adapter = async config => {
        if (config.url.endsWith('/login')) return reply(config, tokens);
        if (config.url.endsWith('/logout')) return reply(config, '', 204);
        started.resolve(); await release.promise; return reply(config, user);
    };
    const login = auth.login({});
    const rejected = assert.rejects(login);
    await started.promise;
    await auth.logout();
    release.resolve();
    await rejected;
    assert.equal(store.getSession().status, 'anonymous');
`);

scenario("JSON, empty success bodies, and FormData retain their correct shapes", `
    api.defaults.adapter = async config => {
        if (config.url === '/json') { assert.ok(config.headers.get('Content-Type').includes('application/json')); assert.deepEqual(JSON.parse(config.data), { value: 1 }); }
        if (config.url === '/upload') { assert.ok(config.data instanceof FormData); assert.notEqual(config.headers.get('Content-Type'), 'application/json'); assert.equal(config.data.get('type'), 'HorsePhoto'); }
        return reply(config, '', 204);
    };
    assert.equal((await api.post('/json', { value: 1 })).data, null);
    const form = new FormData(); form.append('type', 'HorsePhoto');
    await api.post('/upload', form, { headers: { 'Content-Type': 'application/json' } });
`);

scenario("errors normalize detail/message/title/error, blobs, and empty bodies", `
    const { normalizeApiError } = await import('./src/services/apiError.js');
    for (const data of [{ detail: 'Details' }, { message: 'Details' }, { title: 'Details' }, { error: 'Details' }, { error: { message: 'Details' } }, new Blob([JSON.stringify({ detail: 'Details' })])]) {
        const error = await normalizeApiError({ response: { status: 400, data } });
        assert.equal(error.message, 'Details');
    }
    for (const data of ['', '<html>Proxy error</html>', null]) {
        const error = await normalizeApiError({ response: { status: 429, data } });
        assert.match(error.message, /Too many requests/);
    }
    const error = await normalizeApiError({ response: { status: 409, data: { detail: 'Conflict', traceId: 'trace', referenceId: 'record', errors: { name: ['Required'] } } } });
    assert.equal(error.traceId, 'trace'); assert.equal(error.referenceId, 'record');
    assert.deepEqual(error.validationErrors, { name: ['Required'] });
`);
