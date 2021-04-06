import { ObserverAPIUnsafe, ObserverUnsafe, DataAPI } from './unsafe-util.js';
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
type ObservableMatch<Type> = Type extends (number | string) ? ObservableValue<Type> : Type extends (true | false | boolean) ? ObservableValue<boolean> : Type extends Array<infer T> ? ObservableList<T[]> : Type extends object ? ObservableMap<Type> : never;
type ObservableData<T> = ObservableValue<T extends PrimitiveType ? T : never> | ObservableList<T extends Array<any> ? T : never> | ObservableMap<T extends object ? T : never>;
type ObservableMix<O extends object> = {
    [P in keyof O]: ObservableMatch<O[P]>;
}
type NormalizeBoolean<O> = O extends true ? boolean : O extends false ? boolean : O extends boolean ? boolean : never;

type NormalizeObject<O> = {
    [P in keyof O]: Normalize<O[P]>;
}
type NormalizeArray<O> = O extends Array<infer T> ? Array<Normalize<T>> : never;
type NormalizePrmitive<O> = O extends string ? string : O extends number ? number : O extends true ? boolean : O extends false ? boolean : O extends boolean ? boolean : never;
type Normalize<O> = O extends Array<infer T> ? Array<Normalize<T>> : O extends object ? {[P in keyof O]: Normalize<O[P]>} : O extends string ? string : O extends number ? number : O extends true ? boolean : O extends false ? boolean : O extends boolean ? boolean : never;

type ObservableValueConstruct = new <O extends PrimitiveType>(value: Normalize<O>) => ObservableValue<O>;
export type ObservableValue<O extends PrimitiveType> = ObserifyValue<O>;

type ObservableMapConstruct = new <O extends object>(data: O) => ObservableMap<O>;
export type ObservableMap<O extends object> = ObserifyMap<O> & ObservableMix<O>;

type ObservableListConstruct = new <O extends Array<InferArray<O>>>(list: O) => ObservableList<O>;
export type ObservableList<O extends Array<InferArray<O>>> = ObserifyList<O>;

class ObserifyValue<Value extends PrimitiveType> extends ObserverUnsafe<Value> {}

class ObserifyMap<Data extends object> extends ObserverAPIUnsafe<Data> implements Iterable<{key: string, value: any}> {
    readonly size: number = 0;
    constructor(data: Data) {
        super(data);
        for (const [key, value] of Object.entries(data)) {
            let obserify: ObservableData<any>
            if (Array.isArray(value)) {
                obserify = new ObserifyList(value)
            } else if (typeof value == 'object') {
                obserify = new ObserifyMap(value);
            } else {
                obserify = new ObserifyValue(value);
            }
            Object.defineProperty(this, key, {
                value: obserify,
                enumerable: true
            });
            obserify.subscribe((value: MemberOf<Data>) => {this.raw[key as KeyOf<Data>] = value as MemberOf<Data>});
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
            if (val != this.raw[key as KeyOf<Data>]) {
                const obserify = this[key as KeyOf<this>] as unknown as ObservableData<MemberOf<Data>>;
                change[key] = obserify.set(val as any);
                publish = true;
            }
        }
        if (publish) {
            this.publish(this.raw);
            this.publishAPI({method: 'set', parameter: [change]});
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
            }
        }
    }
    async*[Symbol.asyncIterator]() {
        yield* this[Symbol.iterator]()
    }
}

class ObserifyList<List extends Array<Item>, Item = InferArray<List>, Observable = ObservableMatch<Item>> extends ObserverAPIUnsafe<List> implements Iterable<Observable> {
    constructor(list: List) {
        super(list as List);
        this.observeables = this.toObserveable(list as List);
    }
    // [index: number]: Item;
    selected: number = -1;
    observeables: Observable[];

    get length() {
        return this.raw.length;
    }

    set(value: List) {
        if (Array.isArray(value)) {
            this.raw = value;
            this.observeables = this.toObserveable(value);
            this.publish(value);
            this.publishAPI({method: 'set', parameter: [this.observeables]});
        } else {
            throw new TypeError(`Mismatch on type, expect array but ${typeof value}`)
        }
        return this;
    }

    setByObserver(items: Observable[]) {
        this.publish(this.raw = this.toRaw());
        this.publishAPI({method: 'diff', parameter: [items]});
        return this;
    }

    setTempByObserver(items: Observable[]) {
        this.publish(this.toRaw(items) as List);
        this.publishAPI({method: 'set', parameter: [items]});
        return this;
    }

    update(value?: List) {
        throw new Error('The method not implement');
    }

    updateByAPI(data: DataAPI) {
        this.publish(this.raw);
        this.publishAPI(data);
        return this;
    }

    toObserveable(items: Item[]) {
        const result: Observable[] = [];
        for (const item of items) {
            let obserify: any;
            if (Array.isArray(item)) {
                obserify = new ObserifyList(item as any);
            } else if (typeof item == 'object') {
                obserify = new ObserifyMap(item as any);
            } else {
                obserify = new ObserifyValue(item as any);
            }
            result.push(obserify as unknown as Observable);
        }
        return result;
    }

    toRaw(items?: Observable[]): List {
        const result: any = []
        for (const item of items ?? this.observeables) {
            result.push(item.get());
        }
        if (items) {
            this.raw = result;
        }
        return result;
    }

    at(index: number): Observable {
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
        this.raw.pop();
        this.observeables.pop();
        return this.updateByAPI({method: 'pop', parameter: []});
    }
    push(...items: Item[]) {
        this.raw.push(...items);
        const newValue = this.toObserveable(items);
        this.observeables.push(...newValue);
        return this.updateByAPI({method: 'push', parameter: [newValue]});
    }
    reverse() {
        this.raw.reverse();
        this.observeables.reverse();
        return this.updateByAPI({method: 'reverse', parameter: []});
    }
    shift() {
        this.raw.shift();
        this.observeables.shift();
        return this.updateByAPI({method: 'shift', parameter: []});

    }
    sort(compareFn?: (a: Observable, b: Observable) => number) {
        this.observeables.sort(compareFn);
        this.raw = this.toRaw(this.observeables) as List;
        return this.updateByAPI({method: 'sort', parameter: [compareFn]});

    }
    splice(start: number, deleteCount?: number): this;
    splice(start: number, deleteCount: number, ...items: Item[]): this;
    splice(start: any, deleteCount?: any, ...rest: any[]) {
        this.raw.splice(start, deleteCount, ...rest);
        const newValue = this.toObserveable(rest);
        this.observeables.splice(start, deleteCount, ...newValue);
        return this.updateByAPI({method: 'splice', parameter: [start, deleteCount, newValue]});
    }
    unshift(...items: Item[]) {
        this.raw.unshift(...items);
        const newValue = this.toObserveable(items);
        this.observeables.unshift(...this.toObserveable(items));
        return this.updateByAPI({method: 'unshift', parameter: [newValue]});
    }
    
    slice(start?: number, end?: number) {
        return this.observeables.slice(start, end);
    }
    concat(...items: ConcatArray<Observable>[]): Observable[];
    concat(...items: (Observable | ConcatArray<Observable>)[]): Observable[];
    concat(...items: any[]) {
        return this.observeables.concat(...items);
    }
    join(separator?: string) {
        return this.observeables.join(separator);
    }
    indexOf(searchElement: Observable, fromIndex?: number): number {
        return this.observeables.indexOf(searchElement, fromIndex);
    }
    lastIndexOf(searchElement: Observable, fromIndex?: number): number {
        return this.observeables.lastIndexOf(searchElement, fromIndex);
    }
    every<S extends Observable>(predicate: (value: Observable, index: number, array: Observable[]) => value is S, thisArg?: any): this is S[];
    every(predicate: (value: Observable, index: number, array: Observable[]) => unknown, thisArg?: any): boolean;
    every(predicate: any, thisArg?: any): boolean {
        return this.observeables.every(predicate, thisArg);
    }
    some(predicate: (value: Observable, index: number, array: Observable[]) => unknown, thisArg?: any): boolean {
        return this.observeables.some(predicate, thisArg);
    }
    forEach(callbackfn: (value: Observable, index: number, array: Observable[]) => void, thisArg?: any): void {
        this.observeables.forEach(callbackfn, thisArg);
    }
    map(callbackfn: (value: Observable, index: number, array: Observable[]) => Observable, thisArg?: any) {
        return this.observeables.map(callbackfn, thisArg);
    }
    filter<S extends Observable[]>(predicate: (value: Observable, index: number, array: Observable[]) => Observable[], thisArg?: any): Observable[];
    filter(predicate: (value: Observable, index: number, array: Observable[]) => unknown, thisArg?: any): Observable[];
    filter(predicate: any, thisArg?: any) {
        return this.observeables.filter(predicate, thisArg);
    }
    reduce(callbackfn: (previousValue: Observable, currentValue: Observable, currentIndex: number, array: Observable[]) => Observable): Observable;
    reduce(callbackfn: (previousValue: Observable, currentValue: Observable, currentIndex: number, array: Observable[]) => Observable, initialValue: Observable): Observable;
    reduce<U>(callbackfn: (previousValue: U, currentValue: Observable, currentIndex: number, array: Observable[]) => U, initialValue: U): U;
    reduce(callbackfn: any, initialValue?: any): Observable {
        return this.observeables.reduce(callbackfn, initialValue);
    }
    reduceRight(callbackfn: (previousValue: Observable, currentValue: Observable, currentIndex: number, array: Observable[]) => Observable): Observable;
    reduceRight(callbackfn: (previousValue: Observable, currentValue: Observable, currentIndex: number, array: Observable[]) => Observable, initialValue: Observable): Observable;
    reduceRight<U>(callbackfn: (previousValue: U, currentValue: Observable, currentIndex: number, array: Observable[]) => U, initialValue: U): U;
    reduceRight(callbackfn: any, initialValue?: any): Observable {
        return this.observeables.reduceRight(callbackfn, initialValue);
    }
    find<S extends Observable>(predicate: (this: void, value: Observable, index: number, obj: Observable[]) => value is S, thisArg?: any): S | undefined;
    find(predicate: (value: Observable, index: number, obj: Observable[]) => unknown, thisArg?: any): Observable | undefined;
    find(predicate: any, thisArg?: any): Observable | undefined {
        return this.observeables.find(predicate, thisArg);
    }
    findIndex(predicate: (value: Observable, index: number, obj: Observable[]) => unknown, thisArg?: any): number {
        return this.observeables.findIndex(predicate, thisArg);
    }
    fill(value: Observable, start?: number, end?: number) {
        return this.observeables.fill(value, start, end);
    }
    copyWithin(target: number, start: number, end?: number) {
        return this.observeables.copyWithin(target, start, end);
    }
    includes(searchElement: Observable, fromIndex?: number): boolean {
        return this.observeables.includes(searchElement, fromIndex);
    }
    flatMap<U, This = undefined>(callback: (this: This, value: Observable, index: number, array: Observable[]) => U | readonly U[], thisArg?: This) {
        return this.observeables.flatMap(callback, thisArg);
    }
    flat(depth = 1) {
        return this.observeables.flat(depth);
    }
    [Symbol.iterator](): IterableIterator<Observable> {
        return this.observeables[Symbol.iterator]()
    }
}

// type A = Normalize<{name: string, age: number, pass: false}[]>

// let a:{name: string, age: number, pass: boolean}[];

// a = [{name: 'a', age: 1, pass: false}];

// let list: ObservableList<{ id: number; title: string; description: string; done: boolean; }[]>;
// list = new ObserifyList([{id: 0, title: '', description: '', done: false}]);

export class Observable {
    static Value = ObserifyValue as ObservableValueConstruct;
    static Map = ObserifyMap as unknown as ObservableMapConstruct;
    static List = ObserifyList as unknown as ObservableListConstruct;
}
