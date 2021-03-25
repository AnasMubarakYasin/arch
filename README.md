# urjs

lightweight and simple library for building front-end web applications.

## Overview

With urjs you can create a web front-end easily, several modules will help you create applications and will be integrated with each other. 

urjs modules:

* `html-templating`: Allows you to write ui (html) declaratively in javascript.
* `observeable-data`: Allows you to define observable data, with one change it will be notified to all observers, `observeable-data` object can also be integrated with `html-templating` which will make it reactive.
* `action-controller`: Allows you to control user interaction and do something about it.

### html-templating

`html-templating` module exports 2 main functions, the first `html` will be a place to write the ui using [tagged templates](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals) ECMAScript 2016, and `render` to render the return the `html` function and place them in a defined node.

#### Example

```javascript
import {html, render} from 'src/html-templating.js';

const world = 'world';

// this html using tagged templates. It return a preset
const preset = html`
    <div>hello ${world}</div>
`;

// this render <div>hello wordl</div> to the main element.
render(preset, 'main');
```

`html` [tagged templates](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals) used to generate `TemplateRender` object which contains the template.

`render` function will render `TemplateRender` into element and append it to dom.

### observeable-data
