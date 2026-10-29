import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { test } from 'node:test';

const styleDir = new URL('../src/style/', import.meta.url);
const sheets = readdirSync(styleDir).filter(name => name.endsWith('.css'))
    .map(name => [name, readFileSync(new URL(name, styleDir), 'utf8')]);
// Cỡ chữ chỉ lấy từ bộ token 14/16/18/22/28/36px khai báo ở :root trong global.css.
const token = String.raw`var\(--hc-(?:font-size-[1-6]|title-size)\)`;
// Cho phép token, inherit, hoặc clamp()/calc() chỉ ghép từ token (tiêu đề trang chủ co giãn theo màn hình).
const allowed = new RegExp(String.raw`^(?:${token}|inherit|(?:clamp|calc)\((?:${token}|calc|[\d.]+vw|[\d.]+|[\s,*()])+\))$`);

test('every CSS font-size uses the shared six-step typography scale', () => {
    const stray = [];
    for (const [name, css] of sheets) {
        for (const [, value] of css.matchAll(/font-size:\s*([^;}]+)/g)) {
            if (!allowed.test(value.trim())) stray.push(`${name}: ${value.trim()}`);
        }
    }
    assert.deepEqual(stray, []);
});

test('the scale itself is exactly 14, 16, 18, 22, 28 and 36px', () => {
    const global = sheets.find(([name]) => name === 'global.css')[1];
    const sizes = [...global.matchAll(/--hc-font-size-([1-6]):\s*(\d+)px/g)].map(([, step, px]) => [Number(step), Number(px)]);
    assert.deepEqual(sizes, [[1, 14], [2, 16], [3, 18], [4, 22], [5, 28], [6, 36]]);
});
