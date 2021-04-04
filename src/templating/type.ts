import { ObservableValue, ObservableList, ObservableMap } from "../observable-data.js";
import { TemplateStream } from "./index.js";
import { ScopeForOf, WatchScope } from "./runtime.js";

export type TemplateInit = {
    string: string;
    pointers: TemplatePointer[];
    pointerIndex: number;
    argIndex: number[];
    stringIndex: number;
    stringLength: number;
}
export type TemplatePointer = {
    pointer: any;
}
export type EventRegistered = {
    element: Element;
    eventInit: [type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions | undefined];
}
export type ObserveableRegistered = {
    observer: ObservableValue<any> | ObservableList<any[]> | ObservableMap<any>
    handler: ((p: any) => any);
}
export type TemplateFunctionComponent = (attribute: any, children: any[]) => Element;
export type EventHandler = (event: any) => void;
export type Primitive = string | number | boolean;

export type AttributeTree = {
    [key: string]: (Primitive | TemplatePointer)[];
}
export type TemplateTree = {
    tag: string | TemplatePointer;
    attributes: AttributeTree;
    type: 'element' | 'text';
    text: string | TemplatePointer;
    children: TemplateTree[];
}
export type TemplatePreset = {
    tree: TemplateTree;
    pointers: TemplatePointer[];
}
export type TemplatePeresetCache = {
    tree: TemplateTree;
    pointer: TemplatePointer[];
}
export type TemplatePresetsCache = {
    trees: TemplateTree[];
    pointers: TemplatePointer[];
}
export type InferIterable<A> = A extends Iterable<infer T> ? T : never;
export type TemplateEntry = Primitive | TemplateFunctionComponent | ObservableValue<any> | EventHandler | TemplateStream | ScopeForOf | WatchScope;
