export class ProcessManagementUnsafe {
    constructor(name = '') {
        this.derferQueue = [];
        this.taskQueue = [];
        this.keySet = new Set();
        this.started = false;
        this.isSleep = false;
        this.start();
        this.name = name;
        this.id = this.genPid();
    }
    static get instance() {
        return this.global ?? (this.global = new ProcessManagementUnsafe('@global'));
    }
    get genPid() {
        return function* () {
            let id = 0;
            while (true) {
                yield ++id;
            }
        };
    }
    get isStarted() {
        return this.started;
    }
    get queued() {
        return this.taskQueue.length;
    }
    sleep() {
        return new Promise((resolve) => {
            ProcessManagementUnsafe.debug && console.log(this.name + ' process sleep');
            ProcessManagementUnsafe.debug && console.timeEnd(this.name + ' process live');
            this.wakeUp = resolve;
            this.isSleep = true;
        }).finally(() => {
            ProcessManagementUnsafe.debug && console.log(this.name + ' process wake up');
            ProcessManagementUnsafe.debug && console.time(this.name + ' process live');
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
    queue(data, handler, key, timeout) {
        if (timeout && !key) {
            throw TypeError('Cannot use timeout without key');
        }
        if (key && !timeout) {
            if (this.keySet.has(key)) {
                ProcessManagementUnsafe.debug && console.warn(this.name + ' The task is locked');
                this.taskQueue.find((task) => task.id == 0)?.reject('lala');
                return { id: -1, promise: Promise.resolve(undefined) };
            }
            else {
                this.keySet.add(key);
            }
        }
        const id = this.id.next().value;
        return {
            id,
            promise: new Promise((resolve, reject) => {
                const task = { id, data, key, timeout, handler, reject, resolve };
                this.isSleep ? this.wakeUp(task) : this.taskQueue.push(task);
            })
        };
    }
    dequeue(id) {
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
    lock(key) {
        this.keySet.add(key);
        return this;
    }
    unlock(key) {
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
    async process() {
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
            }
            catch (error) {
                task.reject(new error.constructor(error.message));
            }
            finally {
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
ProcessManagementUnsafe.debug = true;
export class ObserverUnsafe {
    constructor(data) {
        this.subscribers = [];
        this.binds = new Map();
        this[Symbol.isConcatSpreadable] = true;
        this.type = typeof data;
        this.raw = data;
        this.defer = false;
        this.deferTime = 12;
    }
    set(value) {
        if (value != this.raw) {
            const type = typeof value;
            if (type != this.type) {
                throw new TypeError(`Mismatch on type, expect ${this.type} but ${type}`);
            }
            this.raw = value;
            this.publish(value);
        }
        return this;
    }
    equal(value) {
        return this.raw == value;
    }
    get() {
        return this.raw;
    }
    update(value) {
        this.publish(value ?? this.raw);
        return this;
    }
    bind(observeableData, handler) {
        handler = handler ?? ((value) => { observeableData.set(value); });
        this.binds.set(observeableData, handler);
        this.subscribe(handler);
        observeableData.set(this.raw).subscribe((value) => { this.set(value); });
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
        console.time('@' + this.constructor.name + ' publish ' + (this.defer ? 'defer' : ''));
        if (this.defer) {
            ObserverUnsafe.broadcast.queue(null, async () => {
                for (const subscriber of this.subscribers) {
                    await subscriber(value);
                }
            }, 'publish', this.deferTime);
        }
        else {
            for (const subscriber of this.subscribers) {
                subscriber(value);
            }
        }
        console.timeEnd('@' + this.constructor.name + ' publish ' + (this.defer ? 'defer' : ''));
    }
    [Symbol.toPrimitive](hint) {
        return this.raw;
    }
    toJSON(key) {
        return this.raw;
    }
}
ObserverUnsafe.broadcast = new ProcessManagementUnsafe('@ObserverUnsafe');
export class ObserverAPIUnsafe extends ObserverUnsafe {
    constructor() {
        super(...arguments);
        this.subscribersAPI = [];
    }
    subscribeAPI(handler) {
        if (typeof handler == 'function') {
            this.subscribersAPI.push(handler);
        }
        else {
            throw new TypeError(`Mismatch on type, expect function but ${typeof handler}`);
        }
        ;
        return this;
    }
    unsubscribeAPI(handler) {
        for (let index = 0; index < this.subscribersAPI.length; index++) {
            if (Object.is(this.subscribersAPI[index], handler)) {
                this.subscribersAPI.splice(index, 1);
                return true;
            }
        }
        return false;
    }
    publishAPI(data) {
        console.time(this.constructor.name + ' publish API');
        for (const subscriber of this.subscribersAPI) {
            subscriber(data);
        }
        console.timeEnd(this.constructor.name + ' publish API');
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
