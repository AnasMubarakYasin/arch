import { MAP_ID, CACHE_PRESET, ENV } from './constant.js';
import { buildTemplateInit } from './builder.js';
import { transformCore } from './transform.js';
import { ScopeForOf, TemplateRuntime, WatchScope } from './runtime.js';
import { hash } from '../helper.js';
export { ENV };
export { TemplateRuntime };
export function html(stringLiterals, ...templateList) {
    const template = buildTemplateInit(stringLiterals, templateList);
    const hashed = hash(template.string, template.stringLength);
    const cache = CACHE_PRESET.get(hashed);
    let tree;
    if (cache) {
        tree = cache.tree;
        for (const arg of cache.pointer) {
            arg.pointer = template.pointers.shift()?.pointer;
        }
    }
    else {
        tree = transformCore(template);
        CACHE_PRESET.set(hashed, { tree: tree, pointer: template.pointers });
    }
    return new TemplateRuntime({ tree, pointers: template.pointers });
}
export function forOf(list, view) {
    return new ScopeForOf(list, view);
}
export function watchOf(data, view) {
    return new WatchScope(data, view);
}
export function registerElement(symbol, element) {
    MAP_ID.set(symbol, element);
}
;
export function getElement(symbol) {
    return MAP_ID.get(symbol);
}
;
