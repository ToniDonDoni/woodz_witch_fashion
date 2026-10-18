'use strict';
// The original 33 approved sprite frames are composited above the C++ WebAssembly canvas.
(() => {
  const canvas = document.createElement('canvas');
  canvas.id = 'walker-overlay';
  canvas.setAttribute('aria-label', 'Animated woman walking continuously through procedural woodland');
  Object.assign(canvas.style, {position:'fixed',inset:'0',width:'100vw',height:'100vh',pointerEvents:'none',zIndex:'20'});
  document.body.appendChild(canvas);
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
