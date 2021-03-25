export class ObserverUnsafe {
    constructor(data) {
        this.subscribers = [];
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
    }
    get() {
        return this.value;
    }
    update(value) {
        this.publish(value ?? this.value);
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
        // const startTime = Date.now();
        for (const subscriber of this.subscribers) {
            subscriber(value);
        }
        // console.log(this.constructor.name, 'take time publish', (Date.now() - startTime), 'ms');
    }
    [Symbol.toPrimitive](hint) {
        return this.value;
    }
    toJSON(key) {
        return this.value;
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
let ProcessManagementUnsafe = /** @class */ (() => {
    class ProcessManagementUnsafe {
        static get isStarted() {
            return this.started;
        }
        static get queued() {
            return this.taskQueue.length;
        }
        static sleep() {
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
        static async *taskGenerator() {
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
        static queue(data, handler, key) {
            if (key) {
                if (this.keySet.has(key)) {
                    console.warn('The task locked');
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
                }).finally(() => key && this.keySet.delete(key))
            };
        }
        static dequeue(id) {
            for (const task of this.taskQueue) {
                if (task.id == id) {
                    task.aborted = true;
                    task.key && this.keySet.delete(task.key);
                    return true;
                }
            }
            return false;
        }
        static lock(key) {
            this.keySet.add(key);
            return this;
        }
        static unlock(key) {
            this.keySet.delete(key);
            return this;
        }
        static start() {
            if (this.started) {
                return;
            }
            else {
                console.log('process start');
                console.time('process live');
                this.started = true;
                this.process();
            }
        }
        static async process() {
            for await (const task of this.taskGenerator()) {
                if (task) {
                    console.time('process time');
                    if (task.aborted) {
                        console.timeEnd('process time');
                        continue;
                    }
                    try {
                        task.resolve(await task.handler(task.data));
                    }
                    catch (error) {
                        task.reject(error);
                    }
                    finally {
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
    ProcessManagementUnsafe.taskQueue = [];
    ProcessManagementUnsafe.keySet = new Set();
    ProcessManagementUnsafe.started = false;
    ProcessManagementUnsafe.isSleep = false;
    return ProcessManagementUnsafe;
})();
export { ProcessManagementUnsafe };
ProcessManagementUnsafe.start();
