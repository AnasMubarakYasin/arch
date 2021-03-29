import { DataAPI } from "./unsafe-util";

type NodeElement = 1
type NodeAttr = 2;
type NodeText = 3
type NodeType = NodeElement | NodeAttr | NodeText | number;
type NotifyInfo<T> = {
    newValue: T;
    oldValue: T;
    data?: any[];
    cancelChanged: boolean;
    stopPropagation: boolean;
}
type ObserverHandler<T> = (info: NotifyInfo<T>) => void;
type ChangeInfo = {
    event: 'add' | 'remove' | 'unknown'
    method: 'push' | 'pop' | 'unshift' | 'shift' | 'splice' | 'set';
    parameter: (string | number | Node | NodeList)[];
    length: number;
}
type Predicate = (value: Element, index: number) => boolean;
type Compare = (a: Element, b: Element) => number;

abstract class ObserveableNodeUnsafe<Value, VHandler = Value> {
    get Class() {
        return this.constructor;
    }

    abstract target: Node;
    abstract observer: MutationObserver;
    abstract observerInit: MutationObserverInit;
    abstract typeValue: string;
    abstract prevValue: Value;

    observerHandlerList: ObserverHandler<VHandler>[] = [];

    abstract attachTo(element: Element): void;
    abstract set(value: Value): void
    abstract get(): Value


    observe(handler: ObserverHandler<VHandler>) {
        if (typeof handler == 'function') {
            this.observerHandlerList.push(handler);
        } else {
            throw new TypeError('Type handler must be a function');
        }
        return this;
    }

    unobserve(handler: ObserverHandler<VHandler>) {
        if (typeof handler == 'function') {
            let index = 0;
            for (const observerHandler of this.observerHandlerList) {
                if (Object.is(observerHandler, handler)) {
                    this.observerHandlerList.splice(index, 1);
                    return true;
                }
                index++;
            }
            return false;
        } else {
            throw new TypeError('Type handler must be a function');
        }
    }

    protected notify(info: NotifyInfo<VHandler>) {
        const startTime = Date.now();
        for (const handler of this.observerHandlerList) {
            handler(info);
        }
        console.log(this.constructor.name, 'take time notify', (Date.now() - startTime), 'ms');
    }
    connect() {
        this.observer.observe(this.target, this.observerInit);
    }
    disconnect() {
        this.observer.disconnect();
        return this;
    }
}

export class ObserveableTextNode extends ObserveableNodeUnsafe<string> {
    prevValue: string;
    typeValue: string;
    nodeType: NodeType;
    observer: MutationObserver;
    observerInit: MutationObserverInit = { characterData: true, characterDataOldValue: true, childList: true };

    target: Text;
    private element: Element | null = null;
    constructor(value = '') {
        super();

        this.typeValue = typeof value
        this.target = document.createTextNode(value);
        this.prevValue = value;
        this.nodeType = this.target.nodeType;
        this.observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                this.notify({
                    newValue: mutation.target.textContent as string,
                    oldValue: mutation.oldValue ?? '',
                    cancelChanged: false,
                    stopPropagation: false
                });
            }
        });
    }
    attachTo(element: Element) {
        this.element = element;
        element.append(this.target);
        return this;
    }
    set(value: string) {
        if (this.target.textContent != value) {
            this.target.textContent = value
        }
        return this;
    }
    get() {
        return this.target.textContent as string;
    }
}
export class ObserveableAttrNode extends ObserveableNodeUnsafe<string> {
    prevValue: string;
    observer: MutationObserver;
    typeValue: string;
    name: string;
    length: number;
    observerInit: MutationObserverInit;
    node: Attr;
    target!: Element;

    private list: string[]
    constructor(key: string, value = '') {
        super();

        this.name = key;
        this.typeValue = typeof value;
        this.list = [value];
        this.prevValue = value;
        this.length = this.list.length;
        this.node = document.createAttribute(key);
        this.observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                this.notify({
                    newValue: this.node.value,
                    oldValue: mutation.oldValue as string,
                    cancelChanged: false,
                    stopPropagation: false,
                });
            }
        });
        this.observerInit = { attributeFilter: [this.node.name], attributeOldValue: true };
        this.update();
    }
    private update() {
        this.set(this.list.join(' '));
    }
    attachTo(element: Element) {
        this.target = element;
        element.setAttributeNode(this.node);
        return this;
    }
    set(value: string | number | boolean) {
        if (value != this.node.value) {
            this.node.value = value + '';
        }
        return this;
    }
    get() {
        return this.node.value as string;
    }

    item(index: number): string {
        if (index > -1 && index < this.length) {
            return this.list[index];
        } else {
            throw new RangeError('index out of bound: ' + index);
        }
    }
    contains(value: string) {
        return this.list.includes(value);
    }
    add(value: string | number | boolean) {
        this.list.push(value += '');
        this.update();
        return this;
    }
    remove(...values: Array<string | number | boolean>) {
        for (const value of values) {
            const index = this.list.indexOf(value + '');
            if (index != -1) {
                this.list.splice(index, 1);
                this.update();
            } else {
                throw new Error('value not found: ' + value);
            }
        }
        return this;
    }
    replace(oldValue: string | number | boolean, newValue: string | number | boolean) {
        const index = this.list.indexOf(oldValue + '');
        if (index != -1) {
            this.list.splice(index, 1, newValue + '');
            this.update();
        } else {
            throw new Error('value not found: ' + oldValue);
        }
        return this;
    }
    supports(): boolean {
        throw new Error('Method not implemented.');
    }
    toggle(value: string, force?: boolean): boolean {
        let exist = this.list.includes(value);
        if (exist || force == false) {
            this.remove(value);
        } else {
            this.add(value);
        }
        return exist;
    }
    keys() {
        return this.list.keys();
    }
}

export class ObserveableNode<TElement extends Element> extends ObserveableNodeUnsafe<TElement> {
    observer: MutationObserver;
    observerInit: MutationObserverInit = { attributes: true, characterData: true, subtree: true, childList: true };
    typeValue: string;
    prevValue: TElement;
    parent: Element | null;
    target: TElement;

    constructor(element: TElement) {
        super();

        this.target = element;
        this.typeValue = typeof element;
        this.prevValue = element;
        this.parent = null;
        this.observer = new MutationObserver((mutations) => { });
    }
    attachTo(element: Element) {
        element.append(this.target);
        this.parent = element;

        return this;
    }
    set(value: TElement) {
        if (this.target.isConnected) {
            if (this.target.replaceWith) {
                this.target.replaceWith(value);
            } else {
                if (this.target.parentElement) {
                    this.target.parentElement.replaceChild(value, this.target);
                } else {
                    throw new Error('element parent not exist');
                }
            }
        }
        this.target = value;
        return this;
    }
    append(...nodeList: (Node | string)[]) {
        this.target.append(...nodeList);
        return this;
    }
    replaceChildren(...nodes: (Node | string)[]) {
        this.target.replaceChildren(...nodes);
    }
    get(): TElement {
        return this.target;
    }
    render() {
        return this.target;
    }
}

export class ObserveableChildNodes extends ObserveableNodeUnsafe<Array<Node | string> | HTMLCollection, ChangeInfo> {
    prevValue: (string | Node)[] | HTMLCollection;
    observer: MutationObserver;
    observerInit: MutationObserverInit = { attributes: true, characterData: true, subtree: true, childList: true };
    typeValue: string;
    oldValue: ChangeInfo;
    trusted: boolean = false;
    target: Node & ParentNode & ChildNode | DocumentFragment;

    constructor(...nodes: Array<Node | string>) {
        super();

        this.prevValue = nodes.slice();
        this.oldValue = { length: nodes.length, method: 'set', parameter: nodes, event: 'add' };
        this.typeValue = typeof nodes;
        this.target = document.createDocumentFragment();
        this.target.append(...nodes);
        this.observer = new MutationObserver((mutations) => { });
    }
    attachTo(parent: Element): ObserveableChildNodes {
        parent.append(this.target);
        this.target = parent;
        return this;
    }
    set(nodes: Array<Node | string> | HTMLCollection) {
        this.target.replaceChildren(...nodes);
        return this;
    }
    diff(nodes: Array<Node | string> | HTMLCollection) {
        let length = nodes.length;
        if (length == 0) {
            this.clear();
            return this;
        }
        const childrenLength = this.target.children.length;
        let mode: 'add' | 'delete' | 'replace' = 'add';
        if (length == childrenLength) {
            mode = 'replace';
        } else if (nodes.length < childrenLength) {
            mode = 'delete';
        }
        const lastIndex = length-1
        const children: HTMLCollection | Element[] = this.target.children;
        for (let index = 0; index < length; index++) {
            const element = children[index];
            const node = nodes[index] as Node;

            if (node.isEqualNode(element) == false) {
                if (index == 0) {
                    if (mode == 'add') {
                        this.unshift(node);
                    } else if (mode == 'delete') {
                        this.shift();
                        index--;
                    } else {
                        element.replaceWith(node);
                    }
                } else if (index == lastIndex) {
                    if (mode == 'add') {
                        this.push(node);
                    } else if (mode == 'delete') {
                        this.pop();
                    } else {
                        element.replaceWith(node);
                    }
                } else {
                    if (mode == 'add') {
                        this.target.insertBefore(node, element)
                    } else if (mode == 'delete') {
                        element.remove();
                        index--;
                    } else {
                        element.replaceWith(node);
                    }
                }
            }
        }
        if (mode == 'delete') {
            this.splice(nodes.length - this.target.children.length, this.target.children.length - nodes.length);
        }
        return this;
    }
    adapter(data: DataAPI, render: (data: any) => Element[]) {
        const method = data.method
        if (method == 'pop' || method == 'shift' || method == 'reverse') {
            this[method]();
        } else if (method == 'push' || method == 'unshift') {
            this[method](...render(data.parameter[0]));
        } else if (method == 'splice') {
            this[method](data.parameter[0], data.parameter[1], ...render(data.parameter[2]));
        } else if (method == 'set') {
            this[method](render(data.parameter[0]));
        } else {
            throw new TypeError('Not support api');
        }
    }
    get() {
        return this.target.children;
    }
    splice(start = 0, deleteCount = 0, ...nodes: Array<Node | string>) {
        const deleted = [];
        const length = this.target.children.length;
        let limit = 0;
        if (start < 0) {
            start = length + start;
            limit = start + deleteCount;
        } else {
            limit = deleteCount + start;
        }
        limit = limit > length ? length : limit;
        const children = [...this.target.children];
        for (let index = start; index < limit; index++) {
            deleted.push(document.adoptNode(children[index]));
        }
        if (nodes.length) {
            const tmp = document.createDocumentFragment();
            tmp.append(...nodes);
            if (this.target.children.length) {
                this.target.insertBefore(tmp, this.target.children[start]);
            } else {
                this.target.append(tmp);
            }
        }

        return deleted;
    }
    clear() {

        for (const child of [...this.target.children]) {
            child.remove();
        }

        return this;
    }
    concat(...nodes: Array<Node | string>) {
        return [...this.target.children, ...nodes];
    }
    forEach(callBackFunc: (value: Element, index: number) => void) {
        const length = this.target.children.length;
        const children = this.target.children;
        for (let index = 0; index < length; index++) {
            callBackFunc(children[index], index);
        }
    }
    push(...nodes: Array<Node | string>) {

        this.target.append(...nodes);

        return this;
    }
    unshift(...nodes: Array<Node | string>) {

        this.target.prepend(...nodes);

        return this;
    }
    pop() {

        const element = this.target.children.item(this.target.children.length - 1);
        if (element) {
            return document.adoptNode(element);
        }

        return this;
    }
    shift() {

        const element = this.target.children.item(0);
        if (element) {
            return document.adoptNode(element);
        }

        return this;
    }

    sort(compareFunc: Compare) {
        return [...this.target.children].sort(compareFunc);
    }
    reverse() {
        return this.set([...this.target.children].reverse());
    }


    filter(predicate: Predicate) {
        return [...this.target.children].filter(predicate);
    }
    some(predicate: Predicate) {
        return [...this.target.children].some(predicate);
    }
    every(predicate: Predicate) {
        return [...this.target.children].every(predicate);
    }
    find(predicate: Predicate) {
        return [...this.target.children].find(predicate);
    }
    findIndex(predicate: Predicate) {
        return [...this.target.children].findIndex(predicate);
    }

}
