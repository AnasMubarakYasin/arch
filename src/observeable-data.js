import { ObserverStructureUnsafe, ObserverUnsafe } from './unsafe-util.js';
class ObserveableValue extends ObserverUnsafe {
}
class ObserveableMap extends ObserverStructureUnsafe {
    constructor(data) {
        super(data);
        this.size = 0;
        for (const [key, value] of Object.entries(data)) {
            let obserify;
            if (Array.isArray(value)) {
                obserify = new ObserveableList(value);
            }
            else if (typeof value == 'object') {
                obserify = new ObserveableMap(value);
            }
            else {
                obserify = new ObserveableValue(value);
            }
            Object.defineProperty(this, key, {
                // set(value) {
                //     obserify.set(value);
                // },
                // get() {
                //     return obserify.get();
                // },
                value: obserify,
                enumerable: true
            });
            obserify.subscribe((value) => this.value[key] = value);
            this.size++;
        }
    }
    set(value) {
        let publish = false;
        let change = {};
        for (const [key, val] of Object.entries(value)) {
            if (!this[key]) {
                throw new RangeError('Key not found: ' + key);
            }
            if (val != this.value[key]) {
                const obserify = this[key];
                change[key] = obserify.set(val);
                publish = true;
            }
        }
        if (publish) {
            this.publish(this.value, { method: 'set', parameter: [change] });
        }
        return this;
    }
    entries() {
        return this[Symbol.iterator];
    }
    *[Symbol.iterator]() {
        for (const iterator of Object.entries(this.value)) {
            yield {
                key: iterator[0],
                value: iterator[1]
            };
        }
    }
    async *[Symbol.asyncIterator]() {
        yield* this[Symbol.iterator]();
    }
}
class ObserveableList extends ObserverStructureUnsafe {
    constructor(list) {
        super(list);
        // [index: number]: Item;
        this.selected = -1;
        this.observeables = this.toObserveable(list);
    }
    get length() {
        return this.value.length;
    }
    set(value) {
        if (Array.isArray(value)) {
            this.value = value;
            this.observeables = this.toObserveable(value);
            this.publish(value, { method: 'set', parameter: [this.observeables] });
        }
        else {
            throw new TypeError(`Mismatch on type, expect array but ${typeof value}`);
        }
        return this;
    }
    setByObserver(items) {
        this.publish(this.toRaw(items), { method: 'set', parameter: [items] });
        return this;
    }
    update(data, value) {
        if (!value) {
            value = this.value;
        }
        this.publish(value, data);
        return this;
    }
    toObserveable(items) {
        const result = [];
        for (const item of items) {
            let obserify;
            if (Array.isArray(item)) {
                obserify = new ObserveableList(item);
            }
            else if (typeof item == 'object') {
                obserify = new ObserveableMap(item);
            }
            else {
                obserify = new ObserveableValue(item);
            }
            result.push(obserify);
        }
        return result;
    }
    toRaw(items) {
        const result = [];
        for (const item of items) {
            result.push(item.get());
        }
        return result;
    }
    at(index) {
        if (typeof index != 'number') {
            throw new TypeError('Index type must a number');
        }
        if (index > -1 && index < this.length) {
            this.selected = index;
            return this.observeables[index];
        }
        else if ((index = this.length + index) > -1) {
            this.selected = index;
            return this.observeables[index];
        }
        else {
            throw new RangeError('Index out of bounds: ' + index);
        }
    }
    pop() {
        this.value.pop();
        this.observeables.pop();
        return this.update({ method: 'pop', parameter: [] });
    }
    push(...items) {
        this.value.push(...items);
        const newValue = this.toObserveable(items);
        this.observeables.push(...newValue);
        return this.update({ method: 'push', parameter: [newValue] });
    }
    reverse() {
        this.value.reverse();
        this.observeables.reverse();
        return this.update({ method: 'reverse', parameter: [] });
    }
    shift() {
        this.value.shift();
        this.observeables.shift();
        return this.update({ method: 'shift', parameter: [] });
    }
    sort(compareFn) {
        this.observeables.sort(compareFn);
        this.value = this.toRaw(this.observeables);
        return this.update({ method: 'sort', parameter: [compareFn] });
    }
    splice(start, deleteCount, ...rest) {
        this.value.splice(start, deleteCount, ...rest);
        const newValue = this.toObserveable(rest);
        this.observeables.splice(start, deleteCount, ...newValue);
        return this.update({ method: 'splice', parameter: [start, deleteCount, newValue] });
    }
    unshift(...items) {
        this.value.unshift(...items);
        const newValue = this.toObserveable(items);
        this.observeables.unshift(...this.toObserveable(items));
        return this.update({ method: 'unshift', parameter: [newValue] });
    }
    slice(start, end) {
        return this.observeables.slice(start, end);
    }
    concat(...items) {
        return this.observeables.concat(...items);
    }
    join(separator) {
        return this.observeables.join(separator);
    }
    indexOf(searchElement, fromIndex) {
        return this.observeables.indexOf(searchElement, fromIndex);
    }
    lastIndexOf(searchElement, fromIndex) {
        return this.observeables.lastIndexOf(searchElement, fromIndex);
    }
    every(predicate, thisArg) {
        return this.observeables.every(predicate, thisArg);
    }
    some(predicate, thisArg) {
        return this.observeables.some(predicate, thisArg);
    }
    forEach(callbackfn, thisArg) {
        this.observeables.forEach(callbackfn, thisArg);
    }
    map(callbackfn, thisArg) {
        return this.observeables.map(callbackfn, thisArg);
    }
    filter(predicate, thisArg) {
        return this.observeables.filter(predicate, thisArg);
    }
    reduce(callbackfn, initialValue) {
        return this.observeables.reduce(callbackfn, initialValue);
    }
    reduceRight(callbackfn, initialValue) {
        return this.observeables.reduceRight(callbackfn, initialValue);
    }
    find(predicate, thisArg) {
        return this.observeables.find(predicate, thisArg);
    }
    findIndex(predicate, thisArg) {
        return this.observeables.findIndex(predicate, thisArg);
    }
    fill(value, start, end) {
        return this.observeables.fill(value, start, end);
    }
    copyWithin(target, start, end) {
        return this.observeables.copyWithin(target, start, end);
    }
    includes(searchElement, fromIndex) {
        return this.observeables.includes(searchElement, fromIndex);
    }
    flatMap(callback, thisArg) {
        return this.observeables.flatMap(callback, thisArg);
    }
    flat(depth = 1) {
        return this.observeables.flat(depth);
    }
    [Symbol.iterator]() {
        return this.observeables[Symbol.iterator]();
    }
}
let ObserveableData = /** @class */ (() => {
    class ObserveableData {
    }
    ObserveableData.Value = ObserveableValue;
    ObserveableData.Map = ObserveableMap;
    ObserveableData.List = ObserveableList;
    return ObserveableData;
})();
export { ObserveableData };
