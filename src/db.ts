import { Promiseify } from './unsafe-util.js';

export const env = {
  debug: false
}

export interface DBStoreScheme {
  [name: string]: {} | string;
}

export interface DBIndexScheme {
  [index: string]: {}
}

type ExtractKey<O> = {
  [P in keyof O]: {}
}

export function open<StoreScheme extends DBStoreScheme>(name: string, version?: number) {
  return new DBOpenRequest<StoreScheme>(indexedDB.open(name, version));
}

class DBKeyRange {
  static bound(lower: any, upper: any, lowerOpen?: boolean | undefined, upperOpen?: boolean | undefined) {
    return IDBKeyRange.bound(lower, upper, lowerOpen, upperOpen);
  }
  static only(value: string | number) {
    return IDBKeyRange.only(value);
  }
  static lowerBound(lower: string | number, open?: boolean | undefined) {
    return IDBKeyRange.lowerBound(lower, open);
  }
  static upperBound(upper: string | number, open?: boolean | undefined) {
    return IDBKeyRange.upperBound(upper, open);
  }
}

class DBOpenRequest<Scheme extends DBStoreScheme> extends Promiseify<DBDatabase<Scheme>> {
  protected onsuccess = (db: DBDatabase<Scheme>) => { env.debug && console.info('success open db:', db.name) }
  protected onupgrade = (db: DBDatabase<Scheme>) => { env.debug && console.info('success upgrade db:', db.name) }
  protected onerror = (error: any) => { env.debug && console.error(error) }
  protected onblock = (error: any) => { env.debug && console.error(error) }

  constructor(openRequest: IDBOpenDBRequest) {
    super();

    let db: any;

    openRequest.addEventListener('upgradeneeded', (event) => {
      this.onupgrade(db = new DBDatabase<Scheme>(openRequest.result, openRequest));
    });
    openRequest.addEventListener('success', (event) => {
      this.resolver(db ?? (db = new DBDatabase<Scheme>(openRequest.result, openRequest)));
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

  onSuccess(handler: (db: DBDatabase<Scheme>) => void) {
    this.onsuccess = handler;
    return this;
  }
  onUpgrade(handler: (db: DBDatabase<Scheme>) => void) {
    this.onupgrade = handler;
    return this;
  }
  onError(handler: (error: any) => void) {
    this.onerror = handler;
    return this;
  }
  onBlock(handler: (error: any) => void) {
    this.onblock = handler;
    return this;
  }
}

type IDBTransactionOptions = {
  durability: 'default' | 'strict' | 'relaxed'
}

class DBDatabase<Scheme extends DBStoreScheme> {
  protected onchange = (db: DBDatabase<Scheme>) => { env.debug && console.info('db change:', this.db.name) };
  protected onabort = (error: any) => { env.debug && console.error(error) };
  protected onerror = (error: any) => { env.debug && console.error(error) };
  protected onclose = (error: any) => { env.debug && console.error(error) };

  openRequest: IDBOpenDBRequest;
  db: IDBDatabase;

  get objectStoreNames() {
    return this.db.objectStoreNames;
  }
  get name() {
    return this.db.name;
  }

  constructor(db: IDBDatabase, openRequest: IDBOpenDBRequest) {
    this.db = db;
    this.openRequest = openRequest;

    db.addEventListener('versionchange', (event) => {
      this.onchange(this);
    });
    db.addEventListener('abort', (event) => {
      this.onabort((event.target as IDBTransaction).error);
    });
    db.addEventListener('error', (event) => {
      this.onerror((event.target as IDBTransaction).error);
    });
    db.addEventListener('close', (event) => {
      this.onclose('db ' + db.name + ' closed');
    });
  }

  async create<Name extends keyof Scheme>(name: Name, options?: IDBObjectStoreParameters): Promise<DBReadWriteObjectStore<Scheme[Name]>> {
    if (this.openRequest.transaction) {
      return new DBReadWriteObjectStore(this.db.createObjectStore(name as string, options));
    } else {
      this.db.close();
      return (await open<Scheme>(this.db.name, this.db.version + 1)).create<Name>(name, options);
    }
  }
  delete(name: string) {
    this.db.deleteObjectStore(name);
    return this;
  }
  close() {
    this.db.close();
    return this;
  }
  contains<Name extends keyof Scheme>(name: Name) {
    return this.db.objectStoreNames.contains(name as string);
  }

  read<Name extends (keyof Scheme | (keyof Scheme)[]), Result>(name: Name, handler: (store: Name extends keyof Scheme ? DBReadOnlyObjectStore<Scheme[Name]> : { [N in keyof Scheme]: DBReadOnlyObjectStore<Scheme[N]> }) => Result): DBOperation<Result>
  read<Name extends keyof Scheme, Result>(name: Name, handler: (store: DBReadOnlyObjectStore<Scheme[Name]>) => Result) {
    return new DBOperation<Result>(this.db.transaction(name as (string | string[]), 'readonly'), handler);
  }

  write<Name extends (keyof Scheme | (keyof Scheme)[]), Result>(name: Name, handler: (store: Name extends keyof Scheme ? DBReadWriteObjectStore<Scheme[Name]> : { [N in keyof Scheme]: DBReadWriteObjectStore<Scheme[N]> }) => Result): DBOperation<Result>
  write<Name extends keyof Scheme, Result>(name: Name, handler: (store: DBReadWriteObjectStore<Scheme[Name]>) => Result) {
    return new DBOperation<Result>(this.db.transaction(name as (string | string[]), 'readonly'), handler);
  }

  onChange(handler: (db: DBDatabase<Scheme>) => void) {
    this.onchange = handler;
    return this;
  }
  onAbort(handler: (error: any) => void) {
    this.onabort = handler;
    return this;
  }
  onError(handler: (error: any) => void) {
    this.onerror = handler;
    return this;
  }
  onClose(handler: (error: any) => void) {
    this.onclose = handler;
    return this;
  }
}

// type HandlerOperation<I> = (store: DBStoreOperation<I>) => any;
type InferRequest<O> = O extends IDBRequest<infer T> ? T : never;

class DBRequest {
  promiseifyRequest<T extends IDBRequest<R>, R = InferRequest<T>>(request: T) {
    const promiseify = new Promiseify<R>();
    request.addEventListener('success', (event) => {
      promiseify.resolver((event.target as IDBRequest).result);
    });
    request.addEventListener('error', (event) => {
      promiseify.rejector((event.target as IDBRequest).error);
    });
    return promiseify;
  }
}

class DBReadOnlyObjectStore<Item> extends DBRequest {
  objectStore: IDBObjectStore;
  get name() {
    return this.objectStore.name;
  }
  constructor(objectStore: IDBObjectStore) {
    super();
    this.objectStore = objectStore;
  }


  get(query: IDBValidKey | IDBKeyRange) {
    return this.promiseifyRequest(this.objectStore.get(query)) as Promiseify<Item | undefined>;
  }

  getAll(query?: IDBValidKey | IDBKeyRange | null | undefined, count?: number | undefined) {
    return this.promiseifyRequest(this.objectStore.getAll(query)) as Promiseify<Item[]>;
  }

  getKey(query: IDBValidKey | IDBKeyRange) {
    return this.promiseifyRequest(this.objectStore.getKey(query));
  }
  getAllKeys(query?: IDBValidKey | IDBKeyRange | null | undefined, count?: number | undefined) {
    return this.promiseifyRequest(this.objectStore.getAllKeys(query));
  }

  count(key?: IDBValidKey | IDBKeyRange | undefined) {
    return this.promiseifyRequest(this.objectStore.count(key));
  }

  index(name: string) {
    return new DBReadOnlyIndex<Item>(this.objectStore.index(name));
  }

  openKeyCursor(query?: IDBValidKey | IDBKeyRange | null | undefined, direction?: IDBCursorDirection | undefined) {
    return this.objectStore.openKeyCursor(query, direction);
  }
}

class DBReadWriteObjectStore<Item> extends DBReadOnlyObjectStore<Item> {
  clear() {
    return this.promiseifyRequest(this.objectStore.clear());
  }
  add(value: Item) {
    return this.promiseifyRequest(this.objectStore.add(value));
  }
  addAll(values: Item[]) {
    const requests = [];
    for (const value of values) {
      requests.push(this.promiseifyRequest(this.objectStore.add(value)));
    }
    return Promise.allSettled(requests);
  }
  put(value: Item, key?: IDBValidKey | undefined) {
    return this.promiseifyRequest(this.objectStore.put(value, key));
  }
  delete(key: IDBValidKey | IDBKeyRange) {
    return this.promiseifyRequest(this.objectStore.delete(key));
  }
  createIndex<Item>(name: string, keyPath: string | string[], options?: IDBIndexParameters | undefined) {
    return new DBReadWriteIndex<Item>(this.objectStore.createIndex(name, keyPath, options));
  }
  deleteIndex(name: string) {
    return this.objectStore.deleteIndex(name);
  }

  openCursor(query?: IDBValidKey | IDBKeyRange | null | undefined, direction?: IDBCursorDirection | undefined) {
    return this.objectStore.openCursor(query, direction);
  }
}

class DBReadOnlyIndex<Item> extends DBRequest {
  index: IDBIndex;

  constructor(index: IDBIndex) {
    super();
    this.index = index;
  }

  count(key?: IDBValidKey | IDBKeyRange | undefined) {
    return this.promiseifyRequest(this.index.count(key));
  }
  get(key: IDBValidKey | IDBKeyRange) {
    return this.promiseifyRequest(this.index.get(key)) as Promiseify<Item | undefined>;
  }
  getKey(key: IDBValidKey | IDBKeyRange) {
    return this.promiseifyRequest(this.index.getKey(key));
  }
  getAll(query?: IDBValidKey | IDBKeyRange | null | undefined, count?: number | undefined) {
    return this.promiseifyRequest(this.index.getAll(query, count)) as Promiseify<Item[]>;
  }
  getAllKeys(query?: IDBValidKey | IDBKeyRange | null | undefined, count?: number | undefined) {
    return this.promiseifyRequest(this.index.getAllKeys(query, count));
  }

  openKeyCursor(query?: IDBValidKey | IDBKeyRange | null | undefined, direction?: IDBCursorDirection | undefined) {
    return this.index.openKeyCursor(query, direction);
  }
}

class DBReadWriteIndex<Item> extends DBReadOnlyIndex<Item> {
  openCursor(query?: IDBValidKey | IDBKeyRange | null | undefined, direction?: IDBCursorDirection | undefined) {
    return this.index.openCursor(query, direction);
  }
}

class DBCursor<Item> {
  constructor() {

  }
}

class DBOperation<Result> extends Promiseify<Result> {
  protected oncomplete = (result: Result) => { env.debug && console.info('operation complete', result) };
  protected onerror = (error: any) => { env.debug && console.error(error) };
  protected onabort = (error: any) => { env.debug && console.error(error) };

  constructor(transaction: IDBTransaction, handler: (store: any) => Result) {
    super();
    let store: any;
    const Construct = transaction.mode == 'readonly' ? DBReadOnlyObjectStore : DBReadWriteObjectStore;
    if (transaction.objectStoreNames.length > 1) {
      for (const name of transaction.objectStoreNames) {
        store[name] = new Construct(transaction.objectStore(name));
      }
    } else {
      store = new Construct(transaction.objectStore(transaction.objectStoreNames[0]));
    }
    const result = handler(store);
    transaction.addEventListener('complete', (event) => {
      this.resolver(result);
      this.oncomplete(result)
    });
    transaction.addEventListener('error', (event) => {
      const error = (event.target as IDBRequest<Result>).error;
      this.rejector(error);
      this.onerror(error);
    });
    transaction.addEventListener('abort', (event) => {
      const error = (event.target as IDBRequest<Result>).error;
      this.rejector(error);
      this.onabort(error);
    });
  }

  complete(handler: (result: Result) => void) {
    this.oncomplete = handler;
    return this;
  }
  error(handler: (error: any) => void) {
    this.onerror = handler;
    return this;
  }
  abort(handler: (error: any) => void) {
    this.onabort = handler;
    return this;
  }
}
