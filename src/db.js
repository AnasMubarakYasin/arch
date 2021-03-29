import { Promiseify } from './unsafe-util.js';
export const env = {
    debug: false
};
export function open(name, version) {
    return new DBOpenRequest(indexedDB.open(name, version));
}
class DBKeyRange {
    static bound(lower, upper, lowerOpen, upperOpen) {
        return IDBKeyRange.bound(lower, upper, lowerOpen, upperOpen);
    }
    static only(value) {
        return IDBKeyRange.only(value);
    }
    static lowerBound(lower, open) {
        return IDBKeyRange.lowerBound(lower, open);
    }
    static upperBound(upper, open) {
        return IDBKeyRange.upperBound(upper, open);
    }
}
class DBOpenRequest extends Promiseify {
    constructor(openRequest) {
        super();
        this.onsuccess = (db) => { env.debug && console.info('success open db:', db.name); };
        this.onupgrade = (db) => { env.debug && console.info('success upgrade db:', db.name); };
        this.onerror = (error) => { env.debug && console.error(error); };
        this.onblock = (error) => { env.debug && console.error(error); };
        let db;
        openRequest.addEventListener('upgradeneeded', (event) => {
            this.onupgrade(db = new DBDatabase(openRequest.result, openRequest));
        });
        openRequest.addEventListener('success', (event) => {
            this.resolver(db ?? (db = new DBDatabase(openRequest.result, openRequest)));
            this.onsuccess(db);
        });
        openRequest.addEventListener('error', (event) => {
            this.onerror(openRequest.error);
            this.rejector(openRequest.error);
        });
        openRequest.addEventListener('blocked', (event) => {
            this.onblock(openRequest.error);
            this.rejector(openRequest.error);
        });
    }
    onSuccess(handler) {
        this.onsuccess = handler;
        return this;
    }
    onUpgrade(handler) {
        this.onupgrade = handler;
        return this;
    }
    onError(handler) {
        this.onerror = handler;
        return this;
    }
    onBlock(handler) {
        this.onblock = handler;
        return this;
    }
}
class DBDatabase {
    constructor(db, openRequest) {
        this.onchange = (db) => { env.debug && console.info('db change:', this.db.name); };
        this.onabort = (error) => { env.debug && console.error(error); };
        this.onerror = (error) => { env.debug && console.error(error); };
        this.onclose = (error) => { env.debug && console.error(error); };
        this.db = db;
        this.openRequest = openRequest;
        db.addEventListener('versionchange', (event) => {
            this.onchange(this);
        });
        db.addEventListener('abort', (event) => {
            this.onabort(event.target.error);
        });
        db.addEventListener('error', (event) => {
            this.onerror(event.target.error);
        });
        db.addEventListener('close', (event) => {
            this.onclose('db ' + db.name + ' closed');
        });
    }
    get objectStoreNames() {
        return this.db.objectStoreNames;
    }
    get name() {
        return this.db.name;
    }
    async create(name, options) {
        if (this.openRequest.transaction) {
            return new DBReadWriteObjectStore(this.db.createObjectStore(name, options));
        }
        else {
            this.db.close();
            return (await open(this.db.name, this.db.version + 1)).create(name, options);
        }
    }
    delete(name) {
        this.db.deleteObjectStore(name);
        return this;
    }
    close() {
        this.db.close();
        return this;
    }
    contains(name) {
        return this.db.objectStoreNames.contains(name);
    }
    read(name, handler) {
        return new DBOperation(this.db.transaction(name, 'readonly'), handler);
    }
    write(name, handler) {
        return new DBOperation(this.db.transaction(name, 'readonly'), handler);
    }
    onChange(handler) {
        this.onchange = handler;
        return this;
    }
    onAbort(handler) {
        this.onabort = handler;
        return this;
    }
    onError(handler) {
        this.onerror = handler;
        return this;
    }
    onClose(handler) {
        this.onclose = handler;
        return this;
    }
}
class DBRequest {
    promiseifyRequest(request) {
        const promiseify = new Promiseify();
        request.addEventListener('success', (event) => {
            promiseify.resolver(event.target.result);
        });
        request.addEventListener('error', (event) => {
            promiseify.rejector(event.target.error);
        });
        return promiseify;
    }
}
class DBReadOnlyObjectStore extends DBRequest {
    constructor(objectStore) {
        super();
        this.objectStore = objectStore;
    }
    get name() {
        return this.objectStore.name;
    }
    get(query) {
        return this.promiseifyRequest(this.objectStore.get(query));
    }
    getAll(query, count) {
        return this.promiseifyRequest(this.objectStore.getAll(query));
    }
    getKey(query) {
        return this.promiseifyRequest(this.objectStore.getKey(query));
    }
    getAllKeys(query, count) {
        return this.promiseifyRequest(this.objectStore.getAllKeys(query));
    }
    count(key) {
        return this.promiseifyRequest(this.objectStore.count(key));
    }
    index(name) {
        return new DBReadOnlyIndex(this.objectStore.index(name));
    }
    openKeyCursor(query, direction) {
        return this.objectStore.openKeyCursor(query, direction);
    }
}
class DBReadWriteObjectStore extends DBReadOnlyObjectStore {
    clear() {
        return this.promiseifyRequest(this.objectStore.clear());
    }
    add(value) {
        return this.promiseifyRequest(this.objectStore.add(value));
    }
    addAll(values) {
        const requests = [];
        for (const value of values) {
            requests.push(this.promiseifyRequest(this.objectStore.add(value)));
        }
        return Promise.allSettled(requests);
    }
    put(value, key) {
        return this.promiseifyRequest(this.objectStore.put(value, key));
    }
    delete(key) {
        return this.promiseifyRequest(this.objectStore.delete(key));
    }
    createIndex(name, keyPath, options) {
        return new DBReadWriteIndex(this.objectStore.createIndex(name, keyPath, options));
    }
    deleteIndex(name) {
        return this.objectStore.deleteIndex(name);
    }
    openCursor(query, direction) {
        return this.objectStore.openCursor(query, direction);
    }
}
class DBReadOnlyIndex extends DBRequest {
    constructor(index) {
        super();
        this.index = index;
    }
    count(key) {
        return this.promiseifyRequest(this.index.count(key));
    }
    get(key) {
        return this.promiseifyRequest(this.index.get(key));
    }
    getKey(key) {
        return this.promiseifyRequest(this.index.getKey(key));
    }
    getAll(query, count) {
        return this.promiseifyRequest(this.index.getAll(query, count));
    }
    getAllKeys(query, count) {
        return this.promiseifyRequest(this.index.getAllKeys(query, count));
    }
    openKeyCursor(query, direction) {
        return this.index.openKeyCursor(query, direction);
    }
}
class DBReadWriteIndex extends DBReadOnlyIndex {
    openCursor(query, direction) {
        return this.index.openCursor(query, direction);
    }
}
class DBCursor {
    constructor() {
    }
}
class DBOperation extends Promiseify {
    constructor(transaction, handler) {
        super();
        this.oncomplete = (result) => { env.debug && console.info('operation complete', result); };
        this.onerror = (error) => { env.debug && console.error(error); };
        this.onabort = (error) => { env.debug && console.error(error); };
        let store;
        const Construct = transaction.mode == 'readonly' ? DBReadOnlyObjectStore : DBReadWriteObjectStore;
        if (transaction.objectStoreNames.length > 1) {
            for (const name of transaction.objectStoreNames) {
                store[name] = new Construct(transaction.objectStore(name));
            }
        }
        else {
            store = new Construct(transaction.objectStore(transaction.objectStoreNames[0]));
        }
        const result = handler(store);
        transaction.addEventListener('complete', (event) => {
            this.resolver(result);
            this.oncomplete(result);
        });
        transaction.addEventListener('error', (event) => {
            const error = event.target.error;
            this.rejector(error);
            this.onerror(error);
        });
        transaction.addEventListener('abort', (event) => {
            const error = event.target.error;
            this.rejector(error);
            this.onabort(error);
        });
    }
    complete(handler) {
        this.oncomplete = handler;
        return this;
    }
    error(handler) {
        this.onerror = handler;
        return this;
    }
    abort(handler) {
        this.onabort = handler;
        return this;
    }
}
