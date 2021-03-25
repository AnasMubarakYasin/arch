type ListOfType = "string" | "number" | "bigint" | "boolean" | "symbol" | "undefined" | "object" | "function";
type SubscribeHandler<T> = (value: T) => void;

export class ObserverUnsafe<Value> {
    protected type: ListOfType;
    protected value: Value;
    protected subscribers: SubscribeHandler<Value>[] = [];
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
    }
    get() {
        return this.value;
    }
    update(value?: Value){
        this.publish(value ?? this.value);
        return this;
    }
    subscribe(handler: SubscribeHandler<Value>) {
        const type = typeof handler;
        if (type == 'function') {
            this.subscribers.push(handler);
        } else {
            throw new TypeError(`Mismatch on type, expect function but ${type}`)
        };
    }
    unsubscribe(handler: SubscribeHandler<Value>): boolean {
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
        // const startTime = Date.now();
        for (const subscriber of this.subscribers) {
            subscriber(value);
        }
        // console.log(this.constructor.name, 'take time publish', (Date.now() - startTime), 'ms');
    }
    [Symbol.toPrimitive](hint: 'string' | 'number' | 'default') {
        return this.value;
    }
    [Symbol.isConcatSpreadable]: boolean = true;
    toJSON(key: string) {
        return this.value
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
    static get isStarted() {
        return this.started;
    }
    static get queued(){
        return this.taskQueue.length;
    }
    private static readonly taskQueue: Task[] = [];
    private static readonly keySet: Set<TaskKey> = new Set();
    private static started: boolean = false;
    private static isSleep: boolean = false;
    private static wakeUp: (value: unknown) => void;
    private static sleep() {
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
    private static async * taskGenerator(): AsyncGenerator<Task | void> {
        while (true) {
            const task = this.taskQueue.shift();
            if (task) {
                yield task;
            } else {
                yield this.sleep();
            }
        }
    }
    static queue<Data, Result>(data: Data, handler: TaskHandler<Data, Result>, key?: TaskKey) {
        if (key) {
            if (this.keySet.has(key)) {
                console.warn('The task locked');
                return {id: -1, promise: Promise.resolve(undefined)};
            } else {
                this.keySet.add(key);
            }
        }
        const id = this.taskQueue.length;
        return {
            id,
            promise: new Promise<Result | undefined>((resolve, reject) => {
                this.taskQueue.push({id, data, aborted: false, key, handler, reject, resolve});
                this.isSleep && this.wakeUp(null);
            }).finally(() => key && this.keySet.delete(key))
        }
    }
    static dequeue(id: number) {
        for (const task of this.taskQueue) {
            if (task.id == id) {
                task.aborted = true;
                task.key && this.keySet.delete(task.key);
                return true;
            }
        }
        return false;
    }
    static lock(key: TaskKey) {
        this.keySet.add(key);
        return this;
    }
    static unlock(key: TaskKey) {
        this.keySet.delete(key);
        return this;
    }
    static start() {
        if (this.started) {
            return;
        } else {
            console.log('process start');
            console.time('process live');
            this.started = true;
            this.process();
        }
    }
    private static async process() {
        for await (const task of this.taskGenerator()) {
            if (task) {
                console.time('process time');
                if (task.aborted) {
                    console.timeEnd('process time');
                    continue;
                }
                try {
                    task.resolve(await task.handler(task.data));
                } catch (error) {
                    task.reject(error);
                } finally {
                    task.key && this.keySet.delete(task.key);
                }
                console.timeEnd('process time');
            }
        }
    }
    static finish() {
        console.log('process finish');
        console.timeEnd('process live');
        this.started = false;
    }
}

ProcessManagementUnsafe.start();
