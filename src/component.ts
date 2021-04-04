import { TemplateRuntime } from './templating/index.js';

export function component(name: string) {
  return function <C extends typeof Component>(Component: C) {
    customElements.define(name, Component);
    return Component;
  };
}

export function attribute(target: Element | string, key?: string): void {
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
  } else {
    return attribute;
  }
}

function action<D extends object>(name: string, data: D) {}

export class Component extends HTMLElement {
  public static debug = true;
  public static visibility: IntersectionObserver = new IntersectionObserver(
    (entries, observer) => {
      for (const component of entries) {
        (component.target as Component).visibilityChangedCallback(
          component.isIntersecting
        );
      }
    },
    {
      root: null,
      rootMargin: '0px',
      threshold: 0.33,
    }
  );
  public static finalizationRegistry = new FinalizationRegistry((name: any) => {
    Component.debug && console.warn('[COMPONENT]', name, 'was clean up');
  });

  public static observedAttributeList: string[] = ['model', 'action'];

  public static get observedAttributes() {
    return this.observedAttributeList;
  }

  public static localname = '';

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

  public get shadowRoot() {
    return this.shadowRootElement;
  }

  protected template!: TemplateRuntime;

  private shadowRootElement: ShadowRoot;

  protected connectedCallback() {
    this.onAttach();
    return this;
  }
  protected disconnectedCallback() {
    this.onDetach();
    return this;
  }
  protected adoptedCallback() {
    this.onMove();
    return this;
  }
  protected attributeChangedCallback(
    name: string,
    oldValue: string,
    newValue: string
  ) {
    return this;
  }

  protected visibilityChangedCallback(visible: boolean) {
    return this;
  }
  protected mutationChangeCallback() {
    return this;
  }
  protected modelChangedCallback(model: any) {
    return this;
  }

  public setAttribute(qualifiedName: string, value: any) {
    if (qualifiedName[0] == '.') {
      if (qualifiedName.endsWith('model')) {
        this.modelChangedCallback(value);
      } else {
        throw new TypeError('The attribute not support: ' + qualifiedName);
      }
    } else {
      super.setAttribute(qualifiedName, value);
    }
  }

  protected construct() {
    this.onCreate();

    if (!this.template) {
      throw new Error('The template must set in onCreate');
    }

    this.shadowRoot.append(this.template.render().element);
  }

  protected destruct() {
    this.onDestroy();
  }

  protected onCreate() {}
  protected onAttach() {}
  protected onMove() {}
  protected onDetach() {}
  protected onDestroy() {}
}
