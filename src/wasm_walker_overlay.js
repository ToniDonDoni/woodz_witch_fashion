'use strict';
// The original 33 approved sprite frames are composited above the C++ WebAssembly canvas.
(() => {
  const canvas = document.createElement('canvas');
  canvas.id = 'walker-overlay';
  canvas.setAttribute('aria-label', 'Animated woman walking continuously through procedural woodland');
  Object.assign(canvas.style, {position:'fixed',inset:'0',width:'100vw',height:'100vh',pointerEvents:'none',zIndex:'20'});
  document.body.appendChild(canvas);
  // UI constants: mantissas are dimensionless; the exponents apply in C++.
  const GRAVITY_CONTROL_CONSTANTS = Object.freeze({
    speedSlowdownMantissa: 1.25, // Dimensionless multiplier of 10^8.
    gravityGainMantissa: 2.1,    // Dimensionless multiplier of 10^10.
    speedPowerOfTen: 8,          // Base-10 exponent, dimensionless.
    gravityPowerOfTen: 10,       // Base-10 exponent, dimensionless.
    sliderMinimum: 0,           // Dimensionless position.
    sliderDefault: 1,           // Dimensionless position.
    sliderMaximum: 2,           // Dimensionless position.
    sliderMaximumMultiplier: 10, // Dimensionless gain at right edge.
    sliderStep: 0.01            // Dimensionless position increment.
  });
  // Two controls: zero at left, reference in the middle, 10x at right.
  const panel = document.createElement('div');
  panel.id = 'gravity-controls';
  Object.assign(panel.style, {position:'fixed',right:'12px',top:'10px',zIndex:'2147483646',
    background:'#171321e8',color:'#f3e6ff',padding:'10px 12px',borderRadius:'8px',
    font:'12px monospace',display:'grid',gap:'7px'});
  function addControl(id, label, base, exponent, property) {
    const row = document.createElement('label');
    Object.assign(row.style, {display:'flex',alignItems:'center',gap:'8px'});
    const caption = document.createElement('span');
    caption.textContent = label;
    const slider = document.createElement('input');
    slider.id = id;
    slider.type = 'range';
    slider.min = String(GRAVITY_CONTROL_CONSTANTS.sliderMinimum);
    slider.max = String(GRAVITY_CONTROL_CONSTANTS.sliderMaximum);
    slider.step = String(GRAVITY_CONTROL_CONSTANTS.sliderStep);
    slider.value = String(GRAVITY_CONTROL_CONSTANTS.sliderDefault);
    slider.setAttribute('aria-label', label);
    const value = document.createElement('output');
    value.id = id + '-value';
    function update() {
      const position = Number(slider.value);
      const factor = base * (position <= GRAVITY_CONTROL_CONSTANTS.sliderDefault ? position :
        GRAVITY_CONTROL_CONSTANTS.sliderDefault +
        (GRAVITY_CONTROL_CONSTANTS.sliderMaximumMultiplier - GRAVITY_CONTROL_CONSTANTS.sliderDefault) *
        (position - GRAVITY_CONTROL_CONSTANTS.sliderDefault));
      window[property] = factor;
      value.textContent = factor.toFixed(2) + ' × 10^' + exponent;
    }
    slider.addEventListener('input', update);
    row.append(caption, slider, value);
    panel.appendChild(row);
    update();
  }
  addControl('gravity-speed-slider', 'Slowdown c',
    GRAVITY_CONTROL_CONSTANTS.speedSlowdownMantissa,
    GRAVITY_CONTROL_CONSTANTS.speedPowerOfTen, 'gravitySpeedFactor');
  addControl('gravity-strength-slider', 'Gravity G',
    GRAVITY_CONTROL_CONSTANTS.gravityGainMantissa,
    GRAVITY_CONTROL_CONSTANTS.gravityPowerOfTen, 'gravityStrengthFactor');
  document.body.appendChild(panel);
  const ctx = canvas.getContext('2d');
  const atlas = new Image();
  atlas.src = 'walk-atlas.webp';
  let start = performance.now(), frame = -1;
  function render(now) {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const width = innerWidth, height = innerHeight;
    if (canvas.width !== Math.round(width*dpr) || canvas.height !== Math.round(height*dpr)) {
      canvas.width = Math.round(width*dpr); canvas.height = Math.round(height*dpr);
    }
    ctx.setTransform(dpr,0,0,dpr,0,0);
    ctx.clearRect(0,0,width,height);
    if (atlas.complete && atlas.naturalWidth) {
      frame = Math.floor((now-start)*24/1000)%33;
      const figureHeight = Math.min(height*.68,width*1.42);
      const figureWidth = figureHeight*420/790;
      const x = (width-figureWidth)/2, y = height*.858-figureHeight;
      ctx.drawImage(atlas,(frame%6)*420,Math.floor(frame/6)*790,420,790,x,y,figureWidth,figureHeight);
    }
    requestAnimationFrame(render);
  }
  window.walkerState = () => ({ready:atlas.complete && atlas.naturalWidth>0,frame,frameCount:33,walking:frame>=0});
  requestAnimationFrame(render);
})();
