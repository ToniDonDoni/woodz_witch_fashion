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

  const MUSIC = Object.freeze({
    referenceTempoBeatsPerMinute: 84, // Quarter notes per minute.
    minimumTempoMultiplier: 0.5,       // Dimensionless.
    maximumTempoMultiplier: 2.0,       // Dimensionless.
    lookAheadSeconds: 0.12,            // Audio scheduler horizon.
    schedulerIntervalMilliseconds: 25, // Scheduling tick.
    sixteenthNotesPerBeat: 4,          // Subdivisions per quarter note.
    secondsPerMinute: 60,              // s/min.
    oscillatorDecaySeconds: 1.8,       // Piano-like envelope decay.
    oscillatorAttackSeconds: 0.008,    // Piano-like envelope attack.
    masterVolume: 0.19,                // Linear amplitude.
    glitchProbability: 0.10,          // Chance per note.
    grassProbability: 0.32,           // Chance per note.
    semitonesPerOctave: 12,
    concertA4Hertz: 440,
    concertA4MidiNote: 69
  });
  // Degrees are MIDI semitone offsets from A3 (220 Hz).
  const MUSIC_ROOT_MIDI = 57;
  const MUSIC_ARPEGGIO = [0, 7, 12, 15, 12, 7, 3, 7, 0, 7, 12, 15, 19, 12, 7, 3];
  let audioContext = null, masterGain = null, musicTimer = null;
  let nextNoteTime = 0, noteIndex = 0;

  function midiHertz(midi) {
    return MUSIC.concertA4Hertz *
      Math.pow(2, (midi - MUSIC.concertA4MidiNote) / MUSIC.semitonesPerOctave);
  }
  function makeNoise(durationSeconds, volume, highpassHertz, atSeconds) {
    const count = Math.max(1, Math.floor(audioContext.sampleRate * durationSeconds));
    const buffer = audioContext.createBuffer(1, count, audioContext.sampleRate);
    const samples = buffer.getChannelData(0);
    for (let i = 0; i < count; i++) samples[i] = Math.random() * 2 - 1;
    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    const filter = audioContext.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = highpassHertz;
    const envelope = audioContext.createGain();
    envelope.gain.setValueAtTime(volume, atSeconds);
    envelope.gain.exponentialRampToValueAtTime(0.0001, atSeconds + durationSeconds);
    source.connect(filter); filter.connect(envelope); envelope.connect(masterGain);
    source.start(atSeconds); source.stop(atSeconds + durationSeconds);
  }
  function playPiano(midi, atSeconds) {
    const frequency = midiHertz(midi);
    const envelope = audioContext.createGain();
    envelope.gain.setValueAtTime(0.0001, atSeconds);
    envelope.gain.exponentialRampToValueAtTime(0.28, atSeconds + MUSIC.oscillatorAttackSeconds);
    envelope.gain.exponentialRampToValueAtTime(0.0001, atSeconds + MUSIC.oscillatorDecaySeconds);
    envelope.connect(masterGain);
    for (const [wave, harmonic, volume] of [['sine', 1, 1], ['triangle', 2, 0.13]]) {
      const oscillator = audioContext.createOscillator();
      const partialGain = audioContext.createGain();
      oscillator.type = wave;
      oscillator.frequency.setValueAtTime(frequency * harmonic, atSeconds);
      partialGain.gain.value = volume;
      oscillator.connect(partialGain); partialGain.connect(envelope);
      oscillator.start(atSeconds);
      oscillator.stop(atSeconds + MUSIC.oscillatorDecaySeconds);
    }
  }
  function scheduleMusic() {
    if (!audioContext) return;
    const speedPosition = Number(document.getElementById('gravity-speed-slider').value);
    const harmonyPosition = Number(document.getElementById('gravity-strength-slider').value);
    // Slowdown c controls musical tempo; left = slower, right = faster.
    const tempoMultiplier = MUSIC.minimumTempoMultiplier +
      (MUSIC.maximumTempoMultiplier - MUSIC.minimumTempoMultiplier) *
      (speedPosition / GRAVITY_CONTROL_CONSTANTS.sliderMaximum);
    const secondsPerNote = MUSIC.secondsPerMinute /
      (MUSIC.referenceTempoBeatsPerMinute * tempoMultiplier * MUSIC.sixteenthNotesPerBeat);
    while (nextNoteTime < audioContext.currentTime + MUSIC.lookAheadSeconds) {
      const degree = MUSIC_ARPEGGIO[noteIndex % MUSIC_ARPEGGIO.length];
      // Minor third (3 semitones) transitions to major third (4 semitones).
      // Harmony is sampled at note boundaries to avoid retuning sustained notes.
      const majorBlend = Math.max(0, Math.min(1,
        harmonyPosition / GRAVITY_CONTROL_CONSTANTS.sliderMaximum));
      const majorThird = majorBlend >= 0.5 ? 4 : 3;
      const adjustedDegree = degree === 3 ? majorThird :
        degree === 15 ? 12 + majorThird : degree;
      // Gravity G also transposes the entire melody by up to one octave each way.
      // Left = 12 semitones lower, middle = original pitch, right = 12 higher.
      const transposeSemitones = Math.round(
        (harmonyPosition - GRAVITY_CONTROL_CONSTANTS.sliderDefault) *
        MUSIC.semitonesPerOctave
      );
      playPiano(MUSIC_ROOT_MIDI + adjustedDegree + transposeSemitones, nextNoteTime);
      if (Math.random() < MUSIC.grassProbability) {
        makeNoise(0.045, 0.035, 750, nextNoteTime);
      }
      if (Math.random() < MUSIC.glitchProbability) {
        makeNoise(0.012, 0.055, 2800, nextNoteTime);
      }
      noteIndex++;
      nextNoteTime += secondsPerNote;
    }
  }
  musicButton.addEventListener('click', async () => {
    if (musicTimer !== null) {
      clearInterval(musicTimer);
      musicTimer = null;
      await audioContext.suspend();
      musicButton.textContent = '▶ Music';
      return;
    }
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
      musicButton.textContent = 'Audio unavailable';
      return;
    }
    if (!audioContext) {
      audioContext = new AudioContextClass();
      masterGain = audioContext.createGain();
      masterGain.gain.value = MUSIC.masterVolume;
      masterGain.connect(audioContext.destination);
    }
    await audioContext.resume();
    nextNoteTime = audioContext.currentTime;
    musicTimer = setInterval(scheduleMusic, MUSIC.schedulerIntervalMilliseconds);
    musicButton.textContent = '■ Stop music';
    scheduleMusic();
  });

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
