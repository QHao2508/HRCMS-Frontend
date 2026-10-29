import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';
import { ssrDependencies } from './ssrDependencies.js';
import { MSG, msg } from '../src/messages/index.js';

let server, Drawer;
before(async () => {
    server = await createServer({ configFile: false, plugins: [ssrDependencies(), react()], server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom', logLevel: 'error' });
    ({ default: Drawer } = await server.ssrLoadModule('/src/components/ui/Drawer.jsx'));
});
after(() => server?.close());

test('Drawer renders nothing while closed', () => {
    assert.equal(renderToStaticMarkup(h(Drawer, { open: false, title: 'Mời nhân viên' }, 'Nội dung')), '');
});

test('Drawer is a labelled modal dialog with a Vietnamese close label', () => {
    const html = renderToStaticMarkup(h(Drawer, { open: true, title: 'Mời nhân viên', onClose() {} }, h('p', null, 'Nội dung')));
    assert.match(html, /role="dialog"/); assert.match(html, /aria-modal="true"/);
    const titleId = html.match(/<h2 id="([^"]+)">Mời nhân viên<\/h2>/)?.[1];
    assert.ok(titleId); assert.ok(html.includes(`aria-labelledby="${titleId}"`));
    assert.ok(html.includes(`aria-label="${msg(MSG.DRAWER_CLOSE_LABEL, { title: 'Mời nhân viên' })}"`));
    assert.ok(html.includes('<p>Nội dung</p>'));
});

test('Drawer cannot be closed while saving', () => {
    const html = renderToStaticMarkup(h(Drawer, { open: true, title: 'Lưu', busy: true, onClose() {} }));
    assert.match(html, /class="hc-drawer-close"[^>]*disabled=""/);
});
