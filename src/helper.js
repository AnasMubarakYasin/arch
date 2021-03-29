import { isObject, isArray } from './type.js';
export function getConstructName(arg) {
    if (typeof arg?.name === 'string' && arg?.name !== '') {
        return arg.name;
    }
    else {
        return arg.constructor.name;
    }
}
export function addProperty(source, key, value) {
    return Object.defineProperty(source, key, {
        configurable: true,
        enumerable: true,
        value: value,
        writable: true,
    });
}
export function addProperties(source, target) {
    for (const [key, value] of Object.entries(target)) {
        addProperty(source, key, value);
    }
    return source;
}
const ref = new WeakSet();
export function duplicate(object) {
    if (isObject(object) === false) {
        throw new TypeError('wrong type');
    }
    else {
        if (ref.has(object)) {
            return null;
        }
        else {
            ref.add(object);
        }
    }
    if (isArray(object)) {
        let index = 0;
        const result = [];
        for (const iterator of object) {
            if (isObject(iterator)) {
                const tmp = duplicate(iterator);
                result[index] = tmp;
            }
            else {
                result[index] = iterator;
            }
            index++;
        }
        return result;
    }
    else {
        const result = {};
        for (const [key, value] of Object.entries(object)) {
            if (isObject(value)) {
                const tmp = duplicate(value);
                addProperty(result, key, tmp);
            }
            else {
                addProperty(result, key, value);
            }
        }
        return result;
    }
}
export function mix(source, target) {
    for (const [key, value] of Object.entries(target)) {
        if (key in source) {
            if (typeof source[key] === typeof value) {
                source[key] = value;
            }
            else {
                console.warn('attribute', key, 'different type in', source);
            }
        }
        else {
            console.warn('attribute', key, 'not exist in', source);
        }
    }
}
export function genRandomNumber(length = 0) {
    return +Math.random().toFixed().slice(2, length + 2);
}
export function genRandomString(length = 0) {
    const allCapsAlpha = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'];
    const allLowerAlpha = [...'abcdefghijklmnopqrstuvwxyz'];
    const base = [...allLowerAlpha, ...allCapsAlpha];
    return [...Array(length)]
        .map((value) => {
        const digit = (Math.random() * base.length);
        return base[digit % 2 ? Math.ceil(digit) : Math.floor(digit)];
    })
        .join('');
}
export function hash(str = '', key = 0) {
    let hash = key;
    let index = str.length;
    while (index) {
        hash = (hash * 37) ^ str.charCodeAt(--index);
    }
    ;
    return (hash >>> 0).toString(36);
}
export function domParser(string) {
    const dom = new DOMParser();
    return dom.parseFromString(string, 'text/html').body.firstElementChild;
}
export function trim(string) {
    return string.replaceAll(/\s|\n/g, '');
}
export function wait(ms, callback) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(callback ? callback() : undefined);
        }, ms);
    });
}
