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

  function playMetallic(midi, time, volume = 0.12, duration = 2.5) {
    const frequency = 440 * Math.pow(2, (midi - 69) / 12);
    const carrier = audioContext.createOscillator();
    const modulator = audioContext.createOscillator();
    const modulation = audioContext.createGain();
    const envelope = audioContext.createGain();
    carrier.type = 'sine';
    modulator.type = 'sine';
    carrier.frequency.value = frequency;
    modulator.frequency.value = frequency * 2.01;
    modulation.gain.value = frequency * 0.32;
    modulator.connect(modulation);
    modulation.connect(carrier.frequency);
    envelope.gain.setValueAtTime(0.0001, time);
    envelope.gain.exponentialRampToValueAtTime(volume, time + 0.08);
    envelope.gain.exponentialRampToValueAtTime(0.0001, time + duration);
    carrier.connect(envelope);
    envelope.connect(musicFilter);
    carrier.start(time);
    modulator.start(time);
    carrier.stop(time + duration);
    modulator.stop(time + duration);
  }

  function scheduleMusic() {
    if (!audioContext || audioContext.state !== 'running') return;
    const speedPosition = Number(document.getElementById('gravity-speed-slider').value);
    const gravityPosition = Number(document.getElementById('gravity-strength-slider').value);
    const tempoMultiplier = 0.5 + 1.5 * speedPosition / 2;
    const beat = 0.6 / tempoMultiplier;
    const transpose = Math.round((gravityPosition - 1) * 12);
    while (nextNoteTime < audioContext.currentTime + 0.12) {
      const bar = Math.floor(noteIndex / 4) % MUSIC_CHORDS.length;
      const pass = Math.floor(noteIndex / (4 * MUSIC_CHORDS.length)) % 4;
      const part = noteIndex % 4;
      const chord = MUSIC_CHORDS[bar];
      const time = nextNoteTime;
      if (part === 0) {
        playMetallic(chord[0] + transpose, time, 0.14, 3.5);
        for (let i = 1; i < chord.length; i++) {
          playMetallic(chord[i] + transpose, time + i * beat * 0.45,
            0.035 + pass * 0.008, 2.8);
        }
      }
      playMetallic(MUSIC_MELODY[bar * 4 + part] + transpose, time,
        0.08 + pass * 0.025, 1.8);
      noteIndex++;
      nextNoteTime += beat;
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
      masterGain.gain.value = 0.35;
      masterGain.connect(audioContext.destination);
      musicFilter = audioContext.createBiquadFilter();
      musicFilter.type = 'lowpass';
      musicFilter.frequency.value = 1100;
      musicFilter.Q.value = 0.6;
      musicDelay = audioContext.createDelay(2);
      musicDelay.delayTime.value = 0.48;
      musicFeedback = audioContext.createGain();
      musicFeedback.gain.value = 0.32;
      musicWet = audioContext.createGain();
      musicWet.gain.value = 0.35;
      musicFilter.connect(masterGain);
      musicFilter.connect(musicDelay);
      musicDelay.connect(musicFeedback);
      musicFeedback.connect(musicDelay);
      musicDelay.connect(musicWet);
      musicWet.connect(masterGain);
    }
    await audioContext.resume();
    if (!musicEnabled || audioContext.state !== 'running' || musicTimer !== null) return;
    nextNoteTime = audioContext.currentTime;
    musicTimer = setInterval(scheduleMusic, MUSIC.schedulerIntervalMilliseconds);
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
