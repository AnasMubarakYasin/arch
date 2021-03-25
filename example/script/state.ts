import { duplicate, genRandomString } from './helper.js';

export class State {
    static readonly NAME = 'State'
    static readonly finalizationRegistry = new FinalizationRegistry(
        (name) => {
            console.warn('[STATE]', name, 'was clean up');
        })
    static check(name: StateName): boolean {
        return this.store.has(name);
    }
    static destroy(state: StateStore<any, any>) {
        if (this.store.has(state.name)) {
            this.store.delete(state.name);

            state.channel.destroy();
            state.destroyAllClone();
            state.setFactory(() => null);
        }
    }
    static create<T extends Data<T>, K extends StateAction<K>>(
        name: StateName = '',
        data: T,
        ACTION: K,
    ): StateStore<T, K> {
        if (name.length === 0) {
            name = genRandomString(8);
        }
        const state = new StateStore<T, K>(name, data, ACTION);
        this.store.set(name, state);
        this.finalizationRegistry.register(state, state.name);
        return state;
    }
    static load<T, K>(name: StateName): StateStore<T, K> | null {
        const rawData = localStorage.getItem(this.NAME + name);
        if (this.check(name)) {
            return this.store.get(name) || null;
        } else if (rawData) {
            const stateInfo = JSON.parse(rawData);
            return this.create<T, K>(name, stateInfo.data, stateInfo.ACTION);
        } else {
            return null;
        }
    }
    static save(state: StateStore<any, any>) {
        localStorage.setItem(this.NAME + state.name, JSON.stringify({
            name: state.name,
            ACTION: state.ACTION,
            data: state.get(),
        }));
    }
    private static readonly store:
        Map<StateName, StateStore<any, any>> = new Map();
}

export interface StateStoreInterface<T, K> {
    ACTION: StateAction<K>;
    name: StateName;
    channel: StateClone<T, K>;
    get<J>(key?: keyof T): J extends keyof T ? T[keyof T] : T;
    set(value: T | T[keyof T], key?: keyof T): this;
    dispatch(ACTION: Action, extraData?: Data<any>): Promise<void>;
    setFactory(factoryStateHandler: FactoryStateCallback<T>): void;
    createClone(): StateClone<T, K>;
    destroyClone(ID: CloneID): void;
    destroyAllClone(): void;
}

class StateStore<D extends Data<D>, A extends StateAction<A>> {
    constructor(
        data: D,
        ACTION: A,
        name: StateName,
    ) {
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

    public readonly ACTION: A;
    public readonly name: StateName;
    public readonly data: D
    //   public readonly channel: StateClone<D, A>;
    // public readonly channelList: Array<StateChannel<T, K>>;
    // public readonly channelList: Array<WeakRef<StateChannel<T, K>>>;
    //   private readonly cloneList: Array<StateClone<D, A>>;
    // private readonly subscribers: Array<HandlerNotification<T>>;

    private factoryState: FactoryStateCallback<D>;
    // private handlerRequest: HandlerRequest;

    public async dispatch(ACTION: Action, extraData: Data<any> = {}) {
        const data = this.factoryState({
            ACTION,
            data: duplicate(this.data),
            extraData,
        });
        if (data instanceof Promise) {
            this.data = await data;
        } else {
            this.data = data;
        }
        this.publish(ACTION, duplicate<D>(this.data));
        return undefined;
    };
    private async publish(ACTION: Action, data: D): Promise<void> {
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
    public setFactory(factoryStateHandler: FactoryStateCallback<D>): void {
        this.factoryState = factoryStateHandler;
    };

    //   public get<J>(key?: keyof D): J extends keyof D ? D[keyof D] : D {
    //     if (key) {
    //       if (typeof this.data[key] === 'object') {
    //         return duplicate<D>(this.data[key]) as any;
    //       }
    //       return this.data[key];
    //     }
    //     return duplicate<D>(this.data) as any;
    //   }
    //   public set(value: D | D[keyof D], key?: keyof D) {
    //     if (key) {
    //       if (typeof this.data[key] === 'object') {
    //         this.data[key] = duplicate(value) as D[keyof D];
    //       } else {
    //         this.data[key] = value as D[keyof D];
    //       }
    //     } else {
    //       this.data = duplicate(value);
    //     }
    //     return this;
    //   }
    // public setReplyRequest(handlerRequest: HandlerRequest): void {
    //   this.handlerRequest = handlerRequest;
    // }
    // public subscribe(handler: HandlerNotification<T>): SubscriberID {
    //   return this.subscribers.push(handler) -1;
    // }
    // public unSubscribe(id: SubscriberID) {
    //   return this.subscribers.splice(id, 1);
    // }
    //   public createClone(): StateClone<D, A> {
    //     const clone = new StateClone(this, this.cloneList.length);
    //     // const weakRef = new WeakRef(channel);
    //     // this.channelList.push(weakRef);
    //     // const registry = new FinalizationRegistry((heldValue) => {
    //     // console.log(heldValue, 'destroy');
    //     // });
    //     // registry.register(channel, 'channel');
    //     this.cloneList.push(clone);
    //     return clone;
    //   }
    // public reply<J>(ACTION: Action, request: Data<J>): boolean {
    //   return this.handlerRequest(ACTION, request);
    // }
    //   public destroyClone(ID: CloneID) {
    //     this.cloneList.splice(ID, 1);
    //   }
    //   public destroyAllClone() {
    //     // console.log(this);
    //     for (const clone of this.cloneList) {
    //       clone.destroy();
    //       // channel.deref()!.destroy();
    //     }
    //     this.cloneList.length = 0;
    //     // console.log(...this.channelList);
    //   }
}

class StateClone<T, K> {
    constructor(source: StateStore<T, K>, ID: CloneID) {
        this.ref = new WeakRef(source);
        // this.source = source;
        this.ID = ID;
        this.name = source.name;
        this.ACTION = source.ACTION;
        this.subscribers = [];
        // this.isConnected = true;
    }

    private ref: WeakRef<StateStore<T, K>>;
    // private isConnected: boolean;

    public readonly ID;
    public readonly name: StateName;
    public readonly ACTION: K;

    // private readonly source: StateStore<T, K>;
    private readonly subscribers: Array<HandlerNotification<T>>;

    private get source() {
        const source = this.ref.deref();
        if (source) {
            return source;
        } else {
            throw new TypeError('source not exist');
        }
    }

    public get<J>(key?: keyof T) {
        return this.source.get<J>(key);
    }
    public subscribe(handler: HandlerNotification<T>): SubscriberID {
        return this.subscribers.push(handler) - 1;
    }
    public unSubscribe(id: SubscriberID) {
        return this.subscribers.splice(id, 1);
    }
    public async dispatch<J>(ACTION: Action, extraData: Data<J | any> = {}) {
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
    public async publish(ACTION: Action, data: T): Promise<void> {
        for (const subscriber of this.subscribers) {
            subscriber(ACTION, data);
        }
        return undefined;
    }
    public reset() {
        this.subscribers.length = 0;
    }
    public destroy() {
        this.reset();
        // delete this.ref;
    }
}

type PrimitiveData = boolean | number | string;
type TypeofPrimitive = 'boolean' | 'number' | 'string';
type SubscribeHandler<T> = (value: T) => void;

export class ReactiveData<T extends PrimitiveData> {
    readonly type: TypeofPrimitive;

    private _value: T;
    private _subscribers: WeakRef<SubscribeHandler<T>>[] = [];

    constructor(value: T) {
        this.type = typeof value as TypeofPrimitive;
        this._value = value;

        const allowableType = ['string', 'number', 'boolean'];

        if (allowableType.includes(this.type) == false) {
            throw new TypeError(`Type not allowed: ${this.type}. Allowable type is ${allowableType.join(', ')}.`)
        }
    }
    set value(value: T) {
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
            return  substring.toUpperCase();
        });
    }

    [Symbol.toPrimitive](hint: 'string' | 'number' | 'default') {
        return this._value;
    }

    subscribe(handler: SubscribeHandler<T>) {
        this._subscribers.push(new WeakRef(handler));
    }
    unSubscribe(handler: SubscribeHandler<T>) {
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
        } else {
            return undefined;
        }
    }
    publish(value: T) {
        for (const subscriber of this._subscribers) {
            const handler = subscriber.deref();
            if (handler) {
                handler(value);
            }
        }
    }
}

type KeyOf<O extends object> = {
    [P in keyof O]: O[P]
}

class ReactiveDataSet {
    static create<O extends object>(object: O): KeyOf<O> {
        return object
    }
    constructor() {

    }
}

let a = ReactiveDataSet.create({name: 'anas'});

a.name

// function gen<O extends KeyOf<O>>(object: O): O & Reactive

// let state = gen({name: 'anas', age: 21});

type Data<T> = {
    [P in keyof T]: T[P];
};
type StateAction<T> = {
    [P in keyof T]: T[P];
};

type StateName = string;
type Action = number
type StateMaterial<T> = {
    ACTION: Action;
    data: Data<T>;
    extraData: Data<T | any>;
}
// type HandlerRequest = (ACTION: Action, request: Data<any> | any) => boolean;
// type SubscribeRegister<T> = {
//   id: SubscriberID;
//   person?: StateName;
//   handler: HandlerNotification<T>;
// }
type FactoryStateCallback<T> = (material: StateMaterial<T>) => T | Promise<T>;
type HandlerNotification<T> = (ACTION: Action, data: T) => void;
type SubscriberID = number;
type CloneID = number;