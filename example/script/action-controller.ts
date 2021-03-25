import {ProcessManagementUnsafe} from './unsafe-util.js';

type HandlerInit = {
    [index: string]: (data: any) => Promise<any>;
}
type KeyOf<O> = keyof O;
type ValueOf<O> = O[KeyOf<O>]
type Parameter<F> = F extends (data: infer P) => void ? P : never;
type Return<F> = F extends (data: any) => infer R ? R : never;
type ExtractPromise<P> = P extends Promise<infer T> ? T : never;
type D<H> = Parameter<ValueOf<H>>
type R<H> = ExtractPromise<Return<ValueOf<H>>>

export class ActionController<H extends HandlerInit> {
    handler: H;
    mapProcess: Map<string, number> = new Map();
    constructor(handler: H) {
        this.handler = handler;
    }
    dispatch<Result = R<H>>(name: KeyOf<H>, data: object = {}, multiCall = false) {
        const key = multiCall ? undefined : name as string;
        const result = ProcessManagementUnsafe
            .queue<object, Result>(data, this.handler[name], key);
        key && this.mapProcess.set(key, result.id);
        return result.promise;
    }
    abort(name: KeyOf<H>) {
        const id = this.mapProcess.get(name as string);
        if (id) {
            this.mapProcess.delete(name as string);
            return ProcessManagementUnsafe.dequeue(id);
        } else {
            return false;
        }
    }
}
