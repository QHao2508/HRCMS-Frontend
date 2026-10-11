import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const registry = Symbol.for('hrcms.ssr.dependencies');
globalThis[registry] ??= {};

// Explicit file URLs avoid Windows drive paths being treated as module specifiers
// by Vite's SSR loader. Keep native React identity for the rendering harnesses.
export function ssrDependencies() {
    return {
        name: 'native-ssr-dependencies',
        enforce: 'pre',
        resolveId(source, _importer, options) {
            if (!options?.ssr || source.startsWith('.') || source.startsWith('/') || source.startsWith('virtual:') || source.startsWith('\0') || source.includes(':')) return;
            globalThis[registry][source] ??= require(source);
            return '\0native-dependency:' + source;
        },
        load(id) {
            if (!id.startsWith('\0native-dependency:')) return;
            const source = id.slice('\0native-dependency:'.length);
            const module = globalThis[registry][source];
            const names = Object.keys(module).filter(key => /^[A-Za-z_$][\w$]*$/.test(key) && key !== 'default');
            return `const m = globalThis[Symbol.for('hrcms.ssr.dependencies')][${JSON.stringify(source)}];\n` +
                'export default m.default ?? m;\n' + names.map((key, i) => `const value${i} = m.${key}; export { value${i} as ${key} };`).join('\n');
        },
    };
}
