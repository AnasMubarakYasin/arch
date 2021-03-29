import { wait } from "./helper.js";

export const env = {
    debug: false,
}

export function get(url: string, headers?: string[][]) {
    const req = new RQHttpRequest(url);
    req.method = 'GET';
    req.headers = new Headers(headers);
    return req;
}
type Method = 'GET' | 'POST' | 'OPTION' | 'DELETE' | 'PUT';
type CacheStrategy = 'net-first' | 'cache-first' | 'revalidate' | 'net-only' | 'cache-only'

const ERR_NET_OFFLINE = 'The network offline';

export class RQHttpRequest {
    url: string = '';
    method: Method = 'GET';
    headers: Headers = new Headers();
    abortController = new AbortController();
    options: RequestInit = {
        cache: 'no-store',
        credentials: 'omit',
        integrity: '',
        mode: 'cors',
        redirect: 'error',
    };
    timeout = 2000;
    cache = true;
    cacheName = 'ReqHttp';
    cacheStrategy: CacheStrategy = 'cache-first';
    cacheOptions: CacheQueryOptions = {
        ignoreMethod: false,
        ignoreSearch: false,
        ignoreVary: true,
    }
    retryTime = 5000;
    request: Request | undefined;
    notFound: Response | undefined;

    protected retrying = false;
    protected retryId = 0;

    constructor(info: string | Request) {
        if (typeof info == 'string') {
            this.url = info;
        } else {
            this.request = new Request(info, { signal: this.abortController.signal });
        }
    }
    retry(onsuccess: (response: Response) => void, onfailed: (error: any) => void) {
        if (this.retrying) {
            return;
        }
        this.retrying = true;
        this.retryId = setInterval(() => {
            this.send()
                .then((response) => {
                    this.retrying = false;
                    clearInterval(this.retryId);
                    onsuccess(response);
                })
                .catch((error) => {
                    if (error != ERR_NET_OFFLINE) {
                        this.retrying = false;
                        clearInterval(this.retryId);
                    }
                    onfailed(error);
                });
        }, this.retryTime);
        return this;
    }
    abortRetry() {
        if (this.retrying) {
            clearInterval(this.retryId);
            this.retrying = false;
        }
        return this;
    }
    abortSend() {
        this.abortController.abort();
    }
    async send() {
        env.debug && console.time('send http');
        let id = 0;
        if (!this.request) {
            this.options.method = this.method;
            this.options.headers = this.headers;
            this.options.signal = this.abortController.signal;
            this.request = new Request(this.url, this.options);
        }
        if (this.timeout) {
            id = setTimeout(() => {
                this.abortController.abort();
            }, this.timeout);
        }
        try {
            return await this.sending(this.request.clone());
        } catch (error) {
            console.dir(error);
            if (error.message == ERR_NET_OFFLINE) {
                throw new TypeError(ERR_NET_OFFLINE);
            } else {
                throw error.constructor(error.message);
            }
        } finally {
            clearTimeout(id);
            env.debug && console.timeEnd('send http');
        }
    }
    reset() {
        this.abortController = new AbortController();
        this.request = undefined;
        return this;
    }
    protected async sending(request: Request) {
        if (this.cache) {
            const cache = await caches.open(this.cacheName);
            if (this.cacheStrategy == 'revalidate') {
                return this.cacheRevalidate(request, cache);
            } else if (this.cacheStrategy == 'cache-first') {
                return this.cacheFirst(request, cache);
            } else if (this.cacheStrategy == 'net-first') {
                return this.netFirst(request, cache);
            } else if (this.cacheStrategy == 'cache-only') {
                return this.cacheOnly(cache, request);
            }
        }
        if (navigator.onLine) {
            return fetch(request);
        } else {
            throw new TypeError(ERR_NET_OFFLINE);
        }
    }
    protected async cacheRevalidate(request: Request, cache: Cache) {
        let response = await cache.match(request, this.cacheOptions);
        if (response) {
            this.waitCachePut(cache, request);
        } else {
            response = await fetch(request);
            this.waitCachePut(cache, request, response.clone());
        }
        return response;
    }
    protected async cacheFirst(request: Request, cache: Cache) {
        let response = await cache.match(request, this.cacheOptions);
        if (!response) {
            response = await fetch(request);
            this.waitCachePut(cache, request, response.clone());
        }
        return response;
    }
    protected async netFirst(request: Request, cache: Cache) {
        return fetch(request)
            .then((response) => {
                if (response.ok) {
                    this.waitCachePut(cache, request, response.clone());
                    return response;
                } else {
                    return this.cacheOnly(cache, request);
                }
            })
            .catch(async (error) => {
                return this.cacheOnly(cache, request);
            });
    }
    protected cacheOnly(cache: Cache, request: Request) {
        return cache.match(request, this.cacheOptions)
            .then((response) => {
                if (response) {
                    return response;
                } else {
                    return this.createNotFound();
                }
            });
    }
    protected waitCachePut(cache: Cache, request: Request, response?: Response) {
        wait(12, async () => {
            if (!response) {
                response = await fetch(request);
            }
            if (response.ok) {
                cache.put(request, response);
            }
        })
    }
    protected createNotFound() {
        if (this.notFound) {
            return this.notFound.clone();
        } else {
            this.notFound = new Response('', {
                status: 404,
                statusText: 'Not Found'
            });
            return this.notFound.clone();
        }
    }
}


