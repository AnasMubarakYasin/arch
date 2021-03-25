import {getConstructName} from './helper.js';

export function isBoolean(arg: any) {
  return typeof arg === 'boolean';
}

export function isNumber(arg: any) {
  return typeof arg === 'number';
}

export function isString(arg: any) {
  return typeof arg === 'string';
}

export function isSymbol(arg: any) {
  return typeof arg === 'symbol';
}

export function isUndefined(arg: any) {
  return typeof arg === 'undefined';
}

export function isPrimitive(arg: any) {
  return isBoolean(arg) ||
  isNumber(arg) ||
  isString(arg) ||
  isSymbol(arg) ||
  isUndefined(arg) ||
  isNull(arg) || false;
}

export function isNull(arg: any) {
  return arg === null;
}

export function isNan(arg: any) {
  return window.isNaN(arg);
}

export function isFinite(arg: any) {
  return window.isFinite(arg);
}

export function isObject(arg: any) {
  return typeof arg === 'object';
}

export function isRegExp(arg: any) {
  return getConstructName(arg) === 'RegExp';
}

export function isArray(arg: any) {
  return getConstructName(arg) === 'Array';
}

export function isConstructable(arg: any) {
  try {
    new arg();
  } catch (err) {
    return false;
  }
  return true;
}

export function isClass(arg: any) {
  return arg!.toString()!.startsWith('class');
}

export function isSameType(...args: any[]) {
  const t1 = getConstructName(args[0]);
  return args.every((value) => {
    return getConstructName(value) === t1;
  });
}