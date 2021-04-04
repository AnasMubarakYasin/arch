import { ObserverAPIUnsafe, ObserverUnsafe } from './unsafe-util.js';
class ObserifyValue extends ObserverUnsafe {
}
class ObserifyMap extends ObserverAPIUnsafe {
    constructor(data) {
        super(data);
        this.size = 0;
        for (const [key, value] of Object.entries(data)) {
            let obserify;
            if (Array.isArray(value)) {
                obserify = new ObserifyList(value);
            }
            else if (typeof value == 'object') {
                obserify = new ObserifyMap(value);
            }
            else {
                obserify = new ObserifyValue(value);
            }
            Object.defineProperty(this, key, {
                value: obserify,
                enumerable: true
            });
            obserify.subscribe((value) => { this.raw[key] = value; });
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
            if (val != this.raw[key]) {
                const obserify = this[key];
                change[key] = obserify.set(val);
                publish = true;
            }
        }
        if (publish) {
            this.publish(this.raw);
            this.publishAPI({ method: 'set', parameter: [change] });
        }
        return this;
    }
    entries() {
        return this[Symbol.iterator];
    }
    *[Symbol.iterator]() {
        for (const iterator of Object.entries(this.raw)) {
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
class ObserifyList extends ObserverAPIUnsafe {
    constructor(list) {
        super(list);
        // [index: number]: Item;
        this.selected = -1;
        this.observeables = this.toObserveable(list);
    }
    get length() {
        return this.raw.length;
    }
    set(value) {
        if (Array.isArray(value)) {
            this.raw = value;
            this.observeables = this.toObserveable(value);
            this.publish(value);
            this.publishAPI({ method: 'set', parameter: [this.observeables] });
        }
        else {
            throw new TypeError(`Mismatch on type, expect array but ${typeof value}`);
        }
        return this;
    }
    setByObserver(items) {
        this.publish(this.raw = this.toRaw());
        this.publishAPI({ method: 'diff', parameter: [items] });
        return this;
    }
    setTempByObserver(items) {
        this.publish(this.toRaw(items));
        this.publishAPI({ method: 'set', parameter: [items] });
        return this;
    }
    update(value) {
        throw new Error('The method not implement');
    }
    updateByAPI(data) {
        this.publish(this.raw);
        this.publishAPI(data);
        return this;
    }
    toObserveable(items) {
        const result = [];
        for (const item of items) {
            let obserify;
            if (Array.isArray(item)) {
                obserify = new ObserifyList(item);
            }
            else if (typeof item == 'object') {
                obserify = new ObserifyMap(item);
            }
            else {
                obserify = new ObserifyValue(item);
            }
            result.push(obserify);
        }
        return result;
    }
    toRaw(items) {
        const result = [];
        for (const item of items ?? this.observeables) {
            result.push(item.get());
        }
        if (items) {
            this.raw = result;
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
        this.raw.pop();
        this.observeables.pop();
        return this.updateByAPI({ method: 'pop', parameter: [] });
    }
    push(...items) {
        this.raw.push(...items);
        const newValue = this.toObserveable(items);
        this.observeables.push(...newValue);
        return this.updateByAPI({ method: 'push', parameter: [newValue] });
    }
    reverse() {
        this.raw.reverse();
        this.observeables.reverse();
        return this.updateByAPI({ method: 'reverse', parameter: [] });
    }
    shift() {
        this.raw.shift();
        this.observeables.shift();
        return this.updateByAPI({ method: 'shift', parameter: [] });
    }
    sort(compareFn) {
        this.observeables.sort(compareFn);
        this.raw = this.toRaw(this.observeables);
        return this.updateByAPI({ method: 'sort', parameter: [compareFn] });
    }
    splice(start, deleteCount, ...rest) {
        this.raw.splice(start, deleteCount, ...rest);
        const newValue = this.toObserveable(rest);
        this.observeables.splice(start, deleteCount, ...newValue);
        return this.updateByAPI({ method: 'splice', parameter: [start, deleteCount, newValue] });
    }
    unshift(...items) {
        this.raw.unshift(...items);
        const newValue = this.toObserveable(items);
        this.observeables.unshift(...this.toObserveable(items));
        return this.updateByAPI({ method: 'unshift', parameter: [newValue] });
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
// type A = Normalize<{name: string, age: number, pass: false}[]>
// let a:{name: string, age: number, pass: boolean}[];
// a = [{name: 'a', age: 1, pass: false}];
// let list: ObservableList<{ id: number; title: string; description: string; done: boolean; }[]>;
// list = new ObserifyList([{id: 0, title: '', description: '', done: false}]);
let Observable = /** @class */ (() => {
    class Observable {
    }
    Observable.Value = ObserifyValue;
    Observable.Map = ObserifyMap;
    Observable.List = ObserifyList;
    return Observable;
})();
export { Observable };
