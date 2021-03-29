export class ObserverUnsafe {
    constructor(data) {
        this.subscribers = [];
        this.binds = new Map();
        this[Symbol.isConcatSpreadable] = true;
        this.type = typeof data;
        this.value = data;
    }
    set(value) {
        if (value != this.value) {
            const type = typeof value;
            if (type != this.type) {
                throw new TypeError(`Mismatch on type, expect ${this.type} but ${type}`);
            }
            this.value = value;
            this.publish(value);
        }
        return this;
    }
    equal(value) {
        return this.value == value;
    }
    get() {
        return this.value;
    }
    update(value) {
        this.publish(value ?? this.value);
        return this;
    }
    bind(observeableData, handler) {
        handler = handler ?? ((value) => observeableData.set(value));
        this.binds.set(observeableData, handler);
        this.subscribe(handler);
        observeableData.set(this.value).subscribe((value) => this.set(value));
        return this;
    }
    unbind(observeableData) {
        const handler = this.binds.get(observeableData);
        if (handler) {
            this.unsubscribe(handler);
            observeableData.unbind(this);
        }
        else {
            throw new Error('bind not exist');
        }
        return this;
    }
    subscribe(handler) {
        const type = typeof handler;
        if (type == 'function') {
            this.subscribers.push(handler);
        }
        else {
            throw new TypeError(`Mismatch on type, expect function but ${type}`);
        }
        ;
        return this;
    }
    unsubscribe(handler) {
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
        }
        else {
            return false;
        }
    }
    publish(value) {
        console.time(this.constructor.name + ' publish');
        for (const subscriber of this.subscribers) {
            subscriber(value);
        }
        console.timeEnd(this.constructor.name + ' publish');
    }
    [Symbol.toPrimitive](hint) {
        return this.value;
    }
    toJSON(key) {
        return this.value;
    }
}
export class ObserverStructureUnsafe {
    constructor(data) {
        this.subscribers = [];
        this.binds = new Map();
        this[Symbol.isConcatSpreadable] = true;
        this.type = typeof data;
        this.value = data;
    }
    set(value) {
        if (value != this.value) {
            const type = typeof value;
            if (type != this.type) {
                throw new TypeError(`Mismatch on type, expect ${this.type} but ${type}`);
            }
            this.value = value;
            this.publish(value, { method: 'set', parameter: [value] });
        }
        return this;
    }
    equal(value) {
        return this.value == value;
    }
    get() {
        return this.value;
    }
    bind(observeableData, handler) {
        handler = handler ?? ((value) => observeableData.set(value));
        this.binds.set(observeableData, handler);
        this.subscribe(handler);
        observeableData.set(this.value).subscribe((value) => this.set(value));
        return this;
    }
    unbind(observeableData) {
        const handler = this.binds.get(observeableData);
        if (handler) {
            this.unsubscribe(handler);
            observeableData.unbind(this);
        }
        else {
            throw new Error('bind not exist');
        }
        return this;
    }
    subscribe(handler) {
        const type = typeof handler;
        if (type == 'function') {
            this.subscribers.push(handler);
        }
        else {
            throw new TypeError(`Mismatch on type, expect function but ${type}`);
        }
        ;
        return this;
    }
    unsubscribe(handler) {
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
        }
        else {
            return false;
        }
    }
    publish(value, data) {
        console.time(this.constructor.name + ' publish');
        for (const subscriber of this.subscribers) {
            subscriber(value, data);
        }
        console.timeEnd(this.constructor.name + ' publish');
    }
    [Symbol.toPrimitive](hint) {
        return this.value;
    }
    toJSON(key) {
        return this.value;
    }
    send(data) {
    }
}
export class ChangeTrackerUnsafe {
    constructor(value) {
        this.stageList = [];
        this.commitList = [];
        this.head = value;
        this.temp = value;
        this.copyMethod = (raw) => Array.isArray(raw) ? raw.slice() : raw;
        this.onChangeHandler = null;
        this.onStageHandler = null;
        this.stage();
        this.commit();
    }
    stage(change) {
        this.stageList.unshift(change ? this.copyMethod(this.temp = change) : this.copyMethod(this.temp));
        this.onStageHandler ? this.onStageHandler(this.copyMethod(this.temp)) : null;
        return this;
    }
    commit() {
        const stage = this.stageList.shift();
        if (stage) {
            this.commitList.unshift(stage);
            this.save(stage);
        }
        else {
            throw new Error('Cannot commit: ' + this.stageList.length);
        }
        return this;
    }
    revert() {
        if (this.commitList.length > 1) {
            this.stageList.unshift(this.commitList.shift());
            this.save(this.commitList[0]);
        }
        else {
            throw new Error('Cannot revert: ' + this.commitList.length);
        }
        return this;
    }
    save(change) {
        this.head = this.copyMethod(change);
        this.temp = this.copyMethod(change);
        this.onChangeHandler ? this.onChangeHandler(this.copyMethod(change)) : null;
        return this;
    }
}
export class ProcessManagementUnsafe {
    constructor() {
        this.taskQueue = [];
        this.keySet = new Set();
        this.started = false;
        this.isSleep = false;
        this.start();
    }
    get isStarted() {
        return this.started;
    }
    get queued() {
        return this.taskQueue.length;
    }
    sleep() {
        return new Promise((resolve) => {
            console.log('process sleep');
            console.timeEnd('process live');
            this.wakeUp = resolve;
            this.isSleep = true;
        }).then(() => {
            console.log('process wake up');
            console.time('process live');
            this.isSleep = false;
        });
    }
    async *taskGenerator() {
        while (true) {
            const task = this.taskQueue.shift();
            if (task) {
                yield task;
            }
            else {
                yield this.sleep();
            }
        }
    }
    queue(data, handler, key) {
        if (key) {
            if (this.keySet.has(key)) {
                console.warn('The task is locked');
                this.taskQueue.find((task) => task.id == 0)?.reject('lala');
                return { id: -1, promise: Promise.resolve(undefined) };
            }
            else {
                this.keySet.add(key);
            }
        }
        const id = this.taskQueue.length;
        return {
            id,
            promise: new Promise((resolve, reject) => {
                this.taskQueue.push({ id, data, aborted: false, key, handler, reject, resolve });
                this.isSleep && this.wakeUp(null);
            })
        };
    }
    dequeue(id) {
        for (const task of this.taskQueue) {
            if (task.id == id) {
                task.aborted = true;
                task.key && this.keySet.delete(task.key);
                return true;
            }
        }
        return false;
    }
    lock(key) {
        this.keySet.add(key);
        return this;
    }
    unlock(key) {
        this.keySet.delete(key);
        return this;
    }
    start() {
        if (this.started) {
            return;
        }
        else {
            console.log('process start');
            console.time('process live');
            this.started = true;
            this.process();
        }
        return this;
    }
    async process() {
        for await (const task of this.taskGenerator()) {
            if (task) {
                if (task.aborted) {
                    continue;
                }
                try {
                    task.resolve(await task.handler(task.data));
                }
                catch (error) {
                    task.reject(new error.constructor(error.message));
                }
                finally {
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
export class Promiseify extends Promise {
    constructor(...args) {
        let resolver;
        let rejector;
        super((resolve, reject) => {
            resolver = resolve;
            rejector = reject;
        });
        this.resolver = resolver;
        this.rejector = rejector;
    }
    static get [Symbol.species]() {
        return Promise;
    }
}
