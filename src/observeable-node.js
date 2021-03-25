class ObserveableNodeUnsafe {
    constructor() {
        this.disconnected = true;
        this.observerHandlerList = [];
    }
    get Class() {
        return ObserveableNodeUnsafe;
    }
    observe(handler) {
        if (typeof handler == 'function') {
            this.observerHandlerList.push(handler);
        }
        else {
            throw new TypeError('Type handler must be a function');
        }
        return this;
    }
    unobserve(handler) {
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
        }
        else {
            throw new TypeError('Type handler must be a function');
        }
    }
    notify(info) {
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
        this.disconnected = true;
        return this;
    }
}
export class ObserveableTextNode extends ObserveableNodeUnsafe {
    constructor(value = '') {
        super();
        this.observerInit = { characterData: true, characterDataOldValue: true, childList: true };
        this.element = null;
        this.typeValue = typeof value;
        this.target = document.createTextNode(value);
        this.prevValue = value;
        this.nodeType = this.target.nodeType;
        this.observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                this.notify({
                    newValue: mutation.target.textContent,
                    oldValue: mutation.oldValue ?? '',
                    cancelChanged: false,
                    stopPropagation: false
                });
            }
        });
    }
    attachTo(element) {
        this.element = element;
        element.append(this.target);
        return this;
    }
    set(value) {
        if (this.target.textContent != value) {
            this.target.textContent = value;
        }
        return this;
    }
    get() {
        return this.target.textContent;
    }
}
export class ObserveableAttrNode extends ObserveableNodeUnsafe {
    constructor(key, value = '') {
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
                    oldValue: mutation.oldValue,
                    cancelChanged: false,
                    stopPropagation: false,
                });
            }
        });
        this.observerInit = { attributeFilter: [this.node.name], attributeOldValue: true };
        this.update();
    }
    update() {
        this.set(this.list.join(' '));
    }
    attachTo(element) {
        this.target = element;
        element.setAttributeNode(this.node);
        return this;
    }
    set(value) {
        if (value != this.node.value) {
            this.node.value = value + '';
        }
        return this;
    }
    get() {
        return this.node.value;
    }
    item(index) {
        if (index > -1 && index < this.length) {
            return this.list[index];
        }
        else {
            throw new RangeError('index out of bound: ' + index);
        }
    }
    contains(value) {
        return this.list.includes(value);
    }
    add(value) {
        this.list.push(value += '');
        this.update();
        return this;
    }
    remove(...values) {
        for (const value of values) {
            const index = this.list.indexOf(value + '');
            if (index != -1) {
                this.list.splice(index, 1);
                this.update();
            }
            else {
                throw new Error('value not found: ' + value);
            }
        }
        return this;
    }
    replace(oldValue, newValue) {
        const index = this.list.indexOf(oldValue + '');
        if (index != -1) {
            this.list.splice(index, 1, newValue + '');
            this.update();
        }
        else {
            throw new Error('value not found: ' + oldValue);
        }
        return this;
    }
    supports() {
        throw new Error('Method not implemented.');
    }
    toggle(value, force) {
        let exist = this.list.includes(value);
        if (exist || force == false) {
            this.remove(value);
        }
        else {
            this.add(value);
        }
        return exist;
    }
    keys() {
        return this.list.keys();
    }
}
export class ObserveableNode extends ObserveableNodeUnsafe {
    constructor(element) {
        super();
        this.observerInit = { attributes: true, characterData: true, subtree: true, childList: true };
        this.target = element;
        this.typeValue = typeof element;
        this.prevValue = element;
        this.parent = null;
        this.observer = new MutationObserver((mutations) => { });
    }
    attachTo(element) {
        element.append(this.target);
        this.parent = element;
        return this;
    }
    set(value) {
        if (this.target.isConnected) {
            if (this.target.replaceWith) {
                this.target.replaceWith(value);
            }
            else {
                if (this.target.parentElement) {
                    this.target.parentElement.replaceChild(value, this.target);
                }
                else {
                    throw new Error('element parent not exist');
                }
            }
        }
        this.target = value;
        return this;
    }
    append(...nodeList) {
        this.target.append(...nodeList);
        return this;
    }
    replaceChildren(...nodes) {
        this.target.replaceChildren(...nodes);
    }
    get() {
        return this.target;
    }
    render() {
        return this.target;
    }
}
export class ObserveableChildNodes extends ObserveableNodeUnsafe {
    constructor(...nodes) {
        super();
        this.observerInit = { attributes: true, characterData: true, subtree: true, childList: true };
        this.trusted = false;
        this.prevValue = nodes.slice();
        this.oldValue = { length: nodes.length, method: 'set', parameter: nodes, event: 'add' };
        this.typeValue = typeof nodes;
        this.target = document.createDocumentFragment();
        this.target.append(...nodes);
        this.observer = new MutationObserver((mutations) => { });
    }
    attachTo(parent) {
        parent.append(this.target);
        this.target = parent;
        return this;
    }
    set(nodes) {
        let length = nodes.length;
        if (length == 0) {
            this.clear();
            return this;
        }
        const childrenLength = this.target.children.length;
        let mode = 'add';
        if (length == childrenLength) {
            mode = 'replace';
        }
        else if (nodes.length < childrenLength) {
            mode = 'delete';
        }
        const lastIndex = length - 1;
        const children = this.target.children;
        for (let index = 0; index < length; index++) {
            const element = children[index];
            const node = nodes[index];
            if (node.isEqualNode(element) == false) {
                if (index == 0) {
                    if (mode == 'add') {
                        this.unshift(node);
                    }
                    else if (mode == 'delete') {
                        this.shift();
                        index--;
                    }
                    else {
                        element.replaceWith(node);
                    }
                }
                else if (index == lastIndex) {
                    if (mode == 'add') {
                        this.push(node);
                    }
                    else if (mode == 'delete') {
                        this.pop();
                    }
                    else {
                        element.replaceWith(node);
                    }
                }
                else {
                    if (mode == 'add') {
                        this.target.insertBefore(node, element);
                    }
                    else if (mode == 'delete') {
                        element.remove();
                        index--;
                    }
                    else {
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
    get() {
        return this.target.children;
    }
    splice(start = 0, deleteCount = 0, ...nodes) {
        const deleted = [];
        const length = this.target.children.length;
        let limit = 0;
        if (start < 0) {
            start = length + start;
            limit = start + deleteCount;
        }
        else {
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
            }
            else {
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
    concat(...nodes) {
        return [...this.target.children, ...nodes];
    }
    forEach(callBackFunc) {
        const length = this.target.children.length;
        const children = this.target.children;
        for (let index = 0; index < length; index++) {
            callBackFunc(children[index], index);
        }
    }
    push(...nodes) {
        this.target.append(...nodes);
        return this;
    }
    unshift(...nodes) {
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
    sort(compareFunc) {
        return [...this.target.children].sort(compareFunc);
    }
    reverse() {
        return [...this.target.children].reverse();
    }
    filter(predicate) {
        return [...this.target.children].filter(predicate);
    }
    some(predicate) {
        return [...this.target.children].some(predicate);
    }
    every(predicate) {
        return [...this.target.children].every(predicate);
    }
    find(predicate) {
        return [...this.target.children].find(predicate);
    }
    findIndex(predicate) {
        return [...this.target.children].findIndex(predicate);
    }
}
