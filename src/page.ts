import { attribute } from './component.js';
import { Router } from './router.js';
import { html } from './templating/index.js';
import { TemplateRuntime } from './templating/runtime.js';

type HandlerNavigationEvent = (path: Path, data: Data) => {};
type LoaderPage = (name: string) => Promise<typeof Page>;

// export class PageRuntime {
//   public static isStarting = false;
//   public static setHistory = true;
//   public static replaceNavigate = true;
//   public static debug = true;
//   public static pageContainer = document.querySelector('main') as Element;

//   public static readonly pageClassMap: Map<
//     Path,
//     typeof Page | string
//   > = new Map();
//   public static readonly stack: Array<Page> = [];

//   private static readonly handlerList: Array<HandlerNavigationEvent> = [];

//   public static readonly finalizationRegistryPage = new FinalizationRegistry(
//     (name) => {
//       console.warn('[GC] the page', name, 'was clean up');
//     }
//   );
//   public static readonly finalizationRegistryContent = new FinalizationRegistry(
//     (name) => {
//       console.warn('[GC] the content', name, 'was clean up');
//     }
//   );
//   public static loader = (name: string) => Promise.resolve(Page);
//   public static register(PageClass: typeof Page | string, path: Path) {
//     if (typeof path === 'string') {
//       path = Router.path.resolve(path);
//       this.pageClassMap.set(path, PageClass);
//     } else {
//       throw new TypeError('unknown type');
//     }
//     return this;
//   }
//   public static async navigate(path: Path, data: Data = {}) {
//     const page = await this.appendPage(path, data);
//     history.pushState(data, page.pageTitle, page.fullpath);
//     this.dispatch(path, data);
//     return this;
//   }
//   public static async redirect(path: Path, data: Data = {}) {
//     const page = await this.appendPage(path, data);
//     this.dispatch(path, data);
//     history.replaceState(data, page.pageTitle, page.path);
//     return this;
//   }
//   public static onNavigation(handler: HandlerNavigationEvent) {
//     return this.handlerList.push(handler) - 1;
//   }
//   public static async start(path: Path, data: Data) {
//     if (this.isStarting === false) {
//       window.addEventListener('popstate', (event) => {
//         this.navigate(location.pathname, event.state);
//       });
//       if (Router.isAbsolute(path)) {
//         this.redirect(path, data);
//       } else {
//         this.redirect(path, data);
//       }
//     } else {
//       throw new Error('start only once invoke');
//     }
//     return this;
//   }
//   public static dispatch(path: Path, data: Data) {
//     for (const handler of this.handlerList) {
//       handler(path, data);
//     }
//   }
//   public static back() {
//     history.back();
//   }
//   public static forward() {
//     history.forward();
//   }
//   public static setLoaderPage(loader: LoaderPage) {
//     this.loader = loader;
//     return this;
//   }
//   public static parse(template: TemplateRuntime) {}
//   private static async appendPage(path: Path, data: Data) {
//     path = Router.path.resolve(path);
//     let page: Page | undefined;
//     for (let index = 0; index < this.stack.length; index++) {
//       const item = this.stack[index];
//       if (item.path == path) {
//         for (const removed of this.stack.splice(
//           item.index,
//           index - item.index
//         )) {
//           Page.destruct(removed);
//         }
//         page = this.stack.pop();
//         break;
//       }
//     }
//     if (!page) {
//       let PageClass = await this.getPage(path);
//       if (!PageClass) {
//         PageClass = await this.getNotFoundPage(path);
//       }
//       page = new PageClass(data);
//       // Page.construct(page);
//     }
//     try {
//       this.pageContainer.append(page);
//     } catch (error) {
//       const Page = await this.getErrorPage(path);
//       page = new Page(data);
//       // Page.construct(page);
//       this.pageContainer.append(page);
//     }
//     page.index = this.stack.length;
//     this.stack.push(page);
//     PageRuntime.finalizationRegistryPage.register(
//       page,
//       (document.title = page.pageTitle)
//     );
//     return page;
//   }
//   private static async getNotFoundPage(path: Path) {
//     if (path == '/404/') {
//       throw new Error('Page not found');
//     }
//     return this.getPage(Router.path.resolve(path + '../404')) as Promise<
//       typeof Page
//     >;
//   }
//   private static async getErrorPage(path: Path) {
//     if (path == '/500/') {
//       throw new Error('Page error');
//     }
//     return this.getPage(Router.path.resolve(path + '../500')) as Promise<
//       typeof Page
//     >;
//   }
//   private static async getPage(path: Path) {
//     let PageClass: typeof Page | undefined;
//     let result;
//     if (typeof path === 'string') {
//       result = this.pageClassMap.get(path);
//     }
//     if (typeof result === 'string') {
//       PageClass = await this.loader(result).then(
//         (module: any) => module[Object.keys(module)[0]]
//       );
//     } else {
//       PageClass = result;
//     }
//     return PageClass;
//   }
// }

export function page(name: string) {
  return function <P extends typeof HTMLElement>(PageClass: P) {
    customElements.define(name, PageClass);
    customElements
      .whenDefined(name)
      .then(() => console.log('[PAGE] ' + name + ' defined'));
    return PageClass;
  };
}

type Path = string;
type Data = { [key: string]: any };

@page('page-layout')
export class PageRuntime extends HTMLElement {
  protected static instance: PageRuntime | undefined;
  protected stack: Page[] = [];
  protected loader = (name: string) => Promise.resolve(Page);

  @attribute
  debug!: boolean;

  set target(value: string) {
    this.setAttribute('target', value);
  }
  get target() {
    return this.getAttribute('target') as string;
  }
  start(path: string) {
    if (!this.target) {
      this.target = 'main';
    }
    if (PageRuntime.instance) {
      throw new Error('The page-layout must have one instance');
    }
    console.log('[PAGE] starting', path);
    window.addEventListener('popstate', (event) => {
      this.navigate(location.pathname, event.state);
    });
    if (Router.isAbsolute(path)) {
      this.redirect(path, history.state);
    } else {
      this.redirect(path, history.state);
    }
  }
  navigate(path: string, data: Data = {}) {
    path = Router.Path.resolve(path);
    console.time('[PAGE] navigate');
    const page = this.queue(path, data);
    history.pushState(data, page.title, page.path);
    console.timeEnd('[PAGE] navigate');
    console.log('[PAGE] navigate', path);
  }
  redirect(path: string, data: Data = {}) {
    path = Router.Path.resolve(path);
    console.time('[PAGE] redirect');
    const page = this.queue(path, data);
    history.replaceState(data, page.title, page.path);
    console.timeEnd('[PAGE] redirect');
    console.log('[PAGE] redirect', path);
  }
  forward() {
    history.forward();
  }
  backward() {
    history.back();
  }
  getPage(path: string) {
    return this.querySelector(`[path="${path}"]`) as Page | null;
  }
  getNotFoundPage(path: string): Page {
    if (path == '/404') {
      throw new Error('Page not found');
    }
    const page = this.getPage(Router.Path.resolve(path, '../404'));
    if (page) {
      return page;
    } else {
      return this.getNotFoundPage(Router.Path.resolve(path, '..'));
    }
  }
  getErrorPage(path: string): Page {
    if (path == '/500') {
      throw new Error('Page not found');
    }
    const page = this.getPage(Router.Path.resolve(path, '../500'));
    if (page) {
      return page;
    } else {
      return this.getErrorPage(Router.Path.resolve(path, '..'));
    }
  }
  queue(path: string, data: Data) {
    const main = document.querySelector(this.target);
    if (!main) {
      throw new Error('Attaching page must have main element');
    }
    let length = this.stack.length;
    for (let index = 0; index < length; index++) {
      const item = this.stack[index];
      if (item.path == path) {
        index++;
        for (const removed of this.stack.splice(index, length - index)) {
          removed.detach();
          removed.destruct();
        }
        item.reconstruct(data);
        item.attach(main);
        return item;
      }
    }
    let page: Page | null = this.getPage(path);
    if (!page) {
      page = this.getNotFoundPage(path);
    }
    try {
      page.construct(data);
    } catch (error) {
      console.trace(error);

      page = this.getErrorPage(path);
      page.construct(data);
    }
    page.attach(main);
    this.stack.push(page);
    return page;
  }
}

@page('page-view')
export class Page extends HTMLElement {
  public template!: TemplateRuntime;

  set path(value: string) {
    this.setAttribute('path', Router.Path.resolve(value));
  }
  get path() {
    return this.getAttribute('path') as string;
  }
  set title(value: string) {}
  get title() {
    return '';
  }
  set description(value: string) {}
  get description() {
    return '';
  }

  public constructor() {
    super();
  }

  construct(data: Data) {
    this.path || (this.path = '');
    this.onCreate(data);
    if (!this.template) {
      throw new Error('The template must assign in onCreate');
    }
    this.template.render();
  }
  reconstruct(data: Data) {
    this.onRestart(data);
  }
  destruct() {
    this.onDestroy();
  }
  attach(element: Element) {
    if (element instanceof Page) {
      throw new TypeError('Cannot attach page');
    }
    element.append(this.template.element);
    this.onStart();
  }
  detach() {
    this.template.element.remove();
    this.onStop();
  }

  append(...pages: Page[]) {
    for (const page of pages) {
      page.path = this.path + page.path;
      super.append(page);
    }
  }

  protected onCreate(data: Data) {}
  protected onStart() {}
  protected onRestart(data: Data) {}
  protected onStop() {}
  protected onDestroy() {}
}

@page('not-found-page')
export class NotFoundPage extends Page {
  constructor() {
    super();

    this.path = '/404';
  }
  onCreate(data: Data) {
    this.template = html`<div><h1>404 Page Not Found</h1></div>`;
  }
}
@page('error-page')
export class ErrorPage extends Page {
  constructor() {
    super();

    this.path = '/500';
  }
  onCreate(data: Data) {
    this.template = html`<div><h1>500 Error Page</h1></div>`;
  }
}
