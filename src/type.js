import { getConstructName } from './helper.js';
export function isBoolean(arg) {
    return typeof arg === 'boolean';
}
export function isNumber(arg) {
    return typeof arg === 'number';
}
export function isString(arg) {
    return typeof arg === 'string';
}
export function isSymbol(arg) {
    return typeof arg === 'symbol';
}
export function isUndefined(arg) {
    return typeof arg === 'undefined';
}
export function isPrimitive(arg) {
    return isBoolean(arg) ||
        isNumber(arg) ||
        isString(arg) ||
        isSymbol(arg) ||
        isUndefined(arg) ||
        isNull(arg) || false;
}
export function isNull(arg) {
    return arg === null;
}
export function isNan(arg) {
    return window.isNaN(arg);
}
export function isFinite(arg) {
    return window.isFinite(arg);
}
export function isObject(arg) {
    return typeof arg === 'object';
}
export function isRegExp(arg) {
    return getConstructName(arg) === 'RegExp';
}
export function isArray(arg) {
    return getConstructName(arg) === 'Array';
}
export function isConstructable(arg) {
    try {
        new arg();
    }
    catch (err) {
        return false;
    }
    return true;
}
export function isClass(arg) {
    return arg.toString().startsWith('class');
}
export function isSameType(...args) {
    const t1 = getConstructName(args[0]);
    return args.every((value) => {
        return getConstructName(value) === t1;
    });
}
