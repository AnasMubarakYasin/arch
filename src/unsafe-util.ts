import { hash } from "./helper.js";

type ListOfType = "string" | "number" | "bigint" | "boolean" | "symbol" | "undefined" | "object" | "function";
type OSubscribeHandler<T> = (value: T) => void;
type ASubscribeHandler<T> = (value: T, data: DataAPI) => void;
export type DataAPI = {
    method: string;
    parameter: any[];
}

export class ObserverUnsafe<Value> {
    protected type: ListOfType;
    protected value: Value;
    protected subscribers: OSubscribeHandler<Value>[] = [];
    protected binds: WeakMap<ObserverUnsafe<Value>, OSubscribeHandler<Value>> = new Map();
    constructor(data: Value) {
        this.type = typeof data;
        this.value = data;
    }
    set(value: Value) {
        if (value != this.value) {
            const type = typeof value;
            if (type != this.type) {
                throw new TypeError(`Mismatch on type, expect ${this.type} but ${type}`)
            }
            this.value = value;
            this.publish(value);
        }
        return this;
    }
    equal(value: Value) {
        return this.value == value;
    }
    get() {
        return this.value;
    }
    update(value?: Value) {
        this.publish(value ?? this.value);
        return this;
    }
    bind(observeableData: ObserverUnsafe<Value>, handler?: OSubscribeHandler<Value>) {
        handler = handler ?? ((value) => observeableData.set(value));
        this.binds.set(observeableData, handler);
        this.subscribe(handler);
        observeableData.set(this.value).subscribe((value) => this.set(value));
        return this;
    }
    unbind(observeableData: ObserverUnsafe<Value>) {
        const handler = this.binds.get(observeableData);
        if (handler) {
            this.unsubscribe(handler);
            observeableData.unbind(this);
        } else {
            throw new Error('bind not exist');
        }
        return this;
    }
    subscribe(handler: OSubscribeHandler<Value>) {
        const type = typeof handler;
        if (type == 'function') {
            this.subscribers.push(handler);
        } else {
            throw new TypeError(`Mismatch on type, expect function but ${type}`)
        };
        return this;
    }
    unsubscribe(handler: OSubscribeHandler<Value>): boolean {
        let index = 0;
        let pos = 0;
        for (const subscriber of this.subscribers) {
            if (Object.is(subscriber, handler)) {
                pos = index;
            }
            index++;
        }
        if (pos) {
            this.subscribers.splice(pos, 1);
            return true;
        } else {
            return false;
        }
    }
    protected publish(value: Value) {
        console.time(this.constructor.name + ' publish');
        for (const subscriber of this.subscribers) {
            subscriber(value);
        }
        console.timeEnd(this.constructor.name + ' publish');
    }
    [Symbol.toPrimitive](hint: 'string' | 'number' | 'default') {
        return this.value;
    }
    [Symbol.isConcatSpreadable]: boolean = true;
    toJSON(key: string) {
        return this.value
    }
}
export class ObserverStructureUnsafe<RawValue> {
    protected type: ListOfType;
    protected value: RawValue;
    protected subscribers: ASubscribeHandler<RawValue>[] = [];
    protected binds: WeakMap<ObserverStructureUnsafe<RawValue>, ASubscribeHandler<RawValue>> = new Map();
    constructor(data: RawValue) {
        this.type = typeof data;
        this.value = data;
    }
    set(value: RawValue) {
        if (value != this.value) {
            const type = typeof value;
            if (type != this.type) {
                throw new TypeError(`Mismatch on type, expect ${this.type} but ${type}`)
            }
            this.value = value;
            this.publish(value, { method: 'set', parameter: [value] });
        }
        return this;
    }
    equal(value: RawValue) {
        return this.value == value;
    }
    get() {
        return this.value;
    }
    bind(observeableData: ObserverStructureUnsafe<RawValue>, handler?: ASubscribeHandler<RawValue>) {
        handler = handler ?? ((value) => observeableData.set(value));
        this.binds.set(observeableData, handler);
        this.subscribe(handler);
        observeableData.set(this.value).subscribe((value) => this.set(value));
        return this;
    }
    unbind(observeableData: ObserverStructureUnsafe<RawValue>) {
        const handler = this.binds.get(observeableData);
        if (handler) {
            this.unsubscribe(handler);
            observeableData.unbind(this);
        } else {
            throw new Error('bind not exist');
        }
        return this;
    }
    subscribe(handler: ASubscribeHandler<RawValue>) {
        const type = typeof handler;
        if (type == 'function') {
            this.subscribers.push(handler);
        } else {
            throw new TypeError(`Mismatch on type, expect function but ${type}`)
        };
        return this;
    }
    unsubscribe(handler: ASubscribeHandler<RawValue>): boolean {
        let index = 0;
        let pos = 0;
        for (const subscriber of this.subscribers) {
            if (Object.is(subscriber, handler)) {
                pos = index;
            }
            index++;
        }
        if (pos) {
            this.subscribers.splice(pos, 1);
            return true;
        } else {
            return false;
        }
    }
    protected publish(value: RawValue, data: DataAPI) {
        console.time(this.constructor.name + ' publish');
        for (const subscriber of this.subscribers) {
            subscriber(value, data);
        }
        console.timeEnd(this.constructor.name + ' publish');
    }
    [Symbol.toPrimitive](hint: 'string' | 'number' | 'default') {
        return this.value;
    }
    [Symbol.isConcatSpreadable]: boolean = true;
    toJSON(key: string) {
        return this.value
    }
    protected send(data: DataAPI) {

    }
}
export class ChangeTrackerUnsafe<RawValue> {
    stageList: RawValue[] = [];
    commitList: RawValue[] = [];
    head: RawValue;
    temp: RawValue;
    onChangeHandler: ((value: RawValue) => void) | null;
    onStageHandler: ((value: RawValue) => void) | null;
    copyMethod: (raw: RawValue) => RawValue;
    constructor(value: RawValue) {
        this.head = value;
        this.temp = value;
        this.copyMethod = (raw) => Array.isArray(raw) ? raw.slice() as unknown as RawValue : raw;
        this.onChangeHandler = null;
        this.onStageHandler = null;
        this.stage();
        this.commit();
    }
    stage(change?: RawValue) {
        this.stageList.unshift(change ? this.copyMethod(this.temp = change) : this.copyMethod(this.temp));
        this.onStageHandler ? this.onStageHandler(this.copyMethod(this.temp)) : null;
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
            this.stageList.unshift(this.commitList.shift() as RawValue);
            this.save(this.commitList[0]);
        } else {
            throw new Error('Cannot revert: ' + this.commitList.length)
        }
        return this;
    }
    save(change: RawValue) {
        this.head = this.copyMethod(change);
        this.temp = this.copyMethod(change);
        this.onChangeHandler ? this.onChangeHandler(this.copyMethod(change)) : null;
        return this;
    }
}

type TaskHandler<Data, Result> = (data: Data) => Promise<Result>;
type TaskKey = string | object | Function
type Task<Data = any, Result = any> = {
    id: number;
    data: Data;
    aborted: boolean;
    key?: TaskKey;
    handler: TaskHandler<Data, Result>;
    resolve: (value: Result | PromiseLike<Result>) => void;
    reject: (reason?: any) => void;
}

export class ProcessManagementUnsafe {
    constructor() {
        this.start();
    }
    get isStarted() {
        return this.started;
    }
    get queued() {
        return this.taskQueue.length;
    }
    private readonly taskQueue: Task[] = [];
    private readonly keySet: Set<TaskKey> = new Set();
    private started: boolean = false;
    private isSleep: boolean = false;
    private wakeUp!: (value: unknown) => void;
    private sleep() {
        return new Promise((resolve) => {
            console.log('process sleep');
            console.timeEnd('process live');
            this.wakeUp = resolve;
            this.isSleep = true;
        }).then(() => {
            console.log('process wake up');
            console.time('process live');
            this.isSleep = false;
        })
    }
    private async * taskGenerator(): AsyncGenerator<Task | void> {
        while (true) {
            const task = this.taskQueue.shift();
            if (task) {
                yield task;
            } else {
                yield this.sleep();
            }
        }
    }
    queue<Data, Result, Key extends TaskKey | undefined>(data: Data, handler: TaskHandler<Data, Result>, key?: Key) {
        if (key) {
            if (this.keySet.has(key)) {
                console.warn('The task is locked');
                this.taskQueue.find((task) => task.id == 0)?.reject('lala');
                return { id: -1, promise: Promise.resolve(undefined) };
            } else {
                this.keySet.add(key);
            }
        }
        const id = this.taskQueue.length;
        return {
            id,
            promise: new Promise<Key extends undefined ? Result : (Result | undefined)>((resolve, reject) => {
                this.taskQueue.push({ id, data, aborted: false, key, handler, reject, resolve });
                this.isSleep && this.wakeUp(null);
            })
        }
    }
    dequeue(id: number) {
        for (const task of this.taskQueue) {
            if (task.id == id) {
                task.aborted = true;
                task.key && this.keySet.delete(task.key);
                return true;
            }
        }
        return false;
    }
    lock(key: TaskKey) {
        this.keySet.add(key);
        return this;
    }
    unlock(key: TaskKey) {
        this.keySet.delete(key);
        return this;
    }
    start() {
        if (this.started) {
            return;
        } else {
            console.log('process start');
            console.time('process live');
            this.started = true;
            this.process();
        }
        return this;
    }
    private async process() {
        for await (const task of this.taskGenerator()) {
            if (task) {
                if (task.aborted) {
                    continue;
                }
                try {
                    task.resolve(await task.handler(task.data));
                } catch (error) {
                    task.reject(new error.constructor(error.message));
                } finally {
                    task.key && this.keySet.delete(task.key);
                }
            }
        }
    }
    finish() {
        console.log('process finish');
        this.started = false;
        return this;
    }
}

export class Promiseify<T> extends Promise<T> {
    static get [Symbol.species]() {
        return Promise;
    }
    resolver!: (value: T) => void;
    rejector!: (error: any) => void;
    constructor(...args: any[]) {
        let resolver: any
        let rejector: any
        super((resolve, reject) => {
            resolver = resolve;
            rejector = reject;
        });
        this.resolver = resolver;
        this.rejector = rejector;
    }
}
