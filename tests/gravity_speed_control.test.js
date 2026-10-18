// Run with: node tests/gravity_speed_control.test.js
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const elements = {};
function element(tag) {
  const listeners = {};
  return {
    tag, style: {}, children: [], listeners,
    setAttribute() {},
    append(...children) { this.children.push(...children); },
    appendChild(child) { this.children.push(child); },
    addEventListener(type, cb) { listeners[type] = cb; },
    getContext() { return {setTransform(){},clearRect(){},drawImage(){}}; },
    set id(value) { this._id = value; elements[value] = this; },
    get id() { return this._id; }
  };
}
const body = element('body');
const window = {};
const context = {
  document: {createElement: element, body},
  window, Image: class { constructor() { this.complete=false; } },
  performance: {now:()=>0}, requestAnimationFrame() {},
  devicePixelRatio:1, innerWidth:960, innerHeight:540,
  Math, Number
};
vm.runInNewContext(fs.readFileSync('src/wasm_walker_overlay.js','utf8'), context);
const speed = elements['gravity-speed-slider'];
const gravity = elements['gravity-strength-slider'];
assert.ok(speed && gravity, 'both sliders must render');
assert.equal(window.gravitySpeedFactor, 1.25);
assert.equal(window.gravityStrengthFactor, 2.1);
speed.value = '0'; speed.listeners.input();
gravity.value = '0'; gravity.listeners.input();
assert.equal(window.gravitySpeedFactor, 0);
assert.equal(window.gravityStrengthFactor, 0);
speed.value = '2'; speed.listeners.input();
gravity.value = '2'; gravity.listeners.input();
assert.equal(window.gravitySpeedFactor, 12.5);
assert.equal(window.gravityStrengthFactor, 21);
speed.value = '1'; speed.listeners.input();
gravity.value = '1'; gravity.listeners.input();
assert.equal(window.gravitySpeedFactor, 1.25);
assert.equal(window.gravityStrengthFactor, 2.1);
console.log('Gravity control tests passed');
