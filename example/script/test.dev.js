"use strict";

var _index = require("../../src/templating/index.js");

var _jsx = require("../../src/jsx.js");

function _templateObject2() {
  var data = _taggedTemplateLiteral(["<div>hello</div>"]);

  _templateObject2 = function _templateObject2() {
    return data;
  };

  return data;
}

function _templateObject() {
  var data = _taggedTemplateLiteral(["<div>hello</div>"]);

  _templateObject = function _templateObject() {
    return data;
  };

  return data;
}

function _taggedTemplateLiteral(strings, raw) { if (!raw) { raw = strings.slice(0); } return Object.freeze(Object.defineProperties(strings, { raw: { value: Object.freeze(raw) } })); }

console.time('html');
var card1 = (0, _index.html)(_templateObject());
var card2 = (0, _index.html)(_templateObject2());
console.log(card1.render().element);
console.log(card2.render().element);
console.timeEnd('html');
console.time('jsx');
var card3 = (0, _jsx.jsx)("div", null, "hello");
var card4 = (0, _jsx.jsx)("div", null, "hello");
console.log(card3.create());
console.log(card4.create());
console.timeEnd('jsx');