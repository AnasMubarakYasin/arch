import { HtmlRawStream } from './html-stream.js';
import { ENV, MAP_ID } from './constant.js';
import { ObservableValue } from '../observable-data.js';
import {
  ObserveableAttrNode,
  ObserveableTextNode,
  ObserveableChildNodes,
  ObserveableNode,
} from '../observable-node.js';
import { TemplateStream, TemplateTemplating } from './index.js';
import {
  TemplateTree,
  TemplatePointer,
  EventRegistered,
  ObserveableRegistered,
  TemplatePreset,
  Primitive,
  InferIterable,
} from './type.js';

class ContextScope<D> {
  HRStream: HtmlRawStream = new HtmlRawStream();
  stream: TemplateStream;
  data: D;
  constructor(data: D) {
    this.data = data;
    this.stream = this.HRStream.stream.bind(this.HRStream);
  }
  render() {
    this.HRStream.restart();
    return this.HRStream.bufferRender;
  }
}

export class WatchScope<D> extends ContextScope<D> {
  view: (raw: TemplateStream, data: D) => void;
  constructor(data: D, view: (raw: TemplateStream, data: D) => void) {
    super(data);
    this.view = view;
  }
  render(data?: D) {
    this.HRStream.restart();
    this.view(this.stream, data ?? this.data);
    return this.HRStream.bufferRender;
  }
}

export class ScopeForOf<
  D extends Iterable<T>,
  T = InferIterable<D>
> extends ContextScope<D> {
  view: (raw: TemplateStream, item: T, index: number) => void;
  constructor(
    list: D,
    view: (raw: TemplateStream, item: T, index: number) => void
  ) {
    super(list);
    this.view = view;
  }
  render(list?: D) {
    this.HRStream.restart();
    let index = 0;
    for (const item of list ?? this.data) {
      this.view(this.stream, item, index++);
    }
    return this.HRStream.bufferRender;
  }
}

export class ScopeForEach<D extends Iterable<T>, T = InferIterable<D>> {
  data;
  view;
  template: TemplateRuntime[]
  constructor(list: D, view: (item: T, index: number) => TemplateRuntime) {
    this.data = list;
    this.view = view;
    this.template = [];
  }
  render(data: D) {
    const nodes: Element[] = [];
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
  tree: TemplateTree;
  pointers: TemplatePointer[];
  registeredEvent: EventRegistered[];
  registeredId: symbol[];
  registeredObservable: ObserveableRegistered[];
  subsTemplate: TemplateRuntime[];
  scope: ScopeForEach<any>[]
  streams: HtmlRawStream[];
  element!: Element;
  constructor(templatePreset: TemplatePreset) {
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
      registeredObservable.observer.unsubscribe(
        registeredObservable.handler as any
      );
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
  render(selector?: string | Element) {
    this.element = this.runtimeRendering(this.tree);
    if (selector) {
      const comment = document.createComment('generate by html-templating');
      if (typeof selector == 'string') {
        document.querySelector(selector)?.append(comment, this.element);
      } else {
        selector.append(comment, this.element);
      }
    }
    return this;
  }
  protected registerAttr(
    element: Element,
    key: string,
    value: string,
    observable: ObservableValue<Primitive>
  ) {
    const observeableNode = new ObserveableAttrNode(key, value).attachTo(
      element
    );
    const handler = (value: Primitive) => {
      observeableNode.set(value);
    };
    observable.subscribe(handler);
    this.registeredObservable.push({ observer: observable, handler });
  }
  protected registerText(
    element: Element,
    observable: ObservableValue<Primitive>
  ) {
    const observeableNode = new ObserveableTextNode(observable + '').attachTo(
      element
    );
    const handler = (value: Primitive) => {
      observeableNode.set(value + '');
    };
    observable.subscribe(handler);
    this.registeredObservable.push({ observer: observable, handler });
  }
  protected registerChildren(
    element: Element,
    scope: ContextScope<unknown>,
    observable: unknown
  ) {
    if (observable instanceof ENV.ObservableArrayClass) {
      const observeableNode = new ObserveableChildNodes(
        ...scope.render()
      ).attachTo(element);
      const handler = (data: any) => {
        observeableNode.adapterAPI(data, scope.render.bind(scope));
      };
      observable.subscribeAPI(handler);
      this.registeredObservable.push({ observer: observable, handler });
    } else if (observable instanceof ENV.ObservableObjectClass) {
      const observeableNode = new ObserveableNode(element).append(
        ...scope.render()
      );
      const handler = (value: any) => {
        observeableNode.replaceChildren(...scope.render());
      };
      observable.subscribe(handler);
      this.registeredObservable.push({ observer: observable, handler });
    } else {
      element.append(...scope.render());
    }
  }
  protected contextScope(element: Element, scope: ContextScope<unknown>) {
    const observeableData = scope.data;
    if (scope instanceof ScopeForEach) {
      this.registerChildren(element, scope, observeableData);
      this.scope.push(scope);
    } else if (scope instanceof ScopeForOf) {
      this.registerChildren(element, scope, observeableData);
      this.streams.push(scope.HRStream);
    } else {
      this.registerChildren(element, scope, observeableData);
      this.streams.push(scope.HRStream);
    }
  }
  runtimeRendering(tree: TemplateTree) {
    let element: Element | null = null;
    if (typeof tree.tag == 'string') {
      element = document.createElement(tree.tag as string);
    } else if (typeof tree.tag == 'object') {
      element = tree.tag.pointer(tree.attributes, tree.children) as Element;
    } else {
      throw new TypeError('unknown type tag: ' + tree.tag);
    }
    for (const [key, values] of Object.entries(tree.attributes)) {
      if (key[0] == 'o' && key[1] == 'n') {
        const eventInit: any = [key.slice(2)];
        if (Array.isArray(values)) {
          for (const value of values) {
            eventInit.push((value as TemplatePointer).pointer);
          }
        }
        element.addEventListener.apply(element, eventInit);
        this.registeredEvent.push({ element, eventInit });
      } else if (key[0] == 'i' && key[1] == 'd') {
        for (const value of values) {
          if (typeof value == 'object') {
            if (typeof value.pointer == 'symbol') {
              MAP_ID.set(value.pointer, element);
              element.id = value.pointer.toString().substr(6, -1);
              this.registeredId.push(value.pointer);
            } else {
              element.id += value.pointer;
            }
          } else {
            element.id += value;
          }
        }
      } else {
        let accumulation = '';
        let observable: ObservableValue<Primitive> | undefined;
        for (const value of values) {
          if (
            typeof value == 'string' ||
            typeof value == 'number' ||
            typeof value == 'boolean'
          ) {
            accumulation += value;
          } else if (typeof value == 'object') {
            if (value.pointer instanceof ENV.ObservablePrimitiveClass) {
              if (observable) {
                throw new Error(
                  'Cannot use multiple observeable on a attribute value'
                );
              } else {
                observable = value.pointer;
                accumulation += value.pointer;
              }
            } else {
              accumulation += value.pointer;
            }
          } else {
            throw new TypeError('unknown type value: ' + values);
          }
        }
        if (observable) {
          this.registerAttr(element, key, accumulation, observable);
        } else {
          element.setAttribute(key, accumulation);
        }
      }
    }
    for (const child of tree.children) {
      if (child.type == 'text') {
        if (typeof child.text == 'object') {
          const text = child.text.pointer as any;
          if (text instanceof ENV.ObservablePrimitiveClass) {
            this.registerText(element, text);
          } else if (text instanceof ContextScope) {
            this.contextScope(element, text);
          } else {
            element.append(child.text.pointer);
          }
        } else {
          element.append(child.text);
        }
      } else {
        element.append(this.runtimeRendering(child));
      }
    }
    return element;
  }
}
