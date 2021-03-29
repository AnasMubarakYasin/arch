import { ObserverStructureUnsafe, ObserverUnsafe, DataAPI } from './unsafe-util.js';
type TypeOptional<O> = {
    [P in keyof O]?: O[P];
}
type TypeOf<T> = T extends string ? string : T extends number ? number : T extends boolean ? boolean : never;
type KeyOf<Type> = keyof Type;
type MemberOf<O> = O[keyof O];
type PrimitiveType = string | number | boolean | symbol;
type PrimitiveTypeData<O> = {
    [P in keyof O]: O[P] extends PrimitiveType ? O[P] : never;
}
type InferArray<A> = A extends Array<infer T> ? T : never;
type PrimitiveDataMemberOf<P> = PrimitiveTypeData<P>[keyof PrimitiveTypeData<P>];
type ObserifyValueConstructor = new <O extends PrimitiveType>(value: O) => ObserveableValueInstance<O>;
type ObserifyMatch<Type> = Type extends (number | string) ? ObserveableValueInstance<Type> : Type extends (true | false | boolean) ? ObserveableValueInstance<boolean> : Type extends Array<infer T> ? ObserveableListInstance<Type, T> : Type extends object ? ObserveableMapInstance<Type> : never
type ObserveableDataInstance<T> = ObserveableValueInstance<T extends PrimitiveType ? T : never> | ObserveableListInstance<T extends Array<any> ? T : never, InferArray<T>> | ObserveableMapInstance<T extends object ? T : never>;
export type ObserveableValueInstance<O extends PrimitiveType> = ObserveableValue<O>
type ObserifyMix<O extends object> = {
    [P in keyof O]: ObserifyMatch<O[P]>;
}
type ObserifyMapConstructor = new <O extends object>(data: O) => ObserveableMapInstance<O>;
export type ObserveableMapInstance<O extends object> = ObserveableMap<O> & ObserifyMix<O>
type ObserifyListConstructor = new <O extends Array<M>, M = InferArray<O>>(list: O) => ObserveableListInstance<O, M>;
export type ObserveableListInstance<O extends Array<M>, M = InferArray<O>> = ObserveableList<O, M>;

class ObserveableValue<Value extends PrimitiveType> extends ObserverUnsafe<Value> { }

class ObserveableMap<Data extends object> extends ObserverStructureUnsafe<Data> {
    readonly size: number = 0;
    constructor(data: Data) {
        super(data);
        for (const [key, value] of Object.entries(data)) {
            let obserify: ObserveableDataInstance<any>
            if (Array.isArray(value)) {
                obserify = new ObserveableList(value)
            } else if (typeof value == 'object') {
                obserify = new ObserveableMap(value);
            } else {
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
            obserify.subscribe((value: MemberOf<Data>) => this.value[key as KeyOf<Data>] = value as MemberOf<Data>);
            this.size++;
        }
    }
    set(value: TypeOptional<Data>) {
        let publish = false;
        let change: any = {};
        for (const [key, val] of Object.entries(value)) {
            if (!this[key as KeyOf<this>]) {
                throw new RangeError('Key not found: ' + key);
            }
            if (val != this.value[key as KeyOf<Data>]) {
                const obserify = this[key as KeyOf<this>] as unknown as ObserveableDataInstance<MemberOf<Data>>;
                change[key] = obserify.set(val as any);
                publish = true;
            }
        }
        if (publish) {
            this.publish(this.value, {method: 'set', parameter: [change]});
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
            }
        }
    }
    async*[Symbol.asyncIterator]() {
        yield* this[Symbol.iterator]()
    }
}

class ObserveableList<List extends Array<Item>, Item = InferArray<List>> extends ObserverStructureUnsafe<List> {
    constructor(list: List) {
        super(list);
        this.observeables = this.toObserveable(list);
    }
    // [index: number]: Item;
    selected: number = -1;
    observeables: ObserifyMatch<Item>[];

    get length() {
        return this.value.length;
    }

    set(value: List) {
        if (Array.isArray(value)) {
            this.value = value;
            this.observeables = this.toObserveable(value);
            this.publish(value, {method: 'set', parameter: [this.observeables]});
        } else {
            throw new TypeError(`Mismatch on type, expect array but ${typeof value}`)
        }
        return this;
    }

    setByObserver(items: ObserifyMatch<Item>[]) {
        this.publish(this.toRaw(items) as List, {method: 'set', parameter: [items]});
        return this;
    }

    update(data: DataAPI, value?: List) {
        if (!value) {
            value = this.value;
        }
        this.publish(value, data);
        return this;
    }

    toObserveable(items: Item[]) {
        const result: ObserifyMatch<Item>[] = [];
        for (const item of items) {
            let obserify: any;
            if (Array.isArray(item)) {
                obserify = new ObserveableList(item)
            } else if (typeof item == 'object') {
                obserify = new ObserveableMap(item as any);
            } else {
                obserify = new ObserveableValue(item as any);
            }
            result.push(obserify as unknown as ObserifyMatch<Item>);
        }
        return result;
    }

    toRaw(items: ObserifyMatch<Item>[]) {
        const result: Item[] = []
        for (const item of items) {
            result.push(item.get() as Item);
        }
        return result;
    }

    at(index: number): ObserifyMatch<Item> {
        if (typeof index != 'number') {
            throw new TypeError('Index type must a number');
        }
        if (index > -1 && index < this.length) {
            this.selected = index;
            return this.observeables[index];
        } else if ((index = this.length + index) > -1) {
            this.selected = index;
            return this.observeables[index]
        } else {
            throw new RangeError('Index out of bounds: ' + index);
        }
    }
    pop() {
        this.value.pop();
        this.observeables.pop();
        return this.update({method: 'pop', parameter: []});
    }
    push(...items: Item[]) {
        this.value.push(...items);
        const newValue = this.toObserveable(items);
        this.observeables.push(...newValue);
        return this.update({method: 'push', parameter: [newValue]});
    }
    reverse() {
        this.value.reverse();
        this.observeables.reverse();
        return this.update({method: 'reverse', parameter: []});
    }
    shift() {
        this.value.shift();
        this.observeables.shift();
        return this.update({method: 'shift', parameter: []});

    }
    sort(compareFn?: (a: ObserifyMatch<Item>, b: ObserifyMatch<Item>) => number) {
        this.observeables.sort(compareFn);
        this.value = this.toRaw(this.observeables) as List;
        return this.update({method: 'sort', parameter: [compareFn]});

    }
    splice(start: number, deleteCount?: number): this;
    splice(start: number, deleteCount: number, ...items: Item[]): this;
    splice(start: any, deleteCount?: any, ...rest: any[]) {
        this.value.splice(start, deleteCount, ...rest);
        const newValue = this.toObserveable(rest);
        this.observeables.splice(start, deleteCount, ...newValue);
        return this.update({method: 'splice', parameter: [start, deleteCount, newValue]});
    }
    unshift(...items: Item[]) {
        this.value.unshift(...items);
        const newValue = this.toObserveable(items);
        this.observeables.unshift(...this.toObserveable(items));
        return this.update({method: 'unshift', parameter: [newValue]});
    }
    
    slice(start?: number, end?: number) {
        return this.observeables.slice(start, end);
    }
    concat(...items: ConcatArray<ObserifyMatch<Item>>[]): ObserifyMatch<Item>[];
    concat(...items: (ObserifyMatch<Item> | ConcatArray<ObserifyMatch<Item>>)[]): ObserifyMatch<Item>[];
    concat(...items: any[]) {
        return this.observeables.concat(...items);
    }
    join(separator?: string) {
        return this.observeables.join(separator);
    }
    indexOf(searchElement: ObserifyMatch<Item>, fromIndex?: number): number {
        return this.observeables.indexOf(searchElement, fromIndex);
    }
    lastIndexOf(searchElement: ObserifyMatch<Item>, fromIndex?: number): number {
        return this.observeables.lastIndexOf(searchElement, fromIndex);
    }
    every<S extends ObserifyMatch<Item>>(predicate: (value: ObserifyMatch<Item>, index: number, array: ObserifyMatch<Item>[]) => value is S, thisArg?: any): this is S[];
    every(predicate: (value: ObserifyMatch<Item>, index: number, array: ObserifyMatch<Item>[]) => unknown, thisArg?: any): boolean;
    every(predicate: any, thisArg?: any): boolean {
        return this.observeables.every(predicate, thisArg);
    }
    some(predicate: (value: ObserifyMatch<Item>, index: number, array: ObserifyMatch<Item>[]) => unknown, thisArg?: any): boolean {
        return this.observeables.some(predicate, thisArg);
    }
    forEach(callbackfn: (value: ObserifyMatch<Item>, index: number, array: ObserifyMatch<Item>[]) => void, thisArg?: any): void {
        this.observeables.forEach(callbackfn, thisArg);
    }
    map(callbackfn: (value: ObserifyMatch<Item>, index: number, array: ObserifyMatch<Item>[]) => ObserifyMatch<Item>, thisArg?: any) {
        return this.observeables.map(callbackfn, thisArg);
    }
    filter<S extends ObserifyMatch<Item>[]>(predicate: (value: ObserifyMatch<Item>, index: number, array: ObserifyMatch<Item>[]) => ObserifyMatch<Item>[], thisArg?: any): ObserifyMatch<Item>[];
    filter(predicate: (value: ObserifyMatch<Item>, index: number, array: ObserifyMatch<Item>[]) => unknown, thisArg?: any): ObserifyMatch<Item>[];
    filter(predicate: any, thisArg?: any) {
        return this.observeables.filter(predicate, thisArg);
    }
    reduce(callbackfn: (previousValue: ObserifyMatch<Item>, currentValue: ObserifyMatch<Item>, currentIndex: number, array: ObserifyMatch<Item>[]) => ObserifyMatch<Item>): ObserifyMatch<Item>;
    reduce(callbackfn: (previousValue: ObserifyMatch<Item>, currentValue: ObserifyMatch<Item>, currentIndex: number, array: ObserifyMatch<Item>[]) => ObserifyMatch<Item>, initialValue: ObserifyMatch<Item>): ObserifyMatch<Item>;
    reduce<U>(callbackfn: (previousValue: U, currentValue: ObserifyMatch<Item>, currentIndex: number, array: ObserifyMatch<Item>[]) => U, initialValue: U): U;
    reduce(callbackfn: any, initialValue?: any): ObserifyMatch<Item> {
        return this.observeables.reduce(callbackfn, initialValue);
    }
    reduceRight(callbackfn: (previousValue: ObserifyMatch<Item>, currentValue: ObserifyMatch<Item>, currentIndex: number, array: ObserifyMatch<Item>[]) => ObserifyMatch<Item>): ObserifyMatch<Item>;
    reduceRight(callbackfn: (previousValue: ObserifyMatch<Item>, currentValue: ObserifyMatch<Item>, currentIndex: number, array: ObserifyMatch<Item>[]) => ObserifyMatch<Item>, initialValue: ObserifyMatch<Item>): ObserifyMatch<Item>;
    reduceRight<U>(callbackfn: (previousValue: U, currentValue: ObserifyMatch<Item>, currentIndex: number, array: ObserifyMatch<Item>[]) => U, initialValue: U): U;
    reduceRight(callbackfn: any, initialValue?: any): ObserifyMatch<Item> {
        return this.observeables.reduceRight(callbackfn, initialValue);
    }
    find<S extends ObserifyMatch<Item>>(predicate: (this: void, value: ObserifyMatch<Item>, index: number, obj: ObserifyMatch<Item>[]) => value is S, thisArg?: any): S | undefined;
    find(predicate: (value: ObserifyMatch<Item>, index: number, obj: ObserifyMatch<Item>[]) => unknown, thisArg?: any): ObserifyMatch<Item> | undefined;
    find(predicate: any, thisArg?: any): ObserifyMatch<Item> | undefined {
        return this.observeables.find(predicate, thisArg);
    }
    findIndex(predicate: (value: ObserifyMatch<Item>, index: number, obj: ObserifyMatch<Item>[]) => unknown, thisArg?: any): number {
        return this.observeables.findIndex(predicate, thisArg);
    }
    fill(value: ObserifyMatch<Item>, start?: number, end?: number) {
        return this.observeables.fill(value, start, end);
    }
    copyWithin(target: number, start: number, end?: number) {
        return this.observeables.copyWithin(target, start, end);
    }
    includes(searchElement: ObserifyMatch<Item>, fromIndex?: number): boolean {
        return this.observeables.includes(searchElement, fromIndex);
    }
    flatMap<U, This = undefined>(callback: (this: This, value: ObserifyMatch<Item>, index: number, array: ObserifyMatch<Item>[]) => U | readonly U[], thisArg?: This) {
        return this.observeables.flatMap(callback, thisArg);
    }
    flat(depth = 1) {
        return this.observeables.flat(depth);
    }
    [Symbol.iterator](): IterableIterator<ObserifyMatch<Item>> {
        return this.observeables[Symbol.iterator]()
    }
}

export class ObserveableData {
    static Value: ObserifyValueConstructor = ObserveableValue as ObserifyValueConstructor;
    static Map: ObserifyMapConstructor = ObserveableMap as ObserifyMapConstructor;
    static List: ObserifyListConstructor = ObserveableList as ObserifyListConstructor;
}
