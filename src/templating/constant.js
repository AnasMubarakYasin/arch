import { Observable } from '../observable-data.js';
const TAG = 0;
const KEY = 1;
const VALUE = 2;
const ELEMENT = 3;
const CHILD = 4;
const ARG = '$';
const MAP_ID = new Map();
const CACHE_PRESET = new Map();
const CACHE_PRESETS = new Map();
const ENV = {
    debug: true,
    ObservablePrimitiveClass: Observable.Value,
    ObservableObjectClass: Observable.Map,
    ObservableArrayClass: Observable.List,
};
export { TAG, KEY, VALUE, ELEMENT, CHILD, ARG, MAP_ID, CACHE_PRESET, CACHE_PRESETS, ENV };
