import {ObserverUnsafe} from './unsafe-util.js';
type TypeOptional<O> = {
    [P in keyof O]?: O[P];
}
type TypeOf<T> = T extends string ? string : T extends number ? number : T extends boolean ? boolean : T;
type KeyOf<Type> = keyof Type;
type MemberOf<O> = O[keyof O];
type PrimitiveType = string | number | boolean | symbol;
type PrimitiveTypeData<O> = {
    [P in keyof O]: O[P] extends PrimitiveType ? O[P] : never;
}
type InferArray<A> = A extends Array<infer T> ? T : never;
type PrimitiveDataMemberOf<P> = PrimitiveTypeData<P>[keyof PrimitiveTypeData<P>];
type ObserifyValueConstructor = new <O extends PrimitiveType>(value: O) => ObserveableValueInstance<TypeOf<O>>;
type ObserifyMatch<Type> = Type extends string | number | boolean ? ObserveableValueInstance<Type> : Type extends Array<infer T> ? ObserveableListInstance<Type, T> : Type extends object ? ObserveableMapInstance<Type> : never
type ObserveableDataInstance<T> = ObserveableValueInstance<T extends PrimitiveType ? T : never> | ObserveableListInstance<T extends Array<any> ? T : never, InferArray<T>> | ObserveableMapInstance<T extends object ? T : never>;
export type ObserveableValueInstance<O extends PrimitiveType> = ObserveableValue<O>
type ObserifyMix<O extends object> = {
    [P in keyof O]: ObserifyMatch<O[P]>;
}
type ObserifyMapConstructor = new <O extends object>(data: O) => ObserveableMapInstance<O>;
export type ObserveableMapInstance<O extends object> = ObserveableMap<O> & ObserifyMix<O>
type ObserifyListConstructor = new <O extends Array<M>, M = InferArray<O>>(list: O) => ObserveableListInstance<O, M>;
export type ObserveableListInstance<O extends Array<M>, M = InferArray<O>> = ObserveableList<O, M>;

class ObserveableValue<Value extends PrimitiveType> extends ObserverUnsafe<Value> {}

class ObserveableMap<Data extends object> extends ObserverUnsafe<Data> {
    readonly size: number = 0;
    constructor(data: Data) {
        super(data);

        for (const [key, value] of Object.entries(data)) {
            let obserify: ObserveableDataInstance<any> | null = null;
            if (Array.isArray(value)) {
                obserify = new ObserveableList(value)
            } else if (typeof value == 'object') {
                obserify = new ObserveableMap(value);
            } else {
                obserify = new ObserveableValue(value);
            }
            Object.defineProperty(this, key, {
                value: obserify,
                enumerable: true
            });
            obserify.subscribe((value: MemberOf<Data>) => this.value[key as KeyOf<Data>] = value as MemberOf<Data>);
            this.size++;
        }
    }
    set(value: TypeOptional<Data>) {
        for (const [key, val] of Object.entries(value)) {
            if (!this[key as KeyOf<this>]) {
                throw new RangeError('Key not found: ' + key);
            }
            if (val != this.value[key as KeyOf<Data>]) {
                (this[key as KeyOf<this>] as unknown as ObserveableDataInstance<MemberOf<Data>>).set(val as any);
            }
        }
        this.publish(this.value)
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

class ObserveableList<List extends Array<Item>, Item = InferArray<List>> extends ObserverUnsafe<Array<Item>> {
    constructor(list: List) {
        super(list);

        this.stage(list);
        this.commit();
    }
    [index: number]: Item;
    length: number = 0;
    selected: number = -1;
    commitList: Item[][] = []
    stageList: Item[][] = [];
    temp!: Item[];

    stage(change?: Item[]) {
        this.stageList.unshift(change ? this.temp = change : this.temp.slice());
        return this;
    }
    commit() {
        const stage = this.stageList.shift();

        if (stage) {
            this.commitList.unshift(stage);
            this.save(stage);
        } else {
            throw new Error('Cannot commit: ' + this.stageList.length);
        }
        return this;
    }
    revert() {
        if (this.commitList.length > 1) {
            this.stageList.unshift(this.commitList.shift() as List);
            this.save(this.commitList[0]);
        } else {
            throw new Error('Cannot revert: ' + this.commitList.length)
        }
        return this;
    }
    protected save(item: Item[]) {
        this.length = item.length;
        this.value = item.slice();
        this.temp = item.slice();
        this.publish(item.slice());
        return this;
    }
    getStage(unsave = false, index = 0) {
        const length = this.stageList.length;
        if (length < 1 && index > length && index < 0) {
            throw new RangeError('stage: ' + length);
        }
        if (unsave) {
            return this.temp = this.stageList.shift() as List;
        } else {
            return this.stageList[index];
        }
    }
    setTemp(value: List) {
        this.temp = value.slice();
    }

    set(value: List) {
        this.stage(value)
        this.commit();
        return this;
    }


    at(index: number): Item {
        if (typeof index != 'number') {
            throw new TypeError('Index type must a number');
        }
        if (index > -1 && index < this.length) {
            this.selected = index;
            return this.temp[index];
        } else if ((index = this.length + index) > -1) {
            this.selected = index;
            return this.temp[index]
        } else {
            throw new RangeError('Index out of bounds: '+index);
        }
    }
    pop() {
        this.temp.pop();
        return this.stage();
    }
    push(...items: Item[]) {
        this.temp.push(...items);
        return this.stage();
    }
    concat(...items: ConcatArray<Item>[]): this;
    concat(...items: (Item | ConcatArray<Item>)[]): this;
    concat(...items: any[]) {
        return this.stage(this.temp.concat(...items));
    }
    join(separator?: string): string {
        return this.temp.join(separator);
    }
    reverse() {
        this.temp.reverse();
        return this.stage();
    }
    shift() {
        this.temp.shift();
        return this.stage();
    }
    slice(start?: number, end?: number) {
        return this.stage(this.temp.slice(start, end));
    }
    sort(compareFn?: (a: Item, b: Item) => number) {
        this.temp.sort(compareFn);
        return this.stage();
    }
    splice(start: number, deleteCount?: number): this;
    splice(start: number, deleteCount: number, ...items: Item[]): this;
    splice(start: any, deleteCount?: any, ...rest: any[]) {
        this.temp.splice(start, deleteCount, ...rest);
        return this.stage();
    }
    unshift(...items: Item[]) {
        this.temp.unshift(...items);
        return this.stage();
    }
    indexOf(searchElement: Item, fromIndex?: number): number {
        return this.temp.indexOf(searchElement, fromIndex);
    }
    lastIndexOf(searchElement: Item, fromIndex?: number): number {
        return this.temp.lastIndexOf(searchElement, fromIndex);
    }
    // every<S extends Item>(predicate: (value: Item, index: number, array: Item[]) => value is S, thisArg?: any): this is S[];
    every(predicate: (value: Item, index: number, array: List) => unknown, thisArg?: any): boolean;
    every(predicate: any, thisArg?: any): boolean {
        return this.temp.every(predicate, thisArg);
    }
    some(predicate: (value: Item, index: number, array: Item[]) => unknown, thisArg?: any): boolean {
        return this.temp.some(predicate, thisArg);
    }
    forEach(callbackfn: (value: Item, index: number, array: Item[]) => void, thisArg?: any): void {
        this.temp.forEach(callbackfn, thisArg);
    }
    map(callbackfn: (value: Item, index: number, array: Item[]) => Item, thisArg?: any) {
        return this.stage(this.temp.map(callbackfn, thisArg));
    }
    // filter<S extends List>(predicate: (value: List, index: number, array: List[]) => value is S, thisArg?: any): this;
    filter(predicate: (value: Item, index: number, array: Item[]) => unknown, thisArg?: any): this;
    filter(predicate: any, thisArg?: any) {
        return this.stage(this.temp.filter(predicate, thisArg));
    }
    reduce(callbackfn: (previousValue: Item, currentValue: Item, currentIndex: number, array: Item[]) => Item): Item;
    reduce(callbackfn: (previousValue: Item, currentValue: Item, currentIndex: number, array: Item[]) => Item, initialValue: Item): Item;
    reduce<U>(callbackfn: (previousValue: U, currentValue: Item, currentIndex: number, array: Item[]) => U, initialValue: U): U;
    reduce(callbackfn: any, initialValue?: any): Item {
        return this.temp.reduce(callbackfn, initialValue);
    }
    reduceRight(callbackfn: (previousValue: Item, currentValue: Item, currentIndex: number, array: Item[]) => Item): Item;
    reduceRight(callbackfn: (previousValue: Item, currentValue: Item, currentIndex: number, array: Item[]) => Item, initialValue: Item): Item;
    reduceRight<U>(callbackfn: (previousValue: U, currentValue: Item, currentIndex: number, array: Item[]) => U, initialValue: U): U;
    reduceRight(callbackfn: any, initialValue?: any): Item {
        return this.temp.reduceRight(callbackfn, initialValue);
    }
    find<S extends Item>(predicate: (this: void, value: Item, index: number, obj: Item[]) => value is S, thisArg?: any): S | undefined;
    find(predicate: (value: Item, index: number, obj: Item[]) => unknown, thisArg?: any): Item | undefined;
    find(predicate: any, thisArg?: any): Item | undefined {
        return this.temp.find(predicate, thisArg);
    }
    findIndex(predicate: (value: Item, index: number, obj: Item[]) => unknown, thisArg?: any): number {
        return this.temp.findIndex(predicate, thisArg);
    }
    fill(value: Item, start?: number, end?: number) {
        return this.stage(this.temp.fill(value, start, end));
    }
    copyWithin(target: number, start: number, end?: number) {
        return this.stage(this.temp.copyWithin(target, start, end));
    }
    includes(searchElement: Item, fromIndex?: number): boolean {
        return this.temp.includes(searchElement, fromIndex);
    }
    flatMap<U, This = undefined>(callback: (this: This, value: Item, index: number, array: Item[]) => U | readonly U[], thisArg?: This) {
        return this.stage(this.temp.flatMap(callback, thisArg));
    }
    flat<A, D extends number = 1>(thisArg: A, depth?: D) {
        return this.stage(this.temp.flat(thisArg, depth));
    }
    [Symbol.iterator](): IterableIterator<Item> {
        return this.temp[Symbol.iterator]()
    }
}

export class ObserveableData {
    static Value: ObserifyValueConstructor = ObserveableValue as ObserifyValueConstructor;
    static Map: ObserifyMapConstructor = ObserveableMap as ObserifyMapConstructor;
    static List: ObserifyListConstructor = ObserveableList as ObserifyListConstructor;
}
