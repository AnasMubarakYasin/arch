import { ProcessManagementUnsafe } from './unsafe-util.js';
export class ActionController {
    constructor(handler) {
        this.mapProcess = new Map();
        this.handler = handler;
    }
    dispatch(name, data = {}, multiCall = false) {
        const key = multiCall ? undefined : name;
        const result = ProcessManagementUnsafe
            .queue(data, this.handler[name], key);
        key && this.mapProcess.set(key, result.id);
        return result.promise;
    }
    abort(name) {
        const id = this.mapProcess.get(name);
        if (id) {
            this.mapProcess.delete(name);
            return ProcessManagementUnsafe.dequeue(id);
        }
        else {
            return false;
        }
    }
}
