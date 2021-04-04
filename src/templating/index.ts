import { MAP_ID, CACHE_PRESET, ENV } from './constant.js';
import { buildTemplateInit } from './builder.js';
import { transformCore } from './transform.js';
import { ScopeForOf, TemplateRuntime, WatchScope } from './runtime.js';
import { hash } from '../helper.js';
import { ObservableList } from '../observable-data';
import { HtmlRawStream } from './html-stream.js';
import { TemplateEntry, TemplateTree } from './type.js';

export type TemplateTemplating = (stringLiterals: TemplateStringsArray, ...templateList: TemplateEntry[]) => TemplateRuntime;
export type TemplateStream = (templateString: TemplateStringsArray, ...templateIn: TemplateEntry[]) => HtmlRawStream;
type InferObservableList<O> = O extends ObservableList<any[], infer T> ? T : never;

export {ENV};
export {TemplateRuntime};

export function html(stringLiterals: TemplateStringsArray, ...templateList: TemplateEntry[]) {
    const template = buildTemplateInit(stringLiterals, templateList);
    const hashed = hash(template.string, template.stringLength);
    const cache = CACHE_PRESET.get(hashed);
    let tree;
    if (cache) {
        tree = cache.tree;
        for (const arg of cache.pointer) {
            arg.pointer = template.pointers.shift()?.pointer;
        }
    } else {
        tree = transformCore(template);
        CACHE_PRESET.set(hashed, { tree: tree, pointer: template.pointers });
    }
    return new TemplateRuntime({tree, pointers: template.pointers});
}

export function forOf<L extends Iterable<I> | ObservableList<I[], I>, I = L extends Iterable<infer T> ? T : L extends ObservableList<any[]> ? InferObservableList<L>: never>(list: L, view: (raw: TemplateStream, item: I, index: number) => void) {
    return new ScopeForOf(list, view);
}
export function watchOf<D>(data: D, view: (raw: TemplateStream, data: D) => void) {
    return new WatchScope(data, view);
}

export function registerElement(symbol: Symbol, element: Element) {
    MAP_ID.set(symbol, element);
};

export function getElement(symbol: Symbol) {
    return MAP_ID.get(symbol);
};
