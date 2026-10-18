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
  // Emscripten/openFrameworks registers global mouse and touch handlers.
  // Keep slider gestures inside the controls so the scene cannot hijack dragging.
  const CONTROL_POINTER_EVENTS = [
    'pointerdown', 'pointermove', 'pointerup', 'pointercancel',
    'mousedown', 'mousemove', 'mouseup',
    'touchstart', 'touchmove', 'touchend', 'touchcancel',
    'click', 'dblclick'
  ];
  for (const eventName of CONTROL_POINTER_EVENTS) {
    panel.addEventListener(eventName, (event) => event.stopPropagation());
  }
  panel.style.pointerEvents = 'auto';
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
    // Explicit pointer-driven range update bypasses native drag conflicts with
    // the openFrameworks/Emscripten event handlers.
    let activePointerId = null;
    function updateFromPointer(event) {
      const bounds = slider.getBoundingClientRect();
      if (!bounds.width) return;
      const ratio = Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width));
      const position = GRAVITY_CONTROL_CONSTANTS.sliderMinimum +
        ratio * (GRAVITY_CONTROL_CONSTANTS.sliderMaximum - GRAVITY_CONTROL_CONSTANTS.sliderMinimum);
      slider.value = String(Math.round(position / GRAVITY_CONTROL_CONSTANTS.sliderStep) *
        GRAVITY_CONTROL_CONSTANTS.sliderStep);
      update();
    }
    slider.style.touchAction = 'none';
    slider.addEventListener('pointerdown', (event) => {
      activePointerId = event.pointerId;
      if (slider.setPointerCapture) slider.setPointerCapture(event.pointerId);
      updateFromPointer(event);
    });
    slider.addEventListener('pointermove', (event) => {
      if (event.pointerId === activePointerId) updateFromPointer(event);
    });
    for (const endEvent of ['pointerup', 'pointercancel', 'lostpointercapture']) {
      slider.addEventListener(endEvent, (event) => {
        if (event.pointerId === activePointerId) activePointerId = null;
      });
    }
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

  // Original cinematic arpeggio; no copyrighted film melody or score is embedded.
  // Audio starts only after a user gesture, as required by browser autoplay rules.
  const musicButton = document.createElement('button');
  musicButton.type = 'button';
  musicButton.id = 'music-toggle';
  musicButton.textContent = '▶ Music';
  Object.assign(musicButton.style, {cursor:'pointer',padding:'5px 9px',borderRadius:'5px',
    background:'#302541',color:'#fff',border:'1px solid #77638c'});
  panel.appendChild(musicButton);

  // Same original score and metallic FM sound as the standalone space_music.html demo.
  const MUSIC_CHORDS = [
    [45,52,57,60,64], [41,48,53,57,60], [48,55,60,64,67],
    [43,50,55,59,62], [50,57,62,65,69], [45,52,57,60,64],
    [41,48,53,57,60], [40,47,52,56,62]
  ];
  const MUSIC_MELODY = [
    69,72,76,79, 72,69,67,64, 67,72,76,74, 71,67,64,62,
    65,69,74,76, 72,69,64,60, 72,76,81,79, 76,74,71,68
  ];
  let audioContext = null, masterGain = null, musicTimer = null;
  let musicFilter = null, musicDelay = null, musicFeedback = null, musicWet = null;
  let nextNoteTime = 0, noteIndex = 0;

  let noiseBuffer, musicCompressor;
  const hz = n => 440*Math.pow(2,(n-69)/12);
  function env(g,t,v,attack,duration) {
    g.gain.setValueAtTime(.0001,t);
    g.gain.exponentialRampToValueAtTime(v,t+attack);
    g.gain.exponentialRampToValueAtTime(.0001,t+duration);
  }
  function kick(t) {
    const o=audioContext.createOscillator(),g=audioContext.createGain();
    o.frequency.setValueAtTime(165,t);
    o.frequency.exponentialRampToValueAtTime(46,t+.12);
    o.frequency.exponentialRampToValueAtTime(39,t+.45);
    env(g,t,.86,.003,.47);o.connect(g);g.connect(masterGain);
    o.start(t);o.stop(t+.49);
  }
  function noise(t,high,low,v,duration) {
    const s=audioContext.createBufferSource(),hp=audioContext.createBiquadFilter();
    const lp=audioContext.createBiquadFilter(),g=audioContext.createGain();
    s.buffer=noiseBuffer;hp.type='highpass';hp.frequency.value=high;
    lp.type='lowpass';lp.frequency.value=low;env(g,t,v,.002,duration);
    s.connect(hp);hp.connect(lp);lp.connect(g);g.connect(masterGain);
    s.start(t);s.stop(t+duration+.01);
  }
  function bass(t,n,d=.34) {
    const o=audioContext.createOscillator(),sub=audioContext.createOscillator();
    const f=audioContext.createBiquadFilter(),g=audioContext.createGain(),sg=audioContext.createGain();
    o.type='sawtooth';o.frequency.value=hz(n);sub.frequency.value=hz(n-12);
    f.type='lowpass';f.frequency.setValueAtTime(780,t);
    f.frequency.exponentialRampToValueAtTime(130,t+d);f.Q.value=2;
    env(g,t,.19,.009,d);env(sg,t,.21,.008,d);
    o.connect(f);f.connect(g);g.connect(masterGain);
    sub.connect(sg);sg.connect(masterGain);
    o.start(t);sub.start(t);o.stop(t+d+.02);sub.stop(t+d+.02);
  }
  function synth(t,notes,v,d,lead=false) {
    const f=audioContext.createBiquadFilter(),g=audioContext.createGain();
    f.type='lowpass';f.frequency.setValueAtTime(lead?1850:1450,t);
    if(lead)f.frequency.exponentialRampToValueAtTime(480,t+d);
    f.Q.value=lead?.7:1.1;env(g,t,v,lead?.014:.035,d);
    f.connect(g);g.connect(masterGain);g.connect(musicDelay);
    for(const n of notes) {
      for(const [type,level,detune] of (lead?
        [['triangle',1,0],['sawtooth',.17,5]]:[['sawtooth',1,(n%3-1)*4]])) {
        const o=audioContext.createOscillator(),pg=audioContext.createGain();
        o.type=type;o.frequency.value=hz(n);o.detune.value=detune;
        pg.gain.value=level;o.connect(pg);pg.connect(f);
        o.start(t);o.stop(t+d+.03);
      }
    }
  }
  function scheduleMusic() {
    if(!audioContext||audioContext.state!=='running')return;
    const speed=Number(document.getElementById('gravity-speed-slider').value);
    const gravity=Number(document.getElementById('gravity-strength-slider').value);
    const dt=60/112/4/(.5+.75*speed),transpose=Math.round((gravity-1)*12);
    while(nextNoteTime<audioContext.currentTime+.16) {
      const s=noteIndex%16,bar=Math.floor(noteIndex/16),ix=bar%8;
      const notes=MUSIC_CHORDS[ix],t=nextNoteTime;
      if(s%4===0)kick(t);
      if(s===4||s===12){noise(t,850,8500,.21,.12);noise(t+.025,1200,9000,.1,.09);}
      if(s%2===0)noise(t+.005,5300,14000,.075,.055);
      if([2,6,10,14].includes(s))noise(t+.01,5300,14000,.12,.26);
      if([2,3,6,8,10,11,14].includes(s))
        bass(t,notes[0]-12+transpose+([3,11].includes(s)?12:0),s===8?.23:.29);
      if(s===3||s===11)synth(t,notes.slice(1).map(n=>n+transpose),s===11?.046:.063,.88);
      if(s%4===0)synth(t,[MUSIC_MELODY[ix*4+s/4]+transpose],.105,.39,true);
      if(s===15&&bar%4===3)noise(t,2200,10000,.10,.24);
      noteIndex++;nextNoteTime+=dt;
    }
  }
  let musicEnabled = true;
  async function startMusic() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
      musicButton.textContent = 'Audio unavailable';
      return;
    }
    if (!audioContext) {
      audioContext = new AudioContextClass();
      masterGain = audioContext.createGain();
      masterGain.gain.value=.62;
      musicCompressor=audioContext.createDynamicsCompressor();
      musicCompressor.threshold.value=-16;musicCompressor.knee.value=12;
      musicCompressor.ratio.value=4;musicCompressor.attack.value=.005;
      musicCompressor.release.value=.18;
      masterGain.connect(musicCompressor);musicCompressor.connect(audioContext.destination);
      musicDelay=audioContext.createDelay(1);musicDelay.delayTime.value=60/112*.75;
      musicFeedback=audioContext.createGain();musicFeedback.gain.value=.23;
      musicWet=audioContext.createGain();musicWet.gain.value=.18;
      musicDelay.connect(musicFeedback);musicFeedback.connect(musicDelay);
      musicDelay.connect(musicWet);musicWet.connect(masterGain);
      noiseBuffer=audioContext.createBuffer(1,audioContext.sampleRate,audioContext.sampleRate);
      const samples=noiseBuffer.getChannelData(0);
      for(let i=0;i<samples.length;i++)samples[i]=Math.random()*2-1;
    }
    await audioContext.resume();
    if (!musicEnabled || audioContext.state !== 'running' || musicTimer !== null) return;
    nextNoteTime = audioContext.currentTime;
    musicTimer = setInterval(scheduleMusic, 25);
    musicButton.textContent = '■ Stop music';
    scheduleMusic();
  }
  musicButton.addEventListener('click', async () => {
    musicEnabled = !musicEnabled;
    if (!musicEnabled) {
      if (musicTimer !== null) clearInterval(musicTimer);
      musicTimer = null;
      if (audioContext) await audioContext.suspend();
      musicButton.textContent = '▶ Music';
      return;
    }
    await startMusic();
  });
  // Start enabled by default. Browsers may block sound until the first gesture.
  musicButton.textContent = '■ Stop music';
  void startMusic();
  const resumeOnGesture = () => {
    if (musicEnabled && musicTimer === null) void startMusic();
  };
  document.addEventListener('pointerdown', resumeOnGesture, {capture:true});
  document.addEventListener('keydown', resumeOnGesture, {capture:true});

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
