import { jsx, Fragment } from '../../src/jsx.js';
const text = 'world';
const List = (attr, ...children) => (jsx("ul", null, children));
class Task {
    constructor(property) {
        this.property = property;
    }
    render() {
        return document.body;
    }
}
const a = (jsx("div", { class: "box" },
    jsx("img", { src: "/", alt: "", srcset: "" }),
    jsx(Fragment, null,
        jsx("span", null,
            "hello ",
            text)),
    jsx(List, { data: [] }),
    jsx(Task, { name: "", age: 1 },
        jsx("li", null, true))));
