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
const slider = elements['gravity-speed-slider'];
assert.ok(slider, 'slider must be rendered');
assert.equal(window.gravityWaveSpeed, 145);
slider.value = '1'; slider.listeners.input();
assert.ok(Math.abs(window.gravityWaveSpeed-1450)<1e-8);
slider.value = '-1'; slider.listeners.input();
assert.ok(Math.abs(window.gravityWaveSpeed-14.5)<1e-8);
slider.value = '-2'; slider.listeners.input();
assert.ok(Math.abs(window.gravityWaveSpeed-1.45)<1e-8);
slider.value = '2'; slider.listeners.input();
assert.ok(Math.abs(window.gravityWaveSpeed-14500)<1e-8);
console.log('Gravity speed control tests passed');
