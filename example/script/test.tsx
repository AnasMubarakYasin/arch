import { html } from "../../src/templating/index.js";
import { jsx } from "../../src/jsx.js";

const text =  'world';
const section = 'section';
const data = 'quick fox jump'

console.time('html');
const card1 = html`<div class="box ${section}">hello <span data-content="${data}">${text}</span> yeah</div>`;
const card2 = html`<div class="box ${section}">hello <span data-content="${data}">${text}</span> yeah</div>`;
console.log(card1.render().element);
console.log(card2.render().element);
console.timeEnd('html');

console.time('jsx');
const card3 = <div class={`box ${section}`}>hello <span data-content={data}>{text}</span> yeah</div>;
const card4 = <div class={`box ${section}`}>hello <span data-content={data}>{text}</span> yeah</div>;
console.log(card3.create());
console.log(card4.create());
console.timeEnd('jsx');
