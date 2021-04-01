# arch

lightweight and simple library for building front-end web applications.

## Overview

With arch you can create a web front-end easily, several modules will help you create applications and will be integrated with each other. 

arch modules main modules:

* `html-templating`: Allows you to write ui (html) declaratively in javascript.
* `observeable-data`: Allows you to define observable data, with one change it will be notified to all observers, `observeable-data` object can also be integrated with `html-templating` which will make it reactive.
* `action-controller`: Allows you to control user interaction and do something about it.

### html-templating

`html-templating` module exports 2 main functions, the first `html` will be a place to write the ui using [tagged templates](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals) ECMAScript 2016, and `render` to render the return the `html` function and place them in a defined node.

#### Example 1

```javascript
import {html, render} from 'src/html-templating.js';

const foo = 'foo';

// this html using tagged templates. It return a preset
const preset = html`
    <div>hello ${foo}</div>
`;

// this render <div>hello foo</div> to the main element.
render(preset, 'main');
```

You can assign functions to attributes beginning with **'on'** in the element.

#### Example 2

```javascript
const click = () => {
    console.log('clicked');
}

const preset = html`
    <button onclick="${click}">click me</button>
`;

// Also assign value to attribute.

const theme = 'dark';

const preset = html`
    <button theme="${theme}">click me</button>
`;
```

`html` [tagged templates](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals) used to generate `TemplateRender` object which contains the template.

`render` function will render `TemplateRender` into element and append it to dom.

### observeable-data

With observable-data you can define the shape of the data or the model, you can observe the data and once the data is changed it will be notified to all observers.

the observeable-data module has 3 properties :

* `Value` : is a static class which functions to observe primitive data types. such as strings, numbers and booleans.
* `Map` : functions to observe object data types.
* `List` : functions to observe the array data type.

#### Example 1

```javascript
import {ObserveableData} from 'src/observeable-data.js';

// You can pass strings, numbers or booleans.
const value = new ObserveableData.Value('hello');

value.subscribe((newVal) => {
    console.log(newVal);
})

// To set the data value, you can use the set method.
value.set('hi'); // Will bring up "hi" in the console.

// Another

// The value passed to the constructor is the raw value
const list = new ObserveableData.List(['foo', 'bar']);

list.subscribe((raw) => {
    // The value to be passed to the observer is the raw value.
    console.log(raw);
})

list.push('baz'); // It will be ["foo", "bar", "baz"].

// To get the raw values, you can use the get method.
const raw = list.get();
```

`observable-data` can also be integrated with `html-templating`, it will make it reactive;

#### Example 2 

```javascript
import {html, render} from 'src/html-templating.js';
import {ObserveableData} from 'src/observeable-data.js';

const name = new ObserveableData.Value('foo');

// just o pass it like normal value.
const preset = html`
    <div>hello ${name}</div>
`;

render(preset, 'main'); // It will be <div>hello foo</div>

name.set('bar'); // And it will be <div>hello bar</div>
```

other observables can also be used.

#### Example 3

```javascript
import {html, render, forOf} from 'src/html-templating.js';
import {ObserveableData} from 'src/observeable-data.js';

// Define your model.
const list = new ObserveableData.List(['foo', 'bar', 'baz']);

// And use the forOf function.
const preset = html`
    <ul>
        ${forOf(list, (raw, item, index) => {
            raw`
                <li>hi ${item}.</li>
            `.flush();
        })}
    </ul>
`;

// It will render be <ul><li>hi foo.</li><li>hi bar.</li><li>hi baz.</li></ul>
render(preset, 'main');

// And It will be <ul><li>hi foo.</li><li>hi baz.</li></ul>
list.splice(1, 1);
```

The `forOf` function functions as an array type template, its first parameter is the array that you want to pass in the handler and the second parameter is the handler function. in the handler function the first argument is a stream function for writing ui, the second argument is an item of associated data, and the third argument is the index of the current data.

### action-controller

---

> You can see more examples in the [examples](https://github.com/AnasMubarakYasin/urjs/tree/master/example) directory.
