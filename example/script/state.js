import { duplicate, genRandomString } from './helper.js';
let State = /** @class */ (() => {
    class State {
        static check(name) {
            return this.store.has(name);
        }
        static destroy(state) {
            if (this.store.has(state.name)) {
                this.store.delete(state.name);
                state.channel.destroy();
                state.destroyAllClone();
                state.setFactory(() => null);
            }
        }
        static create(name = '', data, ACTION) {
            if (name.length === 0) {
                name = genRandomString(8);
            }
            const state = new StateStore(name, data, ACTION);
            this.store.set(name, state);
            this.finalizationRegistry.register(state, state.name);
            return state;
        }
        static load(name) {
            const rawData = localStorage.getItem(this.NAME + name);
            if (this.check(name)) {
                return this.store.get(name) || null;
            }
            else if (rawData) {
                const stateInfo = JSON.parse(rawData);
                return this.create(name, stateInfo.data, stateInfo.ACTION);
            }
            else {
                return null;
            }
        }
        static save(state) {
            localStorage.setItem(this.NAME + state.name, JSON.stringify({
                name: state.name,
                ACTION: state.ACTION,
                data: state.get(),
            }));
        }
    }
    State.NAME = 'State';
    State.finalizationRegistry = new FinalizationRegistry((name) => {
        console.warn('[STATE]', name, 'was clean up');
    });
    State.store = new Map();
    return State;
})();
export { State };
class StateStore {
    constructor(data, ACTION, name) {
        this.data = data;
        this.ACTION = ACTION;
        this.name = name;
        this.cloneList = [];
        // this.subscribers = [];
        this.channel = new StateClone(this, -1);
        // this.channelList = [];
        // this.history = [data];
        this.factoryState = () => {
            throw new TypeError('method not implement');
        };
        // this.handlerRequest = () => {
        //   throw new TypeError('method not implement');
        // };
    }
    // private handlerRequest: HandlerRequest;
    async dispatch(ACTION, extraData = {}) {
        const data = this.factoryState({
            ACTION,
            data: duplicate(this.data),
            extraData,
        });
        if (data instanceof Promise) {
            this.data = await data;
        }
        else {
            this.data = data;
        }
        this.publish(ACTION, duplicate(this.data));
        return undefined;
    }
    ;
    async publish(ACTION, data) {
        this.channel.publish(ACTION, data);
        for (const clone of this.cloneList) {
            // for (const refChannel of this.channelList) {
            // const channel = refChannel.deref();
            // if (channel) {
            //   channel.publish(ACTION, data);
            // } else {
            //   this.channelList.shift();
            // }
            clone.publish(ACTION, data);
        }
        return undefined;
    }
    setFactory(factoryStateHandler) {
        this.factoryState = factoryStateHandler;
    }
    ;
}
class StateClone {
    constructor(source, ID) {
        this.ref = new WeakRef(source);
        // this.source = source;
        this.ID = ID;
        this.name = source.name;
        this.ACTION = source.ACTION;
        this.subscribers = [];
        // this.isConnected = true;
    }
    get source() {
        const source = this.ref.deref();
        if (source) {
            return source;
        }
        else {
            throw new TypeError('source not exist');
        }
    }
    get(key) {
        return this.source.get(key);
    }
    subscribe(handler) {
        return this.subscribers.push(handler) - 1;
    }
    unSubscribe(id) {
        return this.subscribers.splice(id, 1);
    }
    async dispatch(ACTION, extraData = {}) {
        this.source.dispatch(ACTION, extraData);
    }
    // eslint-disable-next-line max-len
    // public requestDispatch(ACTION: Action, request: Data<T | any> = {}): boolean {
    //   if (this.source.reply(ACTION, request)) {
    //     this.source.dispatch(ACTION, request);
    //     return true;
    //   } else {
    //     return false;
    //   }
    // }
    async publish(ACTION, data) {
        for (const subscriber of this.subscribers) {
            subscriber(ACTION, data);
        }
        return undefined;
    }
    reset() {
        this.subscribers.length = 0;
    }
    destroy() {
        this.reset();
        // delete this.ref;
    }
}
export class ReactiveData {
    constructor(value) {
        this._subscribers = [];
        this.type = typeof value;
        this._value = value;
        const allowableType = ['string', 'number', 'boolean'];
        if (allowableType.includes(this.type) == false) {
            throw new TypeError(`Type not allowed: ${this.type}. Allowable type is ${allowableType.join(', ')}.`);
        }
    }
    set value(value) {
        if (this._value !== value) {
            this._value = value;
            this.publish(value);
        }
    }
    get value() {
        return this._value;
    }
    get [Symbol.toStringTag]() {
        return this.type.replace(/^./, (substring) => {
            return substring.toUpperCase();
        });
    }
    [Symbol.toPrimitive](hint) {
        return this._value;
    }
    subscribe(handler) {
        this._subscribers.push(new WeakRef(handler));
    }
    unSubscribe(handler) {
        let index = 0;
        let pos = 0;
        for (const subscriber of this._subscribers) {
            if (Object.is(subscriber.deref(), handler)) {
                pos = index;
            }
            index++;
        }
        if (pos) {
            return this._subscribers.splice(pos, 1);
        }
        else {
            return undefined;
        }
    }
    publish(value) {
        for (const subscriber of this._subscribers) {
            const handler = subscriber.deref();
            if (handler) {
                handler(value);
            }
        }
    }
}
class ReactiveDataSet {
    static create(object) {
        return object;
    }
    constructor() {
    }
}
let a = ReactiveDataSet.create({ name: 'anas' });
a.name;
