import { ProcessManagementUnsafe } from './unsafe-util.js';

type HandlerInit = {
    [index: string]: (data: any) => Promise<any> | any;
}
type KeyOf<O> = keyof O;
type ValueOf<O> = O[KeyOf<O>];
type MemberOf<O, K extends KeyOf<O>> = O[K];
type Parameter<F> = F extends (data: infer P) => void ? P : never;
type Return<F> = F extends (data: any) => infer R ? R : never;
type ExtractPromise<P> = P extends Promise<infer T> ? T : never;
type P<H> = Parameter<H>;
type PR<H> = ExtractPromise<Return<ValueOf<H>>>;
// type InitAction = (controller: ActionController)

export class ActionController<H extends HandlerInit> {
    readonly handler: H;
    readonly process: ProcessManagementUnsafe;
    constructor(handler: H) {
        this.handler = handler;
        this.process = new ProcessManagementUnsafe('@'+this.constructor.name);
    }
    dispatch<N extends KeyOf<H>, D extends P<MemberOf<H, N>>, R = PR<H>>(name: N, data: D = {} as D) {;
        return this.process.queue<D, R, string>(data, this.handler[name], name as string).promise;
    }
    multiDispatch<N extends KeyOf<H>, D extends P<MemberOf<H, N>>, R = PR<H>>(name: N, data: D = {} as D) {;
        return this.process.queue<D, R, undefined>(data, this.handler[name]).promise;
    }
}
