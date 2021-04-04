import { HtmlRawStream } from './html-stream.js';
import { ENV, MAP_ID } from './constant.js';
import { ObserveableAttrNode, ObserveableTextNode, ObserveableChildNodes, ObserveableNode, } from '../observable-node.js';
class ContextScope {
    constructor(data) {
        this.HRStream = new HtmlRawStream();
        this.data = data;
        this.stream = this.HRStream.stream.bind(this.HRStream);
    }
    render() {
        this.HRStream.restart();
        return this.HRStream.bufferRender;
    }
}
export class WatchScope extends ContextScope {
    constructor(data, view) {
        super(data);
        this.view = view;
    }
    render(data) {
        this.HRStream.restart();
        this.view(this.stream, data ?? this.data);
        return this.HRStream.bufferRender;
    }
}
export class ScopeForOf extends ContextScope {
    constructor(list, view) {
        super(list);
        this.view = view;
    }
    render(list) {
        this.HRStream.restart();
        let index = 0;
        for (const item of list ?? this.data) {
            this.view(this.stream, item, index++);
        }
        return this.HRStream.bufferRender;
    }
}
export class ScopeForEach {
    constructor(list, view) {
        this.data = list;
        this.view = view;
        this.template = [];
    }
    render(data) {
        const nodes = [];
        let index = 0;
        for (const item of data) {
            const template = this.view(item, index++).render();
            this.template.push(template);
            nodes.push(template.element);
        }
        return nodes;
    }
}
export class TemplateRuntime {
    constructor(templatePreset) {
        this.registeredEvent = [];
        this.registeredId = [];
        this.registeredObservable = [];
        this.pointers = templatePreset.pointers;
        this.tree = templatePreset.tree;
        this.subsTemplate = [];
        this.streams = [];
        this.scope = [];
    }
    release() {
        for (const registered of this.registeredEvent) {
            registered.element.removeEventListener.apply(null, registered.eventInit);
        }
        for (const id of this.registeredId) {
            MAP_ID.delete(id);
        }
        for (const registeredObservable of this.registeredObservable) {
            registeredObservable.observer.unsubscribe(registeredObservable.handler);
        }
        for (const pointer of this.pointers) {
            pointer.pointer = null;
        }
        return this;
    }
    attachObserver() {
        for (const registeredObservable of this.registeredObservable) {
            registeredObservable.observer.unsubscribe(registeredObservable.handler);
        }
        return this;
    }
    detachObserver() {
        for (const registeredObservable of this.registeredObservable) {
            registeredObservable.observer.subscribe(registeredObservable.handler);
        }
        return this;
    }
    render(selector) {
        this.element = this.runtimeRendering(this.tree);
        if (selector) {
            const comment = document.createComment('generate by html-templating');
            if (typeof selector == 'string') {
                document.querySelector(selector)?.append(comment, this.element);
            }
            else {
                selector.append(comment, this.element);
            }
        }
        return this;
    }
    registerAttr(element, key, value, observable) {
        const observeableNode = new ObserveableAttrNode(key, value).attachTo(element);
        const handler = (value) => {
            observeableNode.set(value);
        };
        observable.subscribe(handler);
        this.registeredObservable.push({ observer: observable, handler });
    }
    registerText(element, observable) {
        const observeableNode = new ObserveableTextNode(observable + '').attachTo(element);
        const handler = (value) => {
            observeableNode.set(value + '');
        };
        observable.subscribe(handler);
        this.registeredObservable.push({ observer: observable, handler });
    }
    registerChildren(element, scope, observable) {
        if (observable instanceof ENV.ObservableArrayClass) {
            const observeableNode = new ObserveableChildNodes(...scope.render()).attachTo(element);
            const handler = (data) => {
                observeableNode.adapterAPI(data, scope.render.bind(scope));
            };
            observable.subscribeAPI(handler);
            this.registeredObservable.push({ observer: observable, handler });
        }
        else if (observable instanceof ENV.ObservableObjectClass) {
            const observeableNode = new ObserveableNode(element).append(...scope.render());
            const handler = (value) => {
                observeableNode.replaceChildren(...scope.render());
            };
            observable.subscribe(handler);
            this.registeredObservable.push({ observer: observable, handler });
        }
        else {
            element.append(...scope.render());
        }
    }
    contextScope(element, scope) {
        const observeableData = scope.data;
        if (scope instanceof ScopeForEach) {
            this.registerChildren(element, scope, observeableData);
            this.scope.push(scope);
        }
        else if (scope instanceof ScopeForOf) {
            this.registerChildren(element, scope, observeableData);
            this.streams.push(scope.HRStream);
        }
        else {
            this.registerChildren(element, scope, observeableData);
            this.streams.push(scope.HRStream);
        }
    }
    runtimeRendering(tree) {
        let element = null;
        if (typeof tree.tag == 'string') {
            element = document.createElement(tree.tag);
        }
        else if (typeof tree.tag == 'object') {
            element = tree.tag.pointer(tree.attributes, tree.children);
        }
        else {
            throw new TypeError('unknown type tag: ' + tree.tag);
        }
        for (const [key, values] of Object.entries(tree.attributes)) {
            if (key[0] == 'o' && key[1] == 'n') {
                const eventInit = [key.slice(2)];
                if (Array.isArray(values)) {
                    for (const value of values) {
                        eventInit.push(value.pointer);
                    }
                }
                element.addEventListener.apply(element, eventInit);
                this.registeredEvent.push({ element, eventInit });
            }
            else if (key[0] == 'i' && key[1] == 'd') {
                for (const value of values) {
                    if (typeof value == 'object') {
                        if (typeof value.pointer == 'symbol') {
                            MAP_ID.set(value.pointer, element);
                            element.id = value.pointer.toString().substr(6, -1);
                            this.registeredId.push(value.pointer);
                        }
                        else {
                            element.id += value.pointer;
                        }
                    }
                    else {
                        element.id += value;
                    }
                }
            }
            else {
                let accumulation = '';
                let observable;
                for (const value of values) {
                    if (typeof value == 'string' ||
                        typeof value == 'number' ||
                        typeof value == 'boolean') {
                        accumulation += value;
                    }
                    else if (typeof value == 'object') {
                        if (value.pointer instanceof ENV.ObservablePrimitiveClass) {
                            if (observable) {
                                throw new Error('Cannot use multiple observeable on a attribute value');
                            }
                            else {
                                observable = value.pointer;
                                accumulation += value.pointer;
                            }
                        }
                        else {
                            accumulation += value.pointer;
                        }
                    }
                    else {
                        throw new TypeError('unknown type value: ' + values);
                    }
                }
                if (observable) {
                    this.registerAttr(element, key, accumulation, observable);
                }
                else {
                    element.setAttribute(key, accumulation);
                }
            }
        }
        for (const child of tree.children) {
            if (child.type == 'text') {
                if (typeof child.text == 'object') {
                    const text = child.text.pointer;
                    if (text instanceof ENV.ObservablePrimitiveClass) {
                        this.registerText(element, text);
                    }
                    else if (text instanceof ContextScope) {
                        this.contextScope(element, text);
                    }
                    else {
                        element.append(child.text.pointer);
                    }
                }
                else {
                    element.append(child.text);
                }
            }
            else {
                element.append(this.runtimeRendering(child));
            }
        }
        return element;
    }
}
