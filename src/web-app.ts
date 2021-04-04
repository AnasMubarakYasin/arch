import { ErrorPage, NotFoundPage, Page, PageRuntime } from './page.js';
import { Router } from './router.js';
import { TemplateRuntime } from './templating/runtime.js';
import { TemplateTree } from './templating/type.js';

export class WebApp {
  resource: any;
  pageView!: TemplateRuntime;
  state: any;
  name: string = 'My Web App';
  description!: string;
  constructor() {

  }
  createPage() {
    const runtimePage = this.renderPage(this.pageView.tree) as PageRuntime;
    runtimePage.append(new NotFoundPage());
    runtimePage.append(new ErrorPage());
    document.body.prepend(runtimePage);
    requestIdleCallback(() => {
      runtimePage.start(location.pathname);
    })
  }
  private renderPage(tree: TemplateTree) {
    let element: Element | undefined;
    if (typeof tree.tag == 'string') {      
      element = document.createElement(tree.tag);
    } else {
      throw new TypeError('Cannot parse except string');
    }
    for (const [key, values] of Object.entries(tree.attributes)) {
      let value = '';
      for (const val of values) {
        if (typeof val == 'string') {
          value += val;
        } else {
          throw new TypeError('Cannot parse except string');
        }
      }
      element.setAttribute(key, value);
    }
    for (const child of tree.children) {
      element.append(this.renderPage(child));
    }
    return element;
  }
}
