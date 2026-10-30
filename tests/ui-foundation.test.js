import assert from 'node:assert/strict';
import { after, before, beforeEach, test } from 'node:test';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';
import { ssrDependencies } from './ssrDependencies.js';
import { ROLES } from '../src/constants/roles.js';
import { getNavigationForRole } from '../src/routes/navigation.js';
import { MSG, msg } from '../src/messages/index.js';

let server, AuthContext, Dashboard, TemplateList, PageHeading, Field, api;
const metrics = { horseCount: 17, activePlans: 13, sessionsToday: 11, overdueSessions: 7, restrictedHorses: 5, unreadNotifications: 3, careTasksToday: 9, openIncidents: 2, pendingReviews: 4, lowStockItems: 6 };
const template = { id: 'unicode', name: 'Xây dựng thể lực nền tảng', goal: 'Làm quen nhịp vận động từng bước.', notes: 'Theo dõi sức khỏe.', isSystemDefault: true, requiredTrainingTypesJson: '["Walk","Trot"]', minimumExpertiseLevel: 1, frequencyPerWeek: 3 };
before(async () => {
    server = await createServer({ configFile: false, plugins: [ssrDependencies(), {
        name: 'foundation-resource-fixture', enforce: 'post',
        transform(code, id) {
            if (id.replaceAll('\\', '/').includes('/src/')) return code.replaceAll('"react/jsx-dev-runtime"', '"virtual:foundation-jsx"');
        },
        resolveId(source) { if (source === 'virtual:foundation-jsx') return '\0' + source; },
        load(id) {
            if (id.replaceAll('\\', '/').endsWith('/src/context/useRegistrationResource.js')) return `
                export function useRegistrationResource(load) {
                    globalThis.__foundation.loads.push(load);
                    return {data:globalThis.__foundation.resources.shift(),loading:false,error:null,reload(){}};
                }
            `;
            if (id === '\0virtual:foundation-jsx') return `
                import {jsxDEV as original} from 'react/jsx-dev-runtime';
                export {Fragment} from 'react/jsx-dev-runtime';
                export function jsxDEV(type,props,...rest) {
                    if (['input','select','textarea','button'].includes(type)) globalThis.__foundation.controls.push({type,props});
                    return original(type,props,...rest);
                }
            `;
        },
    }, react()], server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom', logLevel: 'error' });
    ({ AuthContext } = await server.ssrLoadModule('/src/context/useAuth.js'));
    ({ default: Dashboard } = await server.ssrLoadModule('/src/pages/Dashboard.jsx'));
    ({ TemplateList } = await server.ssrLoadModule('/src/pages/training/TemplatePages.jsx'));
    ({ PageHeading, Field } = await server.ssrLoadModule('/src/components/WorkflowUI.jsx'));
    ({ default: api } = await server.ssrLoadModule('/src/services/api.js'));
});
beforeEach(() => {
    globalThis.__foundation = { resources: [], loads: [], controls: [] };
    api.defaults.adapter = async () => { throw new Error('Unexpected network request in foundation test'); };
});
after(async () => { await server?.close(); delete globalThis.__foundation; });
function render(component, role = ROLES.ClubManager) {
    return renderToStaticMarkup(h(MemoryRouter, null, h(AuthContext.Provider, { value: {
        user: { id: 'fixture', firstName: 'Kiểm thử', userName: 'fixture', role }, isAuthenticated: true, loading: false,
    } }, component)));
}

test('S2 PageHeading preserves title ID, description and action control', () => {
    let clicks = 0;
    const html = render(h(PageHeading, { id: 'page-title', title: 'Tiêu đề có dấu', description: 'Mô tả dài có dấu.',
        action: h('button', { onClick: () => clicks++ }, 'Thao tác') }));
    assert.match(html, /<h1 id="page-title">Tiêu đề có dấu<\/h1>/);
    assert.match(html, /Mô tả dài có dấu\./);
    // An action created by the caller remains part of the rendered output.
    assert.match(html, /<button>Thao tác<\/button>/);
    assert.equal(clicks, 0);
});

test('S2 Field preserves labels, controlled values, errors, help ARIA and change callbacks', () => {
    for (const options of [{}, { multiline: true }, { options: [{ value: 'Có dấu', label: 'Có dấu' }] }]) {
        globalThis.__foundation.controls = [];
        const changes = [];
        const html = render(h(Field, { name: 'unicode', label: 'Ghi chú', value: 'Có dấu', required: true,
            help: 'Hướng dẫn', error: 'Lỗi kiểm thử', onChange: e => changes.push(e.target.value), ...options }));
        const control = globalThis.__foundation.controls.find(x => ['input','select','textarea'].includes(x.type)).props;
        assert.ok(html.includes(`for="${control.id}"`));
        assert.equal(control.name, 'unicode');
        assert.equal(control.value, 'Có dấu');
        assert.equal(control.required, true);
        assert.equal(control['aria-invalid'], true);
        assert.equal(control['aria-describedby'], `${control.id}-help ${control.id}-error`);
        assert.ok(html.includes(`id="${control.id}-help"`));
        assert.ok(html.includes(`id="${control.id}-error"`));
        control.onChange({ target: { value: 'Đã đổi' } });
        assert.deepEqual(changes, ['Đã đổi']);
    }
});

test('S7.1 required Field has one decorative marker while native required and label association remain intact', () => {
    for (const variant of [{}, { multiline: true }, { options: ['Có dấu'] }]) {
        const html = render(h(Field, { name: 'required', label: 'Tên trường', required: true, value: '', onChange() {}, ...variant }));
        const label = html.match(/<label[^>]*for="([^"]+)"[^>]*>(.*?)<\/label>/s);
        assert.ok(label, 'explicit label association');
        assert.match(label[2], /Tên trường<span aria-hidden="true"> \*<\/span>/);
        assert.equal((label[2].match(/\*/g) || []).length, 1);
        assert.match(html, new RegExp(`id="${label[1]}"[^>]*required=""`));
        assert.doesNotMatch(html, /aria-label=/, 'native accessible name must not be overridden');
    }
});

test('S7.1 optional Field variants never receive a required marker or required semantics', () => {
    for (const variant of [{}, { multiline: true }, { options: ['Có dấu'] }]) {
        for (const required of [undefined, false]) {
            const html = render(h(Field, { name: 'optional', label: 'Ghi chú', required, value: '', onChange() {}, ...variant }));
            assert.match(html, /<label[^>]*>Ghi chú<\/label>/);
            assert.doesNotMatch(html, /required=|aria-required=|aria-hidden="true"/);
        }
    }
});

test('S7.1 labels already containing a marker are preserved without adding a second star', () => {
    for (const label of ['Tên *', 'Tên * (bắt buộc)', h('span', null, 'Tên ', h('strong', null, '*'))]) {
        const html = render(h(Field, { name: 'marked', label, required: true, value: '', onChange() {} }));
        const labelHtml = html.match(/<label[^>]*>(.*?)<\/label>/s)[1];
        assert.equal((labelHtml.match(/\*/g) || []).length, 1);
        assert.doesNotMatch(labelHtml, /aria-hidden="true"/);
        assert.match(html, /required=""/);
    }
});

test('S7.1 rich labels receive a marker without losing label text, help or error associations', () => {
    const html = render(h(Field, { name: 'rich', label: h('strong', null, 'Tên có dấu'), required: true,
        value: 'Giữ dữ liệu', help: 'Hướng dẫn', error: 'Cần kiểm tra', onChange() {} }));
    assert.match(html, /<strong>Tên có dấu<\/strong><span aria-hidden="true"> \*<\/span>/);
    assert.match(html, /aria-describedby="[^"]+-help [^"]+-error"/);
    assert.match(html, /value="Giữ dữ liệu"/);
    assert.match(html, /aria-invalid="true"/);
});

test('Dashboard keeps scoped API data, shows role KPIs and only links to-do tiles the role can open', async () => {
    for (const role of Object.values(ROLES)) {
        globalThis.__foundation.resources = [metrics];
        globalThis.__foundation.loads = [];
        const html = render(h(Dashboard), role);
        assert.match(html, /id="dashboard-title"/);
        assert.match(html, /Kiểm thử/);
        assert.equal((html.match(/class="dashboard-kpi-value"/g) || []).length, role === ROLES.Groom ? 3 : 4);
        const fields = role === ROLES.Groom ? ['careTasksToday', 'horseCount', 'openIncidents'] : ['horseCount', 'activePlans', 'sessionsToday', 'restrictedHorses'];
        for (const field of fields) assert.ok(html.includes(`class="dashboard-kpi-value">${metrics[field]}</span>`), `${role} ${field}`);
        const routes = new Set(getNavigationForRole(role).map(item => item.to));
        assert.equal(html.includes('href="/reviews"'), routes.has('/reviews'));
        assert.equal(html.includes('href="/inventory"'), routes.has('/inventory'));
        let requests = 0;
        api.defaults.adapter = async config => {
            requests++;
            assert.equal(config.url, '/api/dashboard'); assert.equal(config.method, 'get');
            return { config, data: metrics, status: 200, statusText: 'OK', headers: {} };
        };
        assert.deepEqual(await globalThis.__foundation.loads[0](), metrics);
        assert.equal(requests, 1);
    }
});

test('S2 Template table keeps Vietnamese text and HeadTrainer actions while Manager remains read-only', () => {
    for (const role of [ROLES.HeadTrainer, ROLES.ClubManager]) {
        globalThis.__foundation.resources = [{ items: [template], page: 1, pageSize: 20, total: 1 }, [template]];
        globalThis.__foundation.controls = [];
        const html = render(h(TemplateList), role);
        assert.match(html, /class="table hc-table"/);
        assert.match(html, /tabindex="0" role="region"/);
        assert.ok(html.includes(template.name)); assert.ok(html.includes(template.goal));
        const text = children => [children].flat(Infinity).filter(part => typeof part === 'string').join('');
        const labels = globalThis.__foundation.controls.filter(x => x.type === 'button').map(x => text(x.props.children));
        for (const label of [msg(MSG.TAO_GIAO_AN), msg(MSG.CURRIC_COPY), msg(MSG.CURRIC_ASSIGN)]) {
            assert.equal(labels.includes(label), role === ROLES.HeadTrainer, label);
        }
    }
});
