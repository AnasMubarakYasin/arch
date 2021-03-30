import { ProcessManagementUnsafe } from './unsafe-util.js';
// type InitAction = (controller: ActionController)
export class ActionController {
    constructor(handler) {
        this.handler = handler;
        this.process = new ProcessManagementUnsafe('@' + this.constructor.name);
    }
    dispatch(name, data = {}) {
        ;
        return this.process.queue(data, this.handler[name], name).promise;
    }
    multiDispatch(name, data = {}) {
        ;
        return this.process.queue(data, this.handler[name]).promise;
    }
}
