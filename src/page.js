var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { attribute } from './component.js';
import { Router } from './router.js';
import { html } from './templating/index.js';
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
export function page(name) {
    return function (PageClass) {
        customElements.define(name, PageClass);
        customElements
            .whenDefined(name)
            .then(() => console.log('[PAGE] ' + name + ' defined'));
        return PageClass;
    };
}
let PageRuntime = /** @class */ (() => {
    var PageRuntime_1;
    let PageRuntime = PageRuntime_1 = class PageRuntime extends HTMLElement {
        constructor() {
            super(...arguments);
            this.stack = [];
            this.loader = (name) => Promise.resolve(Page);
        }
        set target(value) {
            this.setAttribute('target', value);
        }
        get target() {
            return this.getAttribute('target');
        }
        start(path) {
            if (!this.target) {
                this.target = 'main';
            }
            if (PageRuntime_1.instance) {
                throw new Error('The page-layout must have one instance');
            }
            console.log('[PAGE] starting', path);
            window.addEventListener('popstate', (event) => {
                this.navigate(location.pathname, event.state);
            });
            if (Router.isAbsolute(path)) {
                this.redirect(path, history.state);
            }
            else {
                this.redirect(path, history.state);
            }
        }
        navigate(path, data = {}) {
            path = Router.Path.resolve(path);
            console.time('[PAGE] navigate');
            const page = this.queue(path, data);
            history.pushState(data, page.title, page.path);
            console.timeEnd('[PAGE] navigate');
            console.log('[PAGE] navigate', path);
        }
        redirect(path, data = {}) {
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
        getPage(path) {
            return this.querySelector(`[path="${path}"]`);
        }
        getNotFoundPage(path) {
            if (path == '/404') {
                throw new Error('Page not found');
            }
            const page = this.getPage(Router.Path.resolve(path, '../404'));
            if (page) {
                return page;
            }
            else {
                return this.getNotFoundPage(Router.Path.resolve(path, '..'));
            }
        }
        getErrorPage(path) {
            if (path == '/500') {
                throw new Error('Page not found');
            }
            const page = this.getPage(Router.Path.resolve(path, '../500'));
            if (page) {
                return page;
            }
            else {
                return this.getErrorPage(Router.Path.resolve(path, '..'));
            }
        }
        queue(path, data) {
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
            let page = this.getPage(path);
            if (!page) {
                page = this.getNotFoundPage(path);
            }
            try {
                page.construct(data);
            }
            catch (error) {
                console.trace(error);
                page = this.getErrorPage(path);
                page.construct(data);
            }
            page.attach(main);
            this.stack.push(page);
            return page;
        }
    };
    __decorate([
        attribute
    ], PageRuntime.prototype, "debug", void 0);
    PageRuntime = PageRuntime_1 = __decorate([
        page('page-layout')
    ], PageRuntime);
    return PageRuntime;
})();
export { PageRuntime };
let Page = /** @class */ (() => {
    var Page_1;
    let Page = Page_1 = class Page extends HTMLElement {
        constructor() {
            super();
        }
        set path(value) {
            this.setAttribute('path', Router.Path.resolve(value));
        }
        get path() {
            return this.getAttribute('path');
        }
        set title(value) { }
        get title() {
            return '';
        }
        set description(value) { }
        get description() {
            return '';
        }
        construct(data) {
            this.path || (this.path = '');
            this.onCreate(data);
            if (!this.template) {
                throw new Error('The template must assign in onCreate');
            }
            this.template.render();
        }
        reconstruct(data) {
            this.onRestart(data);
        }
        destruct() {
            this.onDestroy();
        }
        attach(element) {
            if (element instanceof Page_1) {
                throw new TypeError('Cannot attach page');
            }
            element.append(this.template.element);
            this.onStart();
        }
        detach() {
            this.template.element.remove();
            this.onStop();
        }
        append(...pages) {
            for (const page of pages) {
                page.path = this.path + page.path;
                super.append(page);
            }
        }
        onCreate(data) { }
        onStart() { }
        onRestart(data) { }
        onStop() { }
        onDestroy() { }
    };
    Page = Page_1 = __decorate([
        page('page-view')
    ], Page);
    return Page;
})();
export { Page };
let NotFoundPage = /** @class */ (() => {
    let NotFoundPage = class NotFoundPage extends Page {
        constructor() {
            super();
            this.path = '/404';
        }
        onCreate(data) {
            this.template = html `<div><h1>404 Page Not Found</h1></div>`;
        }
    };
    NotFoundPage = __decorate([
        page('not-found-page')
    ], NotFoundPage);
    return NotFoundPage;
})();
export { NotFoundPage };
let ErrorPage = /** @class */ (() => {
    let ErrorPage = class ErrorPage extends Page {
        constructor() {
            super();
            this.path = '/500';
        }
        onCreate(data) {
            this.template = html `<div><h1>500 Error Page</h1></div>`;
        }
    };
    ErrorPage = __decorate([
        page('error-page')
    ], ErrorPage);
    return ErrorPage;
})();
export { ErrorPage };
