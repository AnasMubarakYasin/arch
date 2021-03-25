import { ObserveableAttrNode, ObserveableChildNodes, ObserveableTextNode, ObserveableNode } from './observeable-node.js';
import { ObserveableData, ObserveableListInstance, ObserveableMapInstance, ObserveableValueInstance } from './observeable-data.js'
import { hash } from './helper.js';

type TemplateInit = {
    string: string;
    args: Array<TemplatePointer>;
    indexArg: number;
    argPos: number[];
    stringIndex: number;
    stringLength: number;
}
type TemplatePointer = {
    pointer: any;
}
type TemplateRender = {
    preset: TemplatePreset;
    pointers: TemplatePointer[];
    eventRegister: EventRegistered[];
    symbolIdRegister: symbol[];
    observeableRegister: ObserveableRegistered[];
    subsTemplate: TemplateRender[];
    streams: HtmlRawStream[]
}
type EventRegistered = {
    element: Element;
    eventInit: [string, EventHandler, AddEventListenerOptions?, boolean?] | any[];
}
type ObserveableRegistered = {
    data: ObserveableValueInstance<any> | ObserveableListInstance<any> | ObserveableMapInstance<any>
    handler: (p: any) => any;
}
type TemplateComponent = (attribute: any, children: any[]) => Element;
type TemplateStream = (stream: HtmlRawStream) => void | ObserveableListInstance<unknown> | ObserveableMapInstance<any>;
type EventHandler = (event: any) => void;
type Primitive = string | number | boolean | symbol;

type AttributePreset = {
    [key: string]: (Primitive | TemplatePointer)[] | Primitive | TemplatePointer
}
type TemplatePreset = {
    tag: string | TemplatePointer;
    attributes: AttributePreset;
    type: 'element' | 'text';
    text: string | TemplatePointer;
    children: TemplatePreset[];
}
type TemplateView = {
    preset: TemplatePreset;
    pointers: TemplatePointer[];
}
type TemplateCache = {
    preset: TemplatePreset;
    args: TemplatePointer[];
}
type TemplateCaches = {
    presets: TemplatePreset[];
    args: TemplatePointer[];
}
type TemplateIn = Primitive | TemplateComponent | ObserveableValueInstance<any> | EventHandler | TemplateStream;

export type TemplateTransform = (templateString: TemplateStringsArray, ...templateIn: TemplateIn[]) => TemplatePreset;
export type RawStream = (templateString: TemplateStringsArray, ...templateIn: TemplateIn[]) => HtmlRawStream;

const TAG = 0;
const KEY = 1;
const VALUE = 2;
const ELEMENT = 3;
const CHILD = 4;
const ARG = '$';
const mapId = new Map<Symbol, Element>();
const caches = new Map<string, TemplateCache>();
const cachesStream = new Map<string, TemplateCaches>();

export class HtmlRawStream {
    bufferRender: Element[] = [];
    templateStrings: string[] = [''];
    templateArgs: any[] = [];
    templateRenders: TemplateRender[] = [];
    size() {
        return this.templateStrings.length;
    }
    restart() {
        this.bufferRender.length = 0;
        // for (const template of this.templateRenders) {
        //     release(template);
        // }
        // this.templateRenders.length = 0;
        return this;
    }
    stream(stringArray: TemplateStringsArray, ...args: any[]) {
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
        const cache = cachesStream.get(hashed);
        let presets = [];
        if (cache) {
            presets = cache.presets;
            for (const arg of cache.args) {
                arg.pointer = template.args.shift()?.pointer;
            }
        } else {
            while (template.stringIndex < length) {
                presets.push(transformCore(template));
            }
            cachesStream.set(hashed, { presets, args: template.args });
        }
        const templateRender = buildTemplateRender({
            preset: {attributes: {}, children: [], tag: '', text: '', type: 'text'},
            pointers: template.args
        });
        this.templateRenders.push(templateRender);
        for (const preset of presets) {
            this.bufferRender.push(runtimeRenderering(preset, templateRender));
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

export function html(stringLiterals: TemplateStringsArray, ...templateList: TemplateIn[]): TemplateView {
    const template = buildTemplateInit(stringLiterals, templateList);
    const hashed = hash(template.string, template.stringLength);
    const cache = caches.get(hashed);
    let preset = null;
    if (cache) {
        preset = cache.preset;
        for (const arg of cache.args) {
            arg.pointer = template.args.shift()?.pointer;
        }
    } else {
        preset = transformCore(template);
        caches.set(hashed, { preset, args: template.args });
    }
    return { preset, pointers: template.args };
}


html.registerElement = function (symbol: Symbol, element: Element) {
    mapId.set(symbol, element);
};
html.getElement = function (symbol: Symbol) {
    return mapId.get(symbol);
};

function buildTemplateRender(templateView: TemplateView): TemplateRender {
    const eventRegistered: EventRegistered[] = [];
    const idRegistered: symbol[] = [];
    const observeableRegistered: ObserveableRegistered[] = [];
    return {
        eventRegister: eventRegistered,
        symbolIdRegister: idRegistered,
        observeableRegister: observeableRegistered,
        pointers: templateView.pointers,
        preset: templateView.preset,
        subsTemplate: [],
        streams: []
    }
}

export function release(template: TemplateRender) {
    for (const eventRegistered of template.eventRegister) {
        eventRegistered.element.removeEventListener(...eventRegistered.eventInit);
    }
    for (const symbolId of template.symbolIdRegister) {
        mapId.delete(symbolId);
    }
    for (const dataRegistered of template.observeableRegister) {
        dataRegistered.data.unsubscribe(dataRegistered.handler);
    }
    for (const pointer of template.pointers) {
        pointer.pointer = null;
    }
}

export function render(templateView: TemplateView, selector?: string | Element) {
    const templateRender = buildTemplateRender(templateView);
    const element = runtimeRenderering(templateView.preset, templateRender);
    if (selector) {
        const comment = document.createComment('generate by html-template urjs')
        if (typeof selector == 'string') {
            document.querySelector(selector)?.append(comment, element);
        } else {
            selector.append(comment, element);
        }
    }
    return templateRender;
}
function runtimeRenderering(preset: TemplatePreset, template: TemplateRender) {
    // const typeElement = typeof preset.tag;
    let element: Element | null = null;
    if (typeof preset.tag == 'string') {
        element = document.createElement(preset.tag as string);
    } else if (typeof preset.tag == 'object') {
        element = preset.tag.pointer(preset.attributes, preset.children) as Element;
    } else {
        throw new TypeError('unknown type tag: ' + preset.tag);
    }
    for (const [key, values] of Object.entries(preset.attributes)) {
        if (key[0] == 'o' && key[1] == 'n') {
            const eventInit = [key.slice(2)];
            if (Array.isArray(values)) {
                for (const value of values) {
                    eventInit.push((value as TemplatePointer).pointer);
                }
            }
            element.addEventListener(...eventInit);
            template.eventRegister.push({ element, eventInit })
        } else if (key[0] == 'i' && key[1] == 'd') {
            if (Array.isArray(values)) {
                for (const value of values) {
                    if (typeof value == 'object') {
                        if (typeof value.pointer == 'symbol') {
                            html.registerElement(value.pointer, element);
                            element.id = value.pointer.toString();
                            template.symbolIdRegister.push(value.pointer);
                        } else {
                            element.id += value.pointer;
                        }
                    } else {
                        element.id += value.toString();
                    }
                }
            } else {
                element.id = values.toString();
            }
        } else {
            let accumulation = '';
            let observeableData: ObserveableValueInstance<Primitive> | null = null;
            if (Array.isArray(values)) {
                for (const value of values) {
                    // const type = typeof value;
                    if (typeof value == 'string' || typeof value == 'number' || typeof value == 'boolean') {
                        accumulation += value.toString();
                    } else if (typeof value == 'object') {
                        if (value.pointer instanceof ObserveableData.Value) {
                            if (observeableData) {
                                throw new Error('Cannot use multiple observeable on a attribute key: ' + key);
                            } else {
                                observeableData = value.pointer;
                                accumulation += value.pointer;
                            }
                        } else {
                            accumulation += value.pointer;
                        }
                    } else {
                        throw new TypeError('unknown type value: ' + values);
                    }
                }
            } else {
                accumulation = JSON.stringify(values);
            }
            if (observeableData) {
                const observeableNode = new ObserveableAttrNode(key, accumulation).attachTo(element);
                const handler = (value: any) => observeableNode.set(value.toString());
                observeableData.subscribe(handler);
                template.observeableRegister.push({ data: observeableData, handler });
            } else {
                element.setAttribute(key, accumulation);
            }
        }
    }
    for (const child of preset.children) {
        if (child.type == 'text') {
            if (typeof child.text == 'object') {
                const text = child.text.pointer as unknown;
                if (text instanceof ObserveableData.Value) {
                    const observeableNode = new ObserveableTextNode(text.get()).attachTo(element);
                    const handler = (value: any) => observeableNode.set(value);
                    text.subscribe(handler);
                    template.observeableRegister.push({ data: text, handler });
                } else if (typeof text == 'function') {
                    const hStream = new HtmlRawStream();
                    const stream = hStream.stream.bind(hStream);
                    const observeableData = text(stream);
                    const nodeList: (string | Node)[] | HTMLCollection = hStream.render();
                    template.streams.push(hStream);
                    if (observeableData instanceof ObserveableData.List) {
                        const observeableNode = new ObserveableChildNodes(...nodeList).attachTo(element);
                        const handler = (value: any) => {
                            hStream.restart(), text(stream);
                            observeableNode.set(hStream.render());
                        }
                        observeableData.subscribe(handler);
                        template.observeableRegister.push({ data: observeableData, handler });
                    } else if (observeableData instanceof ObserveableData.Map) {
                        const observeableNode = new ObserveableNode(element).append(...nodeList);
                        const handler = (value: any) => {
                            hStream.restart(), text(stream);
                            observeableNode.replaceChildren(...hStream.render());
                        }
                        observeableData.subscribe(handler);
                        template.observeableRegister.push({ data: observeableData, handler });
                    } else {
                        element.append(...nodeList);
                    }
                } else {
                    element.append(child.text.pointer);
                }
            } else {
                element.append(child.text);
            }
        } else {
            element.append(runtimeRenderering(child, template));
        }
    }
    return element;
}

function buildTemplateInit(strings: TemplateStringsArray | string[], args: any[]): TemplateInit {
    const templateArgs: TemplatePointer[] = [];
    const argPos: number[] = [];
    let stringLength = strings.length;
    let string = strings[0].trimStart();
    for (let index = 1; index < stringLength; index++) {
        templateArgs.push({ pointer: args.shift() });
        argPos.push(string.length);
        string += ARG + strings[index];
    }
    string = string.trimEnd();
    stringLength = string.length;
    return { string, args: templateArgs, stringIndex: 0, argPos, stringLength, indexArg: 0 };
}

function transformCore(template: TemplateInit) {
    const string = template.string;
    const stringLength = template.stringLength;
    let buffer = '';
    let context = TAG;
    let root: TemplatePreset | null = null;
    for (let index = template.stringIndex; index < stringLength; index++) {
        const char = string[index];
        if (char == '\n') {
            continue;
        }
        if (char == ' ' && string[index + 1] == ' ') {
            index++;
            continue;
        }
        if (char == '<') {
            if (context == TAG) {
                root = { tag: '', attributes: {}, text: '', children: [], type: 'element' };
                let key = '';
                let value = [];
                let quoteCount = 0;
                let spaceCount = 0;
                for (++index; index < stringLength; index++) {
                    const char = string[index];
                    if (char == ' ' && string[index + 1] == ' ') {
                        index++;
                        continue;
                    }
                    if (char == ' ' || char == '\n') {
                        spaceCount++;
                        if (quoteCount) {
                            value.push(buffer, char);
                        } else {
                            if (spaceCount > 1) {
                                if (key += buffer) {
                                    addProperty(root.attributes, key, value);
                                    key = '';
                                    value = [];
                                }
                            } else {
                                root.tag += buffer;
                            }
                            context = KEY;
                        }
                        buffer = '';
                    } else if (char == '=' && quoteCount == 0) {
                        key = buffer;
                        buffer = '';
                        context = VALUE;
                    } else if (char == '"') {
                        quoteCount++;
                        if (quoteCount == 2) {
                            quoteCount = 0;
                            value.push(buffer);
                            buffer = '';
                            context = KEY;
                        }
                    } else if (char == '>') {
                        if (string[index - 1] == '/') {
                            buffer = buffer.slice(0, -1);
                            template.stringIndex = index + 1;
                            index = stringLength;
                        }
                        if (context == KEY) {
                            if (key || (key = buffer)) {
                                addProperty(root.attributes, key, value);
                            }
                        } else if (quoteCount == 0) {
                            if (buffer) {
                                root.tag += buffer;
                            }
                        }
                        buffer = '';
                        context = CHILD;
                        break;
                    } else if (char == ARG) {
                        if (template.argPos[0] == index) {
                            template.argPos.shift();
                            const arg = template.args[template.indexArg++];
                            if (context == VALUE) {
                                buffer = buffer ? buffer + arg.pointer : arg;
                            } else if (context == KEY) {
                                if (buffer[0] == '.' && buffer[2] == '.') {
                                    addProperties(root.attributes, arg);
                                    buffer = ''
                                } else {
                                    buffer += arg;
                                }
                            } else if (context == TAG) {
                                if (buffer) {
                                    root.tag = buffer + arg;
                                    buffer = '';
                                } else {
                                    root.tag = arg;
                                }
                            } else {
                                throw new SyntaxError('unknown type on element: ' + arg);
                            }
                        }
                    } else {
                        buffer += char;
                    }
                }
            } else {
                if (buffer) {
                    root.children.push({ tag: '', attributes: {}, text: buffer, children: [], type: 'text' });
                }
                if (string[index + 1] == '/') {
                    if (string[index + 2] == '>') {
                        index += 3;
                    } else {
                        index += 3 + root.tag.length;
                    }
                    template.stringIndex = index;
                    break;
                } else {
                    template.stringIndex = index;
                    root.children.push(transformCore(template));
                    index = template.stringIndex;
                }
                buffer = '';
            }
        } else if (char == ARG) {
            if (template.argPos[0] == index) {
                template.argPos.shift();
                const arg = template.args[template.indexArg++];
                if (context == CHILD) {
                    if (string[index - 1] == '.' && string[index - 3] == '.') {
                        root.children.push(...arg);
                        buffer = buffer.slice(0, buffer.length - 3);
                    } else {
                        root.children.push(
                            { tag: '', attributes: {}, children: [], text: arg, type: 'text' }
                        );
                    }
                    if (buffer) {
                        root.children.splice(-1, 0, { tag: '', attributes: {}, children: [], text: buffer, type: 'text' });
                        buffer = '';
                    }
                } else {
                    throw new SyntaxError('unknown type on child context: ' + arg);
                }
            } else {
                console.warn(template);
                console.warn(char, index, template.argPos[0], stringLength);
            }
        } else {
            buffer += char;
        }
    }
    return root as TemplatePreset;
}

function addProperty(object: object, key: string, value: any, descriptor = {
    configurable: true,
    enumerable: true,
    writable: true,
    value: null,
}) {
    descriptor.value = value;
    return Object.defineProperty(object, key, descriptor);
}
function addProperties(object: object, objectToCopy: object) {
    for (const [key, value] of Object.entries(objectToCopy)) {
        addProperty(object, key, value);
    }
    return object;
}