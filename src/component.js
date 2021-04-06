export function component(name) {
    return function (Component) {
        customElements.define(name, Component);
        return Component;
    };
}
export function attribute(target, key) {
    if (typeof target == 'object' && key) {
        Reflect.deleteProperty(target, key);
        Reflect.defineProperty(target, key, {
            set(val) {
                this.setAttribute(key, val + '');
            },
            get() {
                return this.getAttribute(key);
            },
        });
    }
    else {
        return attribute;
    }
}
function action(name, data) { }
export class Component extends HTMLElement {
    constructor() {
        super();
        console.log(this);
        Component.finalizationRegistry.register(this, this.localName);
        this.shadowRootElement = this.attachShadow({
            mode: 'open',
            delegatesFocus: true,
        });
        this.construct();
    }
    static get observedAttributes() {
        return this.observedAttributeList;
    }
    get shadowRoot() {
        return this.shadowRootElement;
    }
    connectedCallback() {
        this.onAttach();
        return this;
    }
    disconnectedCallback() {
        this.onDetach();
        return this;
    }
    adoptedCallback() {
        this.onMove();
        return this;
    }
    attributeChangedCallback(name, oldValue, newValue) {
        return this;
    }
    visibilityChangedCallback(visible) {
        return this;
    }
    mutationChangeCallback() {
        return this;
    }
    modelChangedCallback(model) {
        return this;
    }
    setAttribute(qualifiedName, value) {
        if (qualifiedName[0] == '.') {
            if (qualifiedName.endsWith('model')) {
                this.modelChangedCallback(value);
            }
            else {
                throw new TypeError('The attribute not support: ' + qualifiedName);
            }
        }
        else {
            super.setAttribute(qualifiedName, value);
        }
    }
    construct() {
        this.onCreate();
        if (!this.template) {
            throw new Error('The template must set in onCreate');
        }
        this.shadowRoot.append(this.template.render().element);
    }
    destruct() {
        this.onDestroy();
    }
    onCreate() { }
    onAttach() { }
    onMove() { }
    onDetach() { }
    onDestroy() { }
}
Component.debug = true;
Component.visibility = new IntersectionObserver((entries, observer) => {
    for (const component of entries) {
        component.target.visibilityChangedCallback(component.isIntersecting);
    }
}, {
    root: null,
    rootMargin: '0px',
    threshold: 0.33,
});
Component.finalizationRegistry = new FinalizationRegistry((name) => {
    Component.debug && console.warn('[COMPONENT]', name, 'was clean up');
});
Component.observedAttributeList = ['model', 'action'];
Component.localname = '';
