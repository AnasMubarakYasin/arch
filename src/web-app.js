import { ErrorPage, NotFoundPage } from './page.js';
export class WebApp {
    constructor() {
        this.name = 'My Web App';
    }
    createPage() {
        const runtimePage = this.renderPage(this.pageView.tree);
        runtimePage.append(new NotFoundPage());
        runtimePage.append(new ErrorPage());
        document.body.prepend(runtimePage);
        requestIdleCallback(() => {
            runtimePage.start(location.pathname);
        });
    }
    renderPage(tree) {
        let element;
        if (typeof tree.tag == 'string') {
            element = document.createElement(tree.tag);
        }
        else {
            throw new TypeError('Cannot parse except string');
        }
        for (const [key, values] of Object.entries(tree.attributes)) {
            let value = '';
            for (const val of values) {
                if (typeof val == 'string') {
                    value += val;
                }
                else {
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
