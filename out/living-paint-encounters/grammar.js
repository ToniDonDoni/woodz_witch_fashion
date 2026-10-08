// Deterministic indexed encounter grammar. Nothing is sampled in the RAF loop.
// An event is a coherent composition of independently parameterized body, appendages,
// markings, behavior, materials, and choreography—not one of three prepared animations.
const encounterGrammar = (() => {
  'use strict';

  const SLOT_SECONDS = 7;
  const CHUNK_SLOTS = 12;
  const TOPOLOGIES = ['dome', 'orb', 'quadruped', 'bloom', 'spindle', 'mask'];
  const APPENDAGES = ['filaments', 'wings', 'jointed', 'petals', 'branches', 'ribbons'];
  const ACTIONS = ['hover', 'pulse', 'inspect', 'unfurl', 'retreat', 'imitate'];
  // Compatible structures prevent random limb soup. Each body allows four structural variants.
  const ALLOWED = [
    [0, 3, 4, 5], // dome / jelly-like
    [0, 1, 3, 5], // orb / insect-like
    [1, 2, 4, 5], // quadruped / mammalian
    [0, 1, 3, 4], // bloom / flower-like
    [0, 2, 4, 5], // spindle / fishlike
    [0, 1, 2, 5]  // mask / observer
  ];
  const PALETTES = [
    [[0.06, 0.88, 1.00], [0.72, 0.23, 1.00], [1.00, 0.32, 0.66]],
    [[0.38, 1.00, 0.67], [0.09, 0.78, 0.96], [0.86, 0.86, 0.24]],
    [[1.00, 0.31, 0.57], [0.88, 0.37, 1.00], [0.22, 0.68, 1.00]],
    [[1.00, 0.69, 0.23], [1.00, 0.35, 0.38], [0.78, 0.38, 1.00]],
    [[0.34, 0.76, 1.00], [0.24, 1.00, 0.95], [0.96, 0.59, 0.94]],
    [[0.77, 1.00, 0.28], [0.30, 0.78, 0.45], [0.20, 0.81, 0.91]]
  ];

  function hash(seed, index, channel = 0) {
    let x = (seed ^ Math.imul(index, 0x9e3779b9) ^ Math.imul(channel, 0x85ebca6b)) | 0;
    x = Math.imul(x ^ x >>> 16, 0x7feb352d);
    x = Math.imul(x ^ x >>> 15, 0x846ca68b);
    return (x ^ x >>> 16) >>> 0;
  }
  function rand(seed, index, channel = 0) {
    return hash(seed, index, channel) / 4294967296;
  }

  function chunkBodies(dreamSeed, chunkIndex) {
    // Twelve bodies per independent chunk, two each; bounded seeking at arbitrary time.
    const bodies = Array.from({length: CHUNK_SLOTS}, (_, i) => i % TOPOLOGIES.length);
    for (let i = bodies.length - 1; i > 0; i--) {
      const j = Math.floor(rand(dreamSeed, chunkIndex * 71 + i, 64) * (i + 1));
      [bodies[i], bodies[j]] = [bodies[j], bodies[i]];
    }
    for (let i = 1; i < bodies.length; i++) {
      if (bodies[i] !== bodies[i - 1]) continue;
      for (let j = i + 1; j < bodies.length; j++) {
        if (bodies[j] !== bodies[i - 1] &&
            (i === bodies.length - 1 || bodies[j] !== bodies[i + 1])) {
          [bodies[i], bodies[j]] = [bodies[j], bodies[i]];
          break;
        }
      }
    }
    return bodies;
  }

  function specForSlot(dreamSeed, index) {
    index = Math.max(0, Math.floor(index));
    const chunk = Math.floor(index / CHUNK_SLOTS);
    const within = index % CHUNK_SLOTS;
    const genomeSeed = hash(dreamSeed, index, 212121);
    const r = channel => rand(genomeSeed, channel, 2027);
    const body = chunkBodies(dreamSeed, chunk)[within];
    const allowed = ALLOWED[body];
    const append = allowed[Math.floor(r(1) * allowed.length)];
    const action = Math.floor(r(2) * ACTIONS.length);
    const lead = 0.30 + 0.50 * r(3);
    const duration = 4.50 + 0.60 * r(4);
    const tail = SLOT_SECONDS - lead - duration;
    // Rare intentional silence; the following event cannot begin early.
    const empty = within === Math.floor(rand(dreamSeed, chunk, 111) * CHUNK_SLOTS) &&
                  rand(dreamSeed, chunk, 222) < 0.64;

    // Each event contains many continuous parameters; topology and morphology are stable.
    const genes = Object.freeze({
      topology: body,
      appendage: append,
      count: 3 + Math.floor(r(5) * 5),
      appendLength: 0.65 + 0.95 * r(6),
      bodyWidth: 0.80 + 0.50 * r(7),
      bodyHeight: 0.72 + 0.60 * r(8),
      asymmetry: (r(9) - 0.5) * 0.32,
      petalCount: 3 + Math.floor(r(10) * 6),
      eyeMode: Math.floor(r(11) * 4),
      finAngle: 0.30 + r(12) * 1.05,
      twirl: 0.7 + 1.5 * r(13),
      skinFrequency: 0.65 + 0.95 * r(14),
      textureDensity: 0.55 + r(15) * 1.30,
      glowStrength: 0.65 + r(16) * 0.45,
      animationPhase: r(17) * Math.PI * 2
    });

    const palette = PALETTES[Math.floor(r(18) * PALETTES.length)];
    const event = {
      id: index, genomeSeed, empty, start: lead, duration, tail,
      bodyName: TOPOLOGIES[body], appendName: APPENDAGES[append],
      behaviorName: ACTIONS[action], behavior: action,
      genes, palette,
      side: r(19) < 0.5 ? -1 : 1,
      altitude: 0.38 + r(20) * 0.31,
      distance: 0.23 + r(21) * 0.085,
      size: 0.80 + 0.32 * r(22),
      arrival: r(23) < .5 ? 0 : 1
    };
    return Object.freeze(event);
  }

  function at(dreamSeed, seconds) {
    const time = Math.max(0, Number.isFinite(seconds) ? seconds : 0);
    const slot = Math.floor(time / SLOT_SECONDS);
    const local = time - slot * SLOT_SECONDS;
    const spec = specForSlot(dreamSeed, slot);
    const elapsed = local - spec.start;
    const active = !spec.empty && elapsed >= 0 && elapsed < spec.duration;
    return {spec, slot, local, elapsed, active};
  }

  return {SLOT_SECONDS, CHUNK_SLOTS, TOPOLOGIES, APPENDAGES, ACTIONS,
          specForSlot, at, hash, PALETTES};
})();
