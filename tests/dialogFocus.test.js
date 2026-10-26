import test from 'node:test';
import assert from 'node:assert/strict';
import { containDialogFocus } from '../src/services/dialogFocus.js';

function fixture() {
    const listeners = new Map();
    const doc = { addEventListener: (key, fn) => listeners.set(key, fn), removeEventListener: key => listeners.delete(key) };
    const control = (input = false, disabled = false, visible = true) => ({
        disabled, tabIndex: 0, isConnected: true,
        getClientRects: () => visible ? [{}] : [], matches: () => input,
        focus() { doc.activeElement = this; },
    });
    const trigger = control(), close = control(), hidden = control(true, false, false), disabled = control(true, true), field = control(true), save = control();
    const items = [close, hidden, disabled, field, save];
    const dialog = { ownerDocument: doc, querySelectorAll: () => items, contains: node => items.includes(node) };
    trigger.focus();
    let closed = 0;
    const cleanup = containDialogFocus(dialog, () => closed++);
    const key = (key, shiftKey = false) => {
        const event = { key, shiftKey, prevented: false, preventDefault() { this.prevented = true; }, stopPropagation() {} };
        listeners.get('keydown')(event);
        return event;
    };
    return { doc, trigger, close, field, save, listeners, cleanup, key, closed: () => closed };
}

test('dialog focuses first visible enabled input, bypassing hidden and disabled fields', () => {
    const f = fixture(); assert.equal(f.doc.activeElement, f.field); f.cleanup();
});
test('Tab wraps last control to first and Shift+Tab wraps first to last', () => {
    const f = fixture(); f.save.focus(); assert.equal(f.key('Tab').prevented, true); assert.equal(f.doc.activeElement, f.close);
    assert.equal(f.key('Tab', true).prevented, true); assert.equal(f.doc.activeElement, f.save); f.cleanup();
});
test('ordinary Tab navigation is left to browser', () => {
    const f = fixture(); assert.equal(f.key('Tab').prevented, false); f.cleanup();
});
test('focus outside modal is brought back without changing form controls', () => {
    const f = fixture(); f.trigger.focus(); f.listeners.get('focusin')({ target: f.trigger }); assert.equal(f.doc.activeElement, f.field); f.cleanup();
});
test('Escape requests close and cleanup restores the opening control', () => {
    const f = fixture(); assert.equal(f.key('Escape').prevented, true); assert.equal(f.closed(), 1); f.cleanup(); assert.equal(f.doc.activeElement, f.trigger); assert.equal(f.listeners.size, 0);
});
test('cleanup does not focus a detached trigger', () => {
    const f = fixture(); f.trigger.isConnected = false; f.cleanup(); assert.equal(f.doc.activeElement, f.field);
});
