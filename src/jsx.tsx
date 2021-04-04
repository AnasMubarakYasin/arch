/// <reference path="jsx.d.ts" />

type Attributes = {
  [key: string]: string | number | boolean | symbol | EventInit | Observable;
};
type Children = (JSXRuntime | string | number | boolean | Observable)[];
interface SubscribeHandler<V = any> {
  (raw: V): void;
}
interface Observable<V = any> {
  subscribe(handler: SubscribeHandler<V>): any;
  unsubscribe(handler: SubscribeHandler<V>): any;
  get(): V;
  set(val: V): any;
}
export interface WEBComponent extends HTMLElement {
  create(attribute: Attributes): any;
}
export interface FunctionComponent extends JSX.ElementFunction {}
export interface ClassComponent extends JSX.ElementClass {
  new (attribute: Attributes, ...slot: Children): ClassComponent;
}
type Tag = string | FunctionComponent | ClassComponent;
type EventInit =
  | [
      type: string,
      listener: EventListenerOrEventListenerObject,
      options?: boolean | EventListenerOptions | undefined
    ]
  | EventListenerOrEventListenerObject;
type RegisteredEvent = { eventInit: EventInit };
type RegisteredID = { symbol: symbol };
type RegisteredObserver = { observer: Observable; handler: SubscribeHandler };

const MAP_ID: Map<symbol, Element> = new Map();
const MAP_EVENT: Map<EventInit, { element: Element; key: string }> = new Map();

export class JSXRuntime {
  registeredEvent: RegisteredEvent[] = [];
  registeredID: RegisteredID[] = [];
  registeredObserver: RegisteredObserver[] = [];
  element: Element | null = null;
  children: Children = [];
  tag: Tag;
  attr: Attributes;
  constructor(tag: Tag, attr: Attributes, children: Children) {
    this.tag = tag;
    this.attr = attr;
    this.children = children;
  }
  create() {
    if (typeof this.tag == 'string') {
      if (this.tag.includes('-')) {
        const Constructor = customElements.get(this.tag);
        this.element = new Constructor() as WEBComponent;
        (this.element as WEBComponent).create(this.attr);
        this.attr = {};
      } else {
        this.element = document.createElement(this.tag);
      }
    } else if (typeof this.tag == 'function') {
      if ((this.tag as ClassComponent).class) {
        const component = new (this.tag as ClassComponent)(
          this.attr,
          ...this.children
        );
        this.element = component.render();
      } else {
        this.element = (this.tag as FunctionComponent)(
          this.attr,
          ...this.children
        );
      }
      this.attr = {};
      this.children.length = 0;
    } else {
      throw new TypeError('JSX unknown tag');
    }
    for (const [key, value] of Object.entries(this.attr)) {
      if (key[0] == 'o' && key[1] == 'n') {
        if (value instanceof Array) {
          this.element.addEventListener.apply(this.element, [
            key,
            ...value,
          ] as any);
        } else if (typeof value == 'function') {
          this.element.addEventListener(key, value);
        } else {
          throw new TypeError('JSX unknown event handler');
        }
        this.registeredEvent.push({ eventInit: value });
        MAP_EVENT.set(value, { element: this.element, key });
      } else if (key == 'id') {
        if (typeof value == 'symbol') {
          this.registeredID.push({ symbol: value });
          MAP_ID.set(value, this.element);
        }
        this.element.id = value.toString();
      } else if (
        typeof value == 'string' ||
        typeof value == 'number' ||
        typeof value == 'boolean'
      ) {
        this.element.setAttribute(key, value + '');
      } else if ((value as Observable).subscribe) {
        const node = document.createAttribute(key);
        const handler = (val: any) => (node.value = val + '');
        node.value = (value as Observable).get() + '';
        (value as Observable).subscribe(handler);
        this.registeredObserver.push({
          handler,
          observer: value as Observable,
        });
      } else {
        throw new TypeError('JSX unknown attribute');
      }
    }
    for (const child of this.children) {
      if (child instanceof JSXRuntime) {
        this.element.append(child.create());
      } else if (
        typeof child == 'string' ||
        typeof child == 'number' ||
        typeof child == 'boolean'
      ) {
        this.element.append(child + '');
      } else if ((child as Observable).subscribe) {
        const node = document.createTextNode((child as Observable).get() + '');
        const handler = (val: any) => (node.data = val + '');
        node.data = (child as Observable).get() + '';
        (child as Observable).subscribe(handler);
        this.registeredObserver.push({
          handler,
          observer: child as Observable,
        });
      } else {
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

export function addEvent(eventInit: EventInit, key?: string) {
  event('add', eventInit, key);
}

export function removeEvent(eventInit: EventInit, key?: string) {
  event('remove', eventInit, key);
}

function event(method: 'add' | 'remove', eventInit: EventInit, key?: string) {
  const registered = MAP_EVENT.get(eventInit);
  if (registered) {
    key = key ? key : registered.key;
    if (eventInit instanceof Array) {
      if (method == 'remove') {
        registered.element.removeEventListener.apply(registered.element, [
          key,
          ...eventInit,
        ] as any);
      } else {
        registered.element.addEventListener.apply(registered.element, [
          key,
          ...eventInit,
        ] as any);
      }
    } else if (typeof eventInit == 'function') {
      if (method == 'remove') {
        registered.element.removeEventListener(key, eventInit);
      } else {
        registered.element.addEventListener(key, eventInit);
      }
    } else {
      throw new TypeError('Unknown type event init');
    }
  }
}

export function jsx(tag: Tag, attr?: Attributes, ...children: Children) {
  return new JSXRuntime(tag, attr ?? {}, children);
}

// export function frag() {}
