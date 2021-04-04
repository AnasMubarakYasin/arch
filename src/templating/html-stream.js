import { CACHE_PRESETS } from './constant.js';
import { hash } from '../helper.js';
import { transformCore } from './transform.js';
import { buildTemplateInit } from './builder.js';
import { TemplateRuntime } from './runtime.js';
export class HtmlRawStream {
    constructor() {
        this.bufferRender = [];
        this.templateStrings = [''];
        this.templateArgs = [];
        this.templateRuntime = [];
    }
    size() {
        return this.templateStrings.length;
    }
    restart() {
        this.bufferRender.length = 0;
        return this;
    }
    stream(stringArray, ...args) {
        const length = stringArray.length;
        this.templateStrings[this.templateStrings.length - 1] += stringArray[0];
        for (let index = 1; index < length; index++) {
            this.templateStrings.push(stringArray[index]);
        }
        this.templateArgs.push(...args);
        return this;
    }
    flush() {
        const template = buildTemplateInit(this.templateStrings, this.templateArgs);
        const length = template.stringLength;
        const hashed = hash(template.string, length);
        const cache = CACHE_PRESETS.get(hashed);
        let trees = [];
        if (cache) {
            trees = cache.trees;
            for (const arg of cache.pointers) {
                arg.pointer = template.pointers.shift()?.pointer;
            }
        }
        else {
            while (template.stringIndex < length) {
                trees.push(transformCore(template));
            }
            CACHE_PRESETS.set(hashed, { trees: trees, pointers: template.pointers });
        }
        const templateRuntime = new TemplateRuntime({
            tree: { attributes: {}, children: [], tag: '', text: '', type: 'text' },
            pointers: template.pointers
        });
        this.templateRuntime.push(templateRuntime);
        for (const tree of trees) {
            this.bufferRender.push(templateRuntime.runtimeRendering(tree));
        }
        this.templateStrings = [''];
        this.templateArgs.length = 0;
        return this;
    }
    render() {
        if (this.templateStrings.length > 1) {
            this.flush();
        }
        return this.bufferRender;
    }
}
