/// <reference path="jsx.d.ts" />
const MAP_ID = new Map();
const MAP_EVENT = new Map();
export class JSXRuntime {
    constructor(tag, attr, children) {
        this.registeredEvent = [];
        this.registeredID = [];
        this.registeredObserver = [];
        this.element = null;
        this.children = [];
        this.tag = tag;
        this.attr = attr;
        this.children = children;
    }
    create() {
        if (typeof this.tag == 'string') {
            if (this.tag.includes('-')) {
                const Constructor = customElements.get(this.tag);
                this.element = new Constructor();
                this.element.create(this.attr);
                this.attr = {};
            }
            else {
                this.element = document.createElement(this.tag);
            }
        }
        else if (typeof this.tag == 'function') {
            if (this.tag.class) {
                const component = new this.tag(this.attr, ...this.children);
                this.element = component.render();
            }
            else {
                this.element = this.tag(this.attr, ...this.children);
            }
            this.attr = {};
            this.children.length = 0;
        }
        else {
            throw new TypeError('JSX unknown tag');
        }
        for (const [key, value] of Object.entries(this.attr)) {
            if (key[0] == 'o' && key[1] == 'n') {
                if (value instanceof Array) {
                    this.element.addEventListener.apply(this.element, [
                        key,
                        ...value,
                    ]);
                }
                else if (typeof value == 'function') {
                    this.element.addEventListener(key, value);
                }
                else {
                    throw new TypeError('JSX unknown event handler');
                }
                this.registeredEvent.push({ eventInit: value });
                MAP_EVENT.set(value, { element: this.element, key });
            }
            else if (key == 'id') {
                if (typeof value == 'symbol') {
                    this.registeredID.push({ symbol: value });
                    MAP_ID.set(value, this.element);
                }
                this.element.id = value.toString();
            }
            else if (typeof value == 'string' ||
                typeof value == 'number' ||
                typeof value == 'boolean') {
                this.element.setAttribute(key, value + '');
            }
            else if (value.subscribe) {
                const node = document.createAttribute(key);
                const handler = (val) => (node.value = val + '');
                node.value = value.get() + '';
                value.subscribe(handler);
                this.registeredObserver.push({
                    handler,
                    observer: value,
                });
            }
            else {
                throw new TypeError('JSX unknown attribute');
            }
        }
        for (const child of this.children) {
            if (child instanceof JSXRuntime) {
                this.element.append(child.create());
            }
            else if (typeof child == 'string' ||
                typeof child == 'number' ||
                typeof child == 'boolean') {
                this.element.append(child + '');
            }
            else if (child.subscribe) {
                const node = document.createTextNode(child.get() + '');
                const handler = (val) => (node.data = val + '');
                node.data = child.get() + '';
                child.subscribe(handler);
                this.registeredObserver.push({
                    handler,
                    observer: child,
                });
            }
            else {
                throw new TypeError('JSX unknown child');
            }
        }
        return this.element;
    }
    on() {
        for (const registered of this.registeredEvent) {
            addEvent(registered.eventInit);
        }
        for (const registered of this.registeredObserver) {
            registered.observer.subscribe(registered.handler);
        }
    }
    off() {
        for (const registered of this.registeredEvent) {
            removeEvent(registered.eventInit);
        }
        for (const registered of this.registeredObserver) {
            registered.observer.unsubscribe(registered.handler);
        }
    }
    destroy() {
        this.off();
        for (const registered of this.registeredID) {
            MAP_ID.delete(registered.symbol);
        }
        for (const child of this.children) {
            if (child instanceof JSXRuntime) {
                child.destroy();
            }
        }
        this.registeredEvent.length = 0;
        this.registeredObserver.length = 0;
        this.registeredID.length = 0;
        this.children.length = 0;
        this.element = null;
    }
}
export function addEvent(eventInit, key) {
    event('add', eventInit, key);
}
export function removeEvent(eventInit, key) {
    event('remove', eventInit, key);
}
function event(method, eventInit, key) {
    const registered = MAP_EVENT.get(eventInit);
    if (registered) {
        key = key ? key : registered.key;
        if (eventInit instanceof Array) {
            if (method == 'remove') {
                registered.element.removeEventListener.apply(registered.element, [
                    key,
                    ...eventInit,
                ]);
            }
            else {
                registered.element.addEventListener.apply(registered.element, [
                    key,
                    ...eventInit,
                ]);
            }
        }
        else if (typeof eventInit == 'function') {
            if (method == 'remove') {
                registered.element.removeEventListener(key, eventInit);
            }
            else {
                registered.element.addEventListener(key, eventInit);
            }
        }
        else {
            throw new TypeError('Unknown type event init');
        }
    }
}
export function jsx(tag, attr, ...children) {
    return new JSXRuntime(tag, attr ?? {}, children);
}
// export function frag() {}
