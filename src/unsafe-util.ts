import { hash } from "./helper.js";

type ListOfType = "string" | "number" | "bigint" | "boolean" | "symbol" | "undefined" | "object" | "function";
type SubscribeHandler<T> = ((value: T) => void | Promise<void>);
type SubscribeAPIHandler = (data: DataAPI) => void;

export type DataAPI = {
    method: string;
    parameter: any[];
    data?: any;
}

type TaskHandler<Data, Result> = (data: Data) => Promise<Result>;
type TaskKey = string | object | Function
type Task<Data = any, Result = any> = {
    id: number;
    data: Data;
    key?: TaskKey;
    timeout?: number;
    timeoutId?: number
    handler: TaskHandler<Data, Result>;
    resolve: (value: Result | PromiseLike<Result>) => void;
    reject: (reason?: any) => void;
}

export class ProcessManagementUnsafe {
    static get instance() {
        return this.global ?? (this.global = new ProcessManagementUnsafe('@global'))
    }
    static debug = true;
    protected static global?: ProcessManagementUnsafe;
    constructor(name = '') {
        this.start();
        this.name = name;
        this.id = this.genPid();
    }
    get genPid() {
        return function* () {
            let id = 0;
            while (true) {
                yield ++id;
            }
        }
    }
    get isStarted() {
        return this.started;
    }
    get queued() {
        return this.taskQueue.length;
    }
    readonly name: string;
    protected readonly id: Generator<number, never, unknown>;
    private readonly derferQueue: Task[] = [];
    private readonly taskQueue: Task[] = [];
    private readonly keySet: Set<TaskKey> = new Set();
    private started: boolean = false;
    private isSleep: boolean = false;
    private wakeUp!: (value: Task) => void;
    private sleep() {
        return new Promise<Task>((resolve) => {
            ProcessManagementUnsafe.debug && console.log(this.name + ' process sleep');
            ProcessManagementUnsafe.debug && console.timeEnd(this.name + ' process live');
            this.wakeUp = resolve;
            this.isSleep = true;
        }).finally(() => {
            ProcessManagementUnsafe.debug && console.log(this.name + ' process wake up');
            ProcessManagementUnsafe.debug && console.time(this.name + ' process live');
            this.isSleep = false;
        })
    }
    private async * taskGenerator(): AsyncGenerator<Task> {
        while (true) {
            const task = this.taskQueue.shift();
            if (task) {
                yield task;
            } else {
                yield this.sleep();
            }
        }
    }
    queue<Data, Result, Key extends TaskKey | undefined>(data: Data, handler: TaskHandler<Data, Result>, key?: Key, timeout?: number) {
        if (timeout && !key) {
            throw TypeError('Cannot use timeout without key');
        }
        if (key && !timeout) {
            if (this.keySet.has(key)) {
                ProcessManagementUnsafe.debug && console.warn(this.name + ' The task is locked');
                this.taskQueue.find((task) => task.id == 0)?.reject('lala');
                return { id: -1, promise: Promise.resolve(undefined) };
            } else {
                this.keySet.add(key);
            }
        }
        const id = this.id.next().value;
        return {
            id,
            promise: new Promise<Key extends undefined ? Result : (Result | undefined)>((resolve, reject) => {
                const task: Task<Data, Result> = { id, data, key, timeout, handler, reject, resolve };
                this.isSleep ? this.wakeUp(task) : this.taskQueue.push(task);
            })
        }
    }
    dequeue(id: number) {
        let index = 0;
        for (const task of this.taskQueue) {
            if (task.id == id) {
                this.taskQueue.splice(index, 1);
                task.key && this.keySet.delete(task.key);
                return true;
            }
            index++;
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
        if (!this.started) {
            ProcessManagementUnsafe.debug && console.log(this.name + ' process start');
            ProcessManagementUnsafe.debug && console.time(this.name + ' process live');
            this.started = true;
            this.process();
        }
        return this;
    }
    private async process() {
        for await (const task of this.taskGenerator()) {
            if (task.timeout) {
                const index = this.derferQueue.findIndex((deferTask) => deferTask.key == task.key);
                if (index > -1) {
                    const deferTask = this.derferQueue.splice(index, 1)[0];
                    clearTimeout(deferTask.timeoutId);
                    ProcessManagementUnsafe.debug && console.warn(this.name + ' process defer replace');
                }
                task.timeoutId = setTimeout(() => {
                    this.isSleep ? this.wakeUp(task) : this.taskQueue.push(task);
                    ProcessManagementUnsafe.debug && console.log(this.name + ' process defer queue');
                }, task.timeout);
                task.timeout = 0;
                this.derferQueue.push(task);
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
    finish() {
        ProcessManagementUnsafe.debug && console.log(this.name + ' process finish');
        this.started = false;
        return this;
    }
}

export class ObserverUnsafe<Raw> {
    protected static broadcast = new ProcessManagementUnsafe('@ObserverUnsafe');

    defer: boolean;
    deferTime: number;

    protected type: ListOfType;
    protected raw: Raw;
    protected subscribers: SubscribeHandler<Raw>[] = [];
    protected binds: WeakMap<ObserverUnsafe<Raw>, SubscribeHandler<Raw>> = new Map();
    constructor(data: Raw) {
        this.type = typeof data;
        this.raw = data;
        this.defer = false;
        this.deferTime = 12;
    }
    set(value: Raw) {
        if (value != this.raw) {
            const type = typeof value;
            if (type != this.type) {
                throw new TypeError(`Mismatch on type, expect ${this.type} but ${type}`)
            }
            this.raw = value;
            this.publish(value);
        }
        return this;
    }
    equal(value: Raw) {
        return this.raw == value;
    }
    get() {
        return this.raw;
    }
    update(value?: Raw) {
        this.publish(value ?? this.raw);
        return this;
    }
    bind(observeableData: ObserverUnsafe<Raw>, handler?: SubscribeHandler<Raw>) {
        handler = handler ?? ((value) => { observeableData.set(value) });
        this.binds.set(observeableData, handler);
        this.subscribe(handler);
        observeableData.set(this.raw).subscribe((value) => { this.set(value) });
        return this;
    }
    unbind(observeableData: ObserverUnsafe<Raw>) {
        const handler = this.binds.get(observeableData);
        if (handler) {
            this.unsubscribe(handler);
            observeableData.unbind(this);
        } else {
            throw new Error('bind not exist');
        }
        return this;
    }
    subscribe(handler: SubscribeHandler<Raw>) {
        const type = typeof handler;
        if (type == 'function') {
            this.subscribers.push(handler);
        } else {
            throw new TypeError(`Mismatch on type, expect function but ${type}`)
        };
        return this;
    }
    unsubscribe(handler: SubscribeHandler<Raw>): boolean {
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
    protected publish(value: Raw) {
        console.time('@' + this.constructor.name + ' publish ' + (this.defer ? 'defer' : ''));
        if (this.defer) {
            ObserverUnsafe.broadcast.queue(null, async () => {
                for (const subscriber of this.subscribers) {
                    await subscriber(value);
                }
            }, 'publish', this.deferTime)
        } else {
            for (const subscriber of this.subscribers) {
                subscriber(value);
            }
        }
        console.timeEnd('@' + this.constructor.name + ' publish ' + (this.defer ? 'defer' : ''));
    }

    [Symbol.toPrimitive](hint: 'string' | 'number' | 'default') {
        return this.raw;
    }
    [Symbol.isConcatSpreadable]: boolean = true;
    toJSON(key: string) {
        return this.raw
    }
}
export class ObserverAPIUnsafe<RawValue> extends ObserverUnsafe<RawValue> {
    subscribersAPI: SubscribeAPIHandler[] = [];
    subscribeAPI(handler: SubscribeAPIHandler) {
        if (typeof handler == 'function') {
            this.subscribersAPI.push(handler);
        } else {
            throw new TypeError(`Mismatch on type, expect function but ${typeof handler}`)
        };
        return this;
    }
    unsubscribeAPI(handler: SubscribeAPIHandler): boolean {
        for (let index = 0; index < this.subscribersAPI.length; index++) {
            if (Object.is(this.subscribersAPI[index], handler)) {
                this.subscribersAPI.splice(index, 1);
                return true;
            }
        }
        return false;
    }
    protected publishAPI(data: DataAPI) {
        console.time(this.constructor.name + ' publish API');
        for (const subscriber of this.subscribersAPI) {
            subscriber(data);
        }
        console.timeEnd(this.constructor.name + ' publish API');
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
