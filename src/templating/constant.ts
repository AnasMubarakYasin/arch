import { ObserveableAttrNode, ObserveableChildNodes, ObserveableTextNode, ObserveableNode } from '../observable-node.js';
import { Observable, ObservableList, ObservableMap, ObservableValue } from '../observable-data.js';
import { TemplatePeresetCache, TemplatePresetsCache } from './type.js';

const TAG = 0;
const KEY = 1;
const VALUE = 2;
const ELEMENT = 3;
const CHILD = 4;
const ARG = '$';
const MAP_ID = new Map<Symbol, Element>();
const CACHE_PRESET = new Map<string, TemplatePeresetCache>();
const CACHE_PRESETS = new Map<string, TemplatePresetsCache>();
const ENV = {
    debug: true,
    ObservablePrimitiveClass: Observable.Value,
    ObservableObjectClass: Observable.Map,
    ObservableArrayClass: Observable.List,
}

export {
    TAG,
    KEY,
    VALUE,
    ELEMENT,
    CHILD,
    ARG,
    MAP_ID,
    CACHE_PRESET,
    CACHE_PRESETS,
    ENV
}