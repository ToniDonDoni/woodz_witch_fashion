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
    getBoundingClientRect() { return {left:100,width:200}; },
    setPointerCapture(id) { this.capturedPointer = id; },
    getContext() { return {setTransform(){},clearRect(){},drawImage(){}}; },
    set id(value) { this._id = value; elements[value] = this; },
    get id() { return this._id; }
  };
}
const body = element('body');
const window = {};
const context = {
  document: {createElement: element, body, addEventListener() {}},
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
// Pointer dragging must update the actual WASM-facing globals, not just UI state.
speed.listeners.pointerdown({pointerId:7,clientX:100});
assert.equal(window.gravitySpeedFactor,0);
speed.listeners.pointermove({pointerId:7,clientX:300});
assert.equal(window.gravitySpeedFactor,12.5);
speed.listeners.pointerup({pointerId:7});
speed.listeners.pointermove({pointerId:7,clientX:100});
assert.equal(window.gravitySpeedFactor,12.5);
gravity.listeners.pointerdown({pointerId:8,clientX:100});
gravity.listeners.pointermove({pointerId:8,clientX:300});
assert.equal(window.gravityStrengthFactor,21);
gravity.listeners.pointerup({pointerId:8});
assert.ok(elements['music-toggle'], 'music start button must render');
assert.equal(elements['music-toggle'].textContent,'■ Stop music');
console.log('Gravity pointer and music control tests passed');
