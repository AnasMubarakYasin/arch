import * as type from './type.js';
class Configuration {
    constructor() {
        this.skipHash = true;
        this.skipSearch = true;
        this.setHistory = false;
    }
}
class Path {
    static resolve(...paths) {
        const path = paths.join('/');
        let buffer = '';
        for (let index = 0; index < path.length; index++) {
            const char = path[index];
            if (char == '/') {
                if (path[index + 1] == '/') {
                    continue;
                }
            }
            else if (char == '.') {
                if (path[index - 1] == '/') {
                    if (path[index + 1] == '/') {
                        index++;
                    }
                    if (path[index + 1] == '.') {
                        buffer = this.dirname(buffer);
                    }
                }
                continue;
            }
            buffer += char;
        }
        return buffer[buffer.length - 1] == '/' ? buffer.slice(0, -1) : buffer;
    }
    static dirname(path) {
        path = path[path.length - 1] == '/' ? path.slice(0, -1) : path;
        let buffer = '';
        let safe = 0;
        for (let index = 0; index < path.length; index++) {
            const char = path[index];
            if (char == '/') {
                safe = index;
            }
            else if (char == '?' || char == '#') {
                if (safe + 1 == index) {
                    safe = path.lastIndexOf('/', safe - 1);
                }
                break;
            }
            buffer += char;
        }
        return buffer.slice(0, safe);
    }
}
export class Router {
    constructor(path) {
        this.Class = Router;
        this.path = path;
    }
    static register(path, source) {
        if (typeof path === 'string') {
            path = this.resolver(path);
            if (this.stringMap.has(path)) {
                throw new Error('the route path only set once');
            }
            else {
                this.stringMap.set(path, source);
            }
        }
        else if (typeof path === 'function') {
            this.funcMap.set(path, source);
        }
        else if (type.isRegExp(path)) {
            this.regMap.set(path, source);
        }
        else {
            throw new TypeError('path of router must string | RegExp | Function');
        }
    }
    static route(path = '', data) {
        console.groupCollapsed('router');
        console.time('routing');
        console.log('request to route', this.base, path);
        const url = new URL(this.resolver(path));
        console.log('response to route', url.toString());
        console.groupEnd();
        let source = this.stringMap.get(url.toString());
        checker: while (source === undefined) {
            for (const [matcher, pageRegistered] of this.funcMap.entries()) {
                if (matcher(url)) {
                    source = pageRegistered;
                    break checker;
                }
            }
            for (const [matcher, pageRegistered] of this.regMap.entries()) {
                if (matcher.test(url.toString())) {
                    source = pageRegistered;
                    break checker;
                }
            }
            break;
        }
        if (source) {
            source.listener(data);
        }
        else {
            throw new Error('the source not exist');
        }
        console.timeEnd('routing');
    }
    static resolver(path, base = this.base) {
        const pattern = /\.*/;
        const separator = this.separator;
        let chunk = '';
        let absolute = '';
        let fragment = '';
        let query = '';
        if (base.endsWith(this.separator)) {
            base = this.basename(base);
        }
        absolute = this.getAbsolute(base);
        base = base.slice(absolute.length);
        fragment += this.getFragment(path);
        path = path.slice(0, path.length - fragment.length);
        query += this.getQuery(path);
        path = path.slice(0, path.length - query.length);
        path = path.replace(/\./g, 'dottedded');
        path = this.normalize(path).slice(1);
        path = path.replaceAll('dottedded', '.');
        chunk = path.endsWith(separator) ? path : path + separator;
        let dot = pattern.exec(chunk);
        while (chunk) {
            const subchunk = chunk.slice(0);
            if (subchunk.startsWith('.')) {
                const dotCount = dot[0].length;
                const atomicchunk = subchunk.slice(dotCount);
                if (atomicchunk.startsWith(separator) === false) {
                    chunk = atomicchunk;
                }
                else {
                    if (dotCount === 1) {
                        chunk = subchunk.slice(1);
                    }
                    else {
                        chunk = subchunk.slice(dotCount);
                        base = base ? this.basename(base) : absolute;
                    }
                }
            }
            else if (subchunk.startsWith(separator)) {
                chunk = subchunk.slice(separator.length);
            }
            else {
                const nextseparator = chunk.indexOf(separator);
                const subchunk = chunk.slice(0, nextseparator > 0 ? nextseparator : undefined);
                base += subchunk.startsWith(separator)
                    ? subchunk
                    : separator + subchunk;
                chunk = chunk.slice(subchunk.length);
            }
            dot = pattern.exec(chunk);
        }
        // base = base.startsWith(separator) ? base : separator + base;
        return absolute + base + fragment + query;
    }
    static dirname(path) {
        return this.basename(path);
    }
    static basename(path, ext = '') {
        const absolute = this.getAbsolute(path);
        path = path.slice(absolute.length);
        const fragment = this.getFragment(path);
        path = path.slice(0, path.length - fragment.length);
        const query = this.getQuery(path);
        path = path.slice(0, path.length - query.length);
        const extname = this.extname(path);
        path = path.slice(0, path.length - extname.length);
        path = this.normalize(path).slice(1);
        const separator = this.separator;
        const prefix = absolute.includes(':') ? absolute : separator;
        if (ext === extname || ext.length === 0) {
            return prefix + cut(path) + fragment + query;
        }
        else {
            return prefix + cut(path) + extname + fragment + query;
        }
        function cut(string) {
            const lastSeparator = string.lastIndexOf(separator);
            if (string.endsWith(separator)) {
                return string.slice(0, string.length - separator.length);
            }
            else if (lastSeparator >= 0) {
                return string.slice(0, lastSeparator);
            }
            else {
                return '';
            }
        }
    }
    static extname(path) {
        const matcher = /.*(\.\w+)$|(\.)$/.exec(path);
        if (matcher) {
            if (matcher[1]) {
                return matcher[1];
            }
            else {
                return matcher[2];
            }
        }
        else {
            return '';
        }
    }
    static isAbsolute(path) {
        return /(^[a-z]*:\/\/\w*[:]\d*|^[a-z]*:\/\/\w*)|(^\/\w*)/.test(path);
    }
    static getAbsolute(path) {
        const matcher = /(^[a-z]*:\/\/\w*)|(^\/)\w*/.exec(path);
        if (matcher) {
            if (matcher[1]) {
                return matcher[1];
            }
            else {
                return matcher[2];
            }
        }
        else {
            return '';
        }
    }
    static getFragment(path) {
        const hash = path.indexOf('#');
        if (hash > 0) {
            return path.slice(hash);
        }
        else {
            return '';
        }
    }
    static hasFragment(path) {
        return path.includes('#');
    }
    static getQuery(path) {
        const query = path.indexOf('?');
        if (query > 0) {
            return path.slice(query);
        }
        else {
            return '';
        }
    }
    static hasQuery(path) {
        return path.includes('?');
    }
    static normalize(path) {
        const separator = this.separator;
        const suffix = path.endsWith(this.separator) ? this.separator : '';
        let accumulation = '';
        let nextPath = path.replace(/\./g, 'dottedded');
        let subpath = cut(nextPath);
        while (subpath) {
            const range = subpath[0].length + subpath.index;
            accumulation += separator + nextPath.slice(subpath.index, range);
            nextPath = nextPath.slice(range);
            if (accumulation) {
                subpath = cut(nextPath);
            }
            else {
                break;
            }
        }
        return accumulation.replaceAll('dottedded', '.') + suffix;
        function cut(string) {
            return /(\w+)/.exec(string);
        }
    }
    static join(...paths) {
        let result = '';
        for (const path of paths) {
            result += this.resolver(path, '');
            console.log(result);
        }
        return this.resolver(result, '');
    }
    listen() {
        Router.register(this.path, this);
    }
    listener(data) { }
}
Router.Path = Path;
Router.base = location.origin;
Router.separator = '/';
Router.configuration = new Configuration();
Router.stringMap = new Map();
Router.regMap = new Map();
Router.funcMap = new Map();
export class Package {
    constructor(path, data) {
        this.path = path;
        this.raw = data;
    }
    set(value) {
        this.raw = value;
    }
    get(key) {
        if (key) {
            return this.raw[key];
        }
        else {
            return this.raw;
        }
    }
    toJSON(key) {
        if (key) {
            return this.raw[key];
        }
        else {
            return this.raw;
        }
    }
}
