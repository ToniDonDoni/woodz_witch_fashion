import * as THREE from 'three';

// HyperFrames inspires the absolute-time motion, but this is an endless browser
// runway. No finite video runtime or exported timeline controls playback.
const CYCLE = 12;
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const smooth = x => { x = clamp(x); return x * x * (3 - 2 * x); };
const beat = (t, start, end) => smooth((t - start) / (end - start));
const mix = (a, b, t) => a + (b - a) * t;
const v = (x, y, z = 0) => new THREE.Vector3(x, y, z);
function hash(seed, index) {
  let n = (seed ^ Math.imul(index + 1, 0x9e3779b9)) >>> 0;
  n ^= n >>> 16; n = Math.imul(n, 0x85ebca6b); n ^= n >>> 13;
  n = Math.imul(n, 0xc2b2ae35); return (n ^ (n >>> 16)) >>> 0;
}
function random(seed) {
  return () => {
    let t = seed += 0x6d2b79f5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function identity(seed, index) {
  const id = hash(seed, index), r = random(id);
  const roster = [0, 1, 2, 1, 0, 2, 1, 2, 0, 2, 0, 1];
  const form = Math.floor(r() * 4);
  // A stochastic block rotation visits all eight palettes without adjacent
  // repeats, including block boundaries (the last index is odd, the next even).
  const palette = ((index % 8) * 5 + 2 * (hash(seed, Math.floor(index / 8)) % 4)) % 8;
  const spec = {id, index, family: roster[index % roster.length], form, palette,
    hue: r(), body: mix(.60, 1.55, r()), bulk: mix(.62, 1.35, r()),
    snout: mix(.42, 1.62, r()), ears: mix(.42, 1.65, r()), legs: mix(.5, 1.65, r()),
    horns: 2 + Math.floor(r() * 6), spread: mix(.55, 1.85, r()),
    tail: mix(.35, 1.65, r()), wing: mix(.65, 1.45, r()),
    featherCount: 9 + Math.floor(r() * 14), crest: 2 + Math.floor(r() * 11),
    ornament: Math.floor(r() * 4), action: Math.floor(r() * 3), markings: Math.floor(r() * 10000)};
  if (index === 0 && seed === 1847) Object.assign(spec, {form: 0, palette: 0, body: 1.1, bulk: 1, snout: 1.1, legs: 1, ears: 1, spread: 1, tail: 1.1});
  return spec;
}
const palettes = [
  [0xcec7b2, 0xbdf7db, 0x745b68], [0x275c52, 0xbaff68, 0xf0b974],
  [0x59468a, 0xffbfe7, 0xcde8ff], [0x9c412e, 0xffd97c, 0x65c9c5],
  [0x164387, 0x79ddff, 0xf493b1], [0x856923, 0xf1fe95, 0x598e83],
  [0x684765, 0xff8376, 0xe5ccb7], [0x1e343d, 0xede5d4, 0x93acfa]
];

const canvas = document.getElementById('creatures');
let renderer;
try {
  renderer = new THREE.WebGLRenderer({canvas, antialias: true, alpha: false, preserveDrawingBuffer: true});
} catch {
  const error = document.createElement('p'); error.className = 'error';
  error.textContent = 'This theatre needs WebGL2. Please open it in a browser with graphics acceleration enabled.';
  document.getElementById('root').append(error);
  throw new Error('WebGL2 unavailable');
}
renderer.setClearColor(0x000000, 1);
renderer.setPixelRatio(1);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(32, 16 / 9, .1, 100);
const ambient = new THREE.HemisphereLight(0xe8e2ff, 0x332820, 1.6); scene.add(ambient);
const key = new THREE.DirectionalLight(0xffedce, 2.8); key.position.set(-3, 5, 7); scene.add(key);
const rim = new THREE.DirectionalLight(0xafd9ff, 3.6); rim.position.set(4, 2, -3); scene.add(rim);
const fill = new THREE.DirectionalLight(0xe0a9ff, 1.7); fill.position.set(-5, -1, 2); scene.add(fill);
const sphere = new THREE.SphereGeometry(1, 28, 20);
const cone = new THREE.ConeGeometry(1, 1, 16);
const resources = new Set([sphere, cone]);
// Preserve the exact footage-derived gait and original colors with an unlit
// atlas material. UV offsets select frames 0–32 at the existing 24 fps cadence.
let ready = false, walkFrame = 0;
const walkImage = new Image(), walkTexture = new THREE.Texture();
walkTexture.colorSpace = THREE.SRGBColorSpace;
walkTexture.repeat.set(1 / 6, 1 / 6);
walkTexture.magFilter = THREE.LinearFilter; walkTexture.minFilter = THREE.LinearFilter;
const walkMaterial = new THREE.MeshBasicMaterial({map: walkTexture, transparent: true, alphaTest: .015, toneMapped: false});
const walker = new THREE.Mesh(new THREE.PlaneGeometry(4.7 * 420 / 790, 4.7), walkMaterial);
walker.position.set(0, .55, 1.8); scene.add(walker);
walkImage.onload = () => { walkTexture.image = walkImage; walkTexture.needsUpdate = true; ready = true; renderAt(time); };
walkImage.onerror = () => { document.getElementById('phase').textContent = 'The embedded walk frames could not be loaded.'; };
walkImage.src = window.__WALK_ATLAS__;

function material(color, roughness = .45, metalness = .22, emissive = 0x000000) {
  return new THREE.MeshStandardMaterial({color, roughness, metalness, emissive, emissiveIntensity: .7});
}
function ellipsoid(parent, mat, pos, scale, rotation = 0) {
  const mesh = new THREE.Mesh(sphere, mat); mesh.position.copy(pos);
  mesh.scale.copy(scale); mesh.rotation.z = rotation; parent.add(mesh); return mesh;
}
function curve(parent, points, radius, mat, taper = false) {
  const path = new THREE.CatmullRomCurve3(points);
  const g = new THREE.TubeGeometry(path, Math.max(10, points.length * 5), radius, 6, false);
  if (taper) {
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const along = Math.floor(i / 7) / g.parameters.tubularSegments;
      const center = path.getPointAt(along);
      const q = v(p.getX(i), p.getY(i), p.getZ(i)).sub(center).multiplyScalar(1 - along * .92).add(center);
      p.setXYZ(i, q.x, q.y, q.z);
    }
    g.computeVertexNormals();
  }
  const mesh = new THREE.Mesh(g, mat); parent.add(mesh); return mesh;
}
function strands(parent, segments, color, opacity = 1) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(segments, 3));
  const mat = new THREE.LineBasicMaterial({color, transparent: opacity < 1, opacity});
  const lines = new THREE.LineSegments(g, mat); parent.add(lines); return lines;
}
function coat(parent, center, scale, r, count, color, length = .09) {
  const segments = [];
  for (let i = 0; i < count; i++) {
    const z = r() * 2 - 1, a = r() * Math.PI * 2, c = Math.sqrt(1 - z * z);
    const normal = v(c * Math.cos(a), z, c * Math.sin(a));
    const p = normal.clone().multiply(scale).add(center);
    const end = p.clone().add(normal.clone().multiplyScalar(length * mix(.6, 1.5, r())));
    // A backwards sweep makes the coat read as hair, rather than spikes.
    end.x -= length * .5; end.y -= length * .25;
    segments.push(...p.toArray(), ...end.toArray());
  }
  return strands(parent, segments, color, .82);
}
function ear(parent, mat, innerMat, side, size) {
  const g = new THREE.Group(); g.position.set(-.04, .56, side * .33);
  g.rotation.x = side * -.48; g.rotation.z = .27; parent.add(g);
  const e = new THREE.Mesh(cone, mat); e.scale.set(.22, .7 * size, .1); e.position.y = .24; g.add(e);
  const inner = new THREE.Mesh(cone, innerMat); inner.scale.set(.12, .49 * size, .04);
  inner.position.set(.035, .24, .075 * side); g.add(inner); return g;
}

function spirit(spec) {
  const r = random(spec.id), root = new THREE.Group();
  const [coatColor, accentColor, secondaryColor] = palettes[spec.palette];
  const pale = new THREE.Color(coatColor), accent = new THREE.Color(accentColor);
  const fur = material(pale, .7, .08), mask = material(0x343c40, .27, .45);
  const ivory = material(secondaryColor, .5, .1), inner = material(accentColor, .5, .1);
  const hornMat = material(accent, .36, .4, accent.clone().multiplyScalar(.13));
  const lightMat = material(0xdfffe9, .25, .15, 0x8bf0bb);
  const torsoSize = v(1.13 * spec.body, .48 * spec.bulk, .46 * spec.bulk);
  ellipsoid(root, fur, v(-.25, .02), torsoSize);
  ellipsoid(root, fur, v(.45, .14), v(.46, .62, .46), -.22);
  coat(root, v(-.25, .02), torsoSize.clone().multiplyScalar(1.015), r, 2200, pale, .06 + spec.bulk * .07);
  coat(root, v(.46, .14), v(.47, .63, .47), r, 1000, pale.clone().lerp(accent, .22), .11);
  const neck = spec.form === 1 ? .57 : spec.form === 3 ? -.14 : 0;
  if (neck > 0) ellipsoid(root, fur, v(.53, .54), v(.24, .62, .26), -.15);
  const head = new THREE.Group(); head.position.set(.62, .51 + neck, .02); root.add(head);
  ellipsoid(head, fur, v(.05, .1), v(.42, .4, .34), -.2);
  ellipsoid(head, ivory, v(.38, -.06, .02), v(.43 * spec.snout, .21, .25), -.28);
  ellipsoid(head, mask, v(.67 * spec.snout, -.14, .02), v(.13, .12, .20), -.24);
  coat(head, v(.01, .12), v(.43, .4, .35), r, 1000, pale, .075);
  const ears = [-1, 1].map(side => ear(head, fur, inner, side, spec.ears));
  if (spec.form === 2) head.scale.set(1.18, .82, 1.1);
  if (spec.form === 3) head.scale.set(.85, 1.15, .9);
  for (const side of [-1, 1]) {
    ellipsoid(head, mask, v(.23, .2, side * .285), v(.16, .09, .037), .12);
    ellipsoid(head, lightMat, v(.26, .215, side * .321), v(.065, .043, .021));
    ellipsoid(head, mask, v(.277, .216, side * .338), v(.016, .043, .007));
    const whiskers = [];
    for (let i = 0; i < 8; i++) {
      const start = v(.43 + r() * .16, -.1 + r() * .12, side * .22);
      const end = start.clone().add(v(.05 + r() * .12, -.03 - r() * .08, side * (.23 + r() * .16)));
      whiskers.push(...start.toArray(), ...end.toArray());
    }
    strands(head, whiskers, 0xece5d4, .65);
  }
  // Four jointed limbs, each with a wrist and a three-toed paw.
  const legs = [];
  for (const side of [-1, 1]) for (const front of [false, true]) {
    const leg = new THREE.Group(); leg.position.set(front ? .48 : -.97 * spec.body, -.23, side * .30);
    root.add(leg);
    leg.scale.y = spec.legs; leg.scale.x = .7 + spec.bulk * .35;
    curve(leg, [v(0, 0), v(front ? -.09 : .18, -.31), v(front ? .02 : .03, -.68)], .10, fur, true);
    ellipsoid(leg, fur, v(.08, -.72, .015), v(.19, .095, .13));
    for (let toe = -1; toe <= 1; toe++) {
      ellipsoid(leg, mask, v(.21, -.738, toe * .07), v(.045, .035, .028));
    }
    legs.push(leg);
  }
  const tail = new THREE.Group(); tail.position.set(-1.27 * spec.body, .07, 0); root.add(tail);
  const tailPoints = spec.form === 2 ? [v(0, 0), v(-.35, .28), v(-.4 * spec.tail, .9), v(.1, 1.2), v(.34, .9)]
    : spec.form === 3 ? [v(0, 0), v(-.5, -.3), v(-.9 * spec.tail, -.65), v(-1.45 * spec.tail, -.4)]
    : [v(0, 0), v(-.5, .08, .04), v(-.95 * spec.tail, .38, .07), v(-1.27 * spec.tail, .42, .04)];
  const tailPath = new THREE.CatmullRomCurve3(tailPoints);
  curve(tail, tailPoints, spec.form === 3 ? .09 : .24, fur, true);
  const tailFur = [];
  for (let i = 0; i < 1000; i++) {
    const t = r(), a = r() * 6.283, radius = .23 * (1 - t * .83);
    const p = tailPath.getPoint(t).add(v(0, Math.cos(a) * radius, Math.sin(a) * radius));
    tailFur.push(...p.toArray(), p.x - .13, p.y + .01, p.z + Math.sin(a) * .06);
  }
  strands(tail, tailFur, pale, .8);
  const antlers = new THREE.Group(); head.add(antlers);
  const twigs = [];
  for (const side of [-1, 1]) {
    const points = [v(-.12, .36, side * .15), v(-.27, .74, side * .26),
      v(-.4, 1.12, side * .43 * spec.spread), v(-.26, 1.55, side * .62 * spec.spread),
      v(-.43, 1.89, side * .75 * spec.spread)];
    if (spec.form === 1) points.forEach((p, i) => { p.x -= i * .20; p.y *= .65; p.z *= 1.7; });
    if (spec.form === 2) points.forEach((p, i) => { p.x += i * .12; p.y *= 1.22; p.z *= .55; });
    if (spec.form === 3) points.forEach((p, i) => { p.x -= i * .12; p.y *= .7; p.z *= 1.9; });
    curve(antlers, points, .057, hornMat, true);
    for (let j = 0; j < spec.horns; j++) {
      const u = (j + .65) / (spec.horns + .8), p = new THREE.CatmullRomCurve3(points).getPoint(u);
      const len = mix(.28, .59, r());
      const tip = p.clone().add(v((j % 2 ? -.6 : .8) * len, len, side * (.1 + r() * .2)));
      curve(antlers, [p, p.clone().lerp(tip, .56).add(v(-.08, .05)), tip], .025, hornMat, true);
      const twig = new THREE.Group(); twig.position.copy(tip); antlers.add(twig);
      const end = v((r() - .5) * .5, .28 + r() * .3, side * .14);
      curve(twig, [v(0, 0), end.clone().multiplyScalar(.55), end], .012, lightMat, true);
      curve(twig, [end.clone().multiplyScalar(.5), end.clone().add(v(.19, -.02, side * .1))], .008, lightMat, true);
      ellipsoid(twig, lightMat, end, v(.026, .052, .025)); twigs.push(twig);
    }
  }
  // Small mantle of carved pearls, an ornamental identity distinct from hue.
  for (let i = 0; i < 15; i++) {
    const a = i / 14 * Math.PI;
    ellipsoid(root, hornMat, v(.44, .25 - Math.sin(a) * .47, Math.cos(a) * .44), v(.045, .06, .04));
  }
  // Independently selected appendages produce hybrids across body archetypes.
  if (spec.ornament === 1 || spec.ornament === 2) {
    for (let i = 0; i < 9; i++) {
      const x = -.9 + i * .13;
      if (spec.ornament === 1) curve(root, [v(x, .34), v(x - .12, .77), v(x - .30, .96 + r() * .2)], .037, hornMat, true);
      else ellipsoid(root, hornMat, v(x, .5, 0), v(.13, .26, .06), -.5);
    }
  }
  if (spec.ornament === 3) for (const side of [-1, 1]) {
    const wing = new THREE.Group(); wing.position.set(-.3, .20, side * .30); root.add(wing);
    for (let i = 0; i < 10; i++) feather(wing, v(0, 0), v(-.6 + i * .12, .7 + Math.sin(i / 9 * Math.PI) * .7, side * .6), .07, ivory, accentColor, .15);
  }
  return {root, animate(t) {
    const arrive = beat(t, .2, 2.7), leave = beat(t, 8.6, 11.7);
    root.position.set(mix(-8, -2.15, arrive) + 11 * leave, -.50 + .45 * (1 - arrive) + 1.5 * leave, 0);
    root.rotation.set(.05, mix(-.55, -.25, arrive) + .5 * leave, -.20 * (1 - arrive) + .20 * leave);
    const inspect = beat(t, 3, 4.2), release = beat(t, 8, 9);
    head.rotation.y = -.55 * inspect * (1 - release);
    head.rotation.z = .09 * inspect - .11 * beat(t, 6.6, 7.5);
    const run = (1 - arrive) + leave;
    legs.forEach((leg, i) => { leg.rotation.z = -.15 + Math.sin(t * 9 + i * Math.PI * .8) * .6 * run; });
    ears.forEach((e, i) => { e.rotation.z = .27 + (i ? -.16 : .18) * inspect; });
    tail.rotation.z = -.23 * leave; tail.rotation.y = .2 * inspect;
    if (spec.action === 1) root.position.y += .6 * Math.sin(arrive * Math.PI) * (1 - arrive);
    if (spec.action === 2) root.rotation.z -= .15 * (1 - arrive);
    const grow = beat(t, 6, 7.7);
    twigs.forEach((twig, i) => { twig.scale.setScalar(Math.max(.001, beat(t, 6 + i * .055, 7.1 + i * .055))); });
    hornMat.emissive.copy(accent).multiplyScalar(.13 + grow * .65);
    return t < 2.7 ? 'Emerging beside her' : t < 5 ? 'Turning toward the walker' : t < 6 ? 'A moment of recognition' : t < 8.6 ? 'The antlers become a living crown' : 'Released into the dark';
  }};
}

// A triangulated, scalloped membrane, not a sprite. The analytic shader gives
// interference colors, veins and concentric eyespots without image textures.
function membrane(parent, side, hind, spec, mat) {
  const positions = [], uv = [], indices = [];
  const n = 48, m = 12;
  for (let i = 0; i <= n; i++) {
    const angle = mix(hind ? -1.38 : -.43, hind ? .14 : 1.39, i / n);
    const shape = hind ? 1.4 : 2.25;
    const teeth = spec.form === 3 ? .20 : spec.form === 2 ? .01 : .055;
    const radius = shape * spec.wing * (1 + teeth * Math.cos(angle * (spec.form === 3 ? 11 : 19) + spec.hue * 4));
    const sx = spec.form === 1 ? 1.35 : spec.form === 2 ? .8 : 1;
    const sy = spec.form === 1 ? .42 : spec.form === 2 ? 1.3 : 1;
    for (let j = 0; j <= m; j++) {
      const q = j / m;
      const x = side * (.11 + Math.cos(angle) * radius * q * sx);
      const y = Math.sin(angle) * radius * q * sy + (hind ? -.23 : .05);
      const z = -.08 + Math.sin(q * Math.PI) * .18;
      positions.push(x, y, z); uv.push(q, i / n);
      if (i < n && j < m) {
        const a = i * (m + 1) + j, b = a + m + 1;
        indices.push(a, b, a + 1, b, b + 1, a + 1);
      }
    }
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(indices); g.computeVertexNormals();
  const mesh = new THREE.Mesh(g, mat); parent.add(mesh);
  const veins = [];
  for (let i = 0; i < 16; i++) {
    const a = mix(hind ? -1.38 : -.43, hind ? .14 : 1.39, i / 15);
    const radius = (hind ? 1.4 : 2.25) * spec.wing;
    let previous = v(side * .11, hind ? -.23 : .05, -.07);
    for (let j = 1; j <= 14; j++) {
      const sx = spec.form === 1 ? 1.35 : spec.form === 2 ? .8 : 1;
      const sy = spec.form === 1 ? .42 : spec.form === 2 ? 1.3 : 1;
      const q = j / 14, p = v(side * (.11 + Math.cos(a) * radius * q * sx), Math.sin(a) * radius * q * sy + (hind ? -.23 : .05), -.07 + Math.sin(q * Math.PI) * .18);
      veins.push(...previous.toArray(), ...p.toArray()); previous = p;
    }
  }
  strands(parent, veins, hind ? 0xdec7fe : 0xc7ffe7, .58);
  const outline = [];
  for (let i = 0; i < n; i++) {
    const a = i * (m + 1) + m, b = (i + 1) * (m + 1) + m;
    outline.push(...positions.slice(a * 3, a * 3 + 3), ...positions.slice(b * 3, b * 3 + 3));
  }
  strands(parent, outline, 0xf2eadf, .85);
}
function moth(spec) {
  const root = new THREE.Group(), r = random(spec.id);
  const [primary, secondary, third] = palettes[spec.palette];
  const bodyMat = material(primary, .5, .25), dark = material(0x293634, .28, .5);
  const pearl = material(secondary, .3, .3, secondary);
  const wingMat = new THREE.ShaderMaterial({side: THREE.DoubleSide, transparent: true,
    uniforms: {uHue: {value: spec.hue}, uReveal: {value: 1}, uPrimary: {value: new THREE.Color(secondary)}, uSecondary: {value: new THREE.Color(third)}},
    vertexShader: `varying vec2 vUV; varying vec3 vNormal; void main(){vUV=uv;vNormal=normalize(normalMatrix*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader: `varying vec2 vUV; varying vec3 vNormal; uniform float uHue; uniform float uReveal; uniform vec3 uPrimary,uSecondary;
      void main(){float r=vUV.x,a=vUV.y; if(r>uReveal)discard;
      vec3 col=mix(uPrimary,uSecondary,.5+.5*sin(r*7.+a*4.+uHue*6.));
      float silk=pow(abs(sin(r*162.+sin(a*24.)*4.)),22.);
      float vein=pow(abs(cos(a*3.14159*16.+r*.2)),32.);
      vec2 eye=(vec2(r,a)-vec2(.69,.57))*vec2(1.,1.5); float d=length(eye);
      float ring=exp(-pow((d-.115)*65.,2.))+exp(-pow((d-.072)*85.,2.));
      float pupil=1.-smoothstep(.025,.057,d); col*=1.-pupil*.86;
      col=mix(col,vec3(.86,.94,.75),clamp(vein*.3+ring*.8,0.,1.));
      float rim=pow(1.-abs(vNormal.z),2.); col=col*(.5+r*.6)+silk*.16+rim*.3;
      gl_FragColor=vec4(col, .94);}`});
  const wings = [];
  for (const side of [-1, 1]) {
    const wing = new THREE.Group(); root.add(wing);
    membrane(wing, side, true, spec, wingMat); membrane(wing, side, false, spec, wingMat);
    wings.push(wing);
    curve(root, [v(side * .055, .75, .14), v(side * .18, 1.10, .1), v(side * .38, 1.38, 0)], .015, pearl, true);
    const featherAntenna = [];
    for (let i = 0; i < 16; i++) {
      const t = i / 16, x = side * mix(.08, .38, t), y = mix(.8, 1.36, t);
      featherAntenna.push(x, y, .1, x + side * .11 * (1 - t), y + .04, .1);
    }
    strands(root, featherAntenna, 0xece5d4, .8);
  }
  ellipsoid(root, bodyMat, v(0, .16, .11), v(.14, .47 * spec.body, .14));
  ellipsoid(root, dark, v(0, .65, .13), v(.18, .18, .13));
  coat(root, v(0, .2, .12), v(.15, .42, .14), r, 700, secondary, .07);
  for (let i = 0; i < 9; i++) {
    ellipsoid(root, i % 2 ? pearl : bodyMat, v(0, -.18 - i * .075, .13), v(.105 * (1 - i * .07), .065, .11));
  }
  for (const side of [-1, 1]) {
    ellipsoid(root, pearl, v(side * .13, .68, .235), v(.067, .069, .03));
    for (let i = 0; i < 3; i++) curve(root, [v(side * .1, .1 - i * .13, .17), v(side * .28, -.04 - i * .13, .24), v(side * .35, -.28 - i * .13, .16)], .008, bodyMat, true);
  }
  if (spec.ornament > 1) for (const side of [-1, 1]) {
    curve(root, [v(side * .06, -.5, .1), v(side * .4, -1.1 * spec.tail), v(side * .8, -1.7 * spec.tail, -.2)], .02, pearl, true);
  }
  return {root, animate(t) {
    const arrive = beat(t, .2, 2.4), open = beat(t, 2.2, 4), depart = beat(t, 8, 11.6);
    root.position.set(mix(-8, 1.75, arrive) + 11 * depart, 1.2 + .45 * depart, .2 + .9 * beat(t, 5, 7));
    root.rotation.set(.08, -.3 * (1 - arrive) + .1 * beat(t, 4, 6), -.12 * (1 - arrive) - .48 * depart);
    root.scale.setScalar(.65 + .08 * beat(t, 5, 7));
    const power = beat(t, 6.8, 8) * (1 - beat(t, 11, 12));
    wings.forEach((wing, i) => { wing.rotation.y = (i ? 1 : -1) * (1.48 * (1 - open) + Math.sin(t * 14) * .65 * power); });
    wingMat.uniforms.uReveal.value = Math.max(.01, arrive);
    return t < 2.4 ? 'Gathering beside her' : t < 4 ? 'Unfolding the hidden wings' : t < 6.8 ? 'Displaying its wings to the walker' : t < 8 ? 'The first powered wingbeat' : 'Flying past the lens';
  }};
}

function feather(parent, base, tip, width, mat, ribMat, bend = 0) {
  const p = [], uv = [], indices = [], n = 18;
  const axis = tip.clone().sub(base), cross = v(-axis.y, axis.x, 0).normalize();
  const centers = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const center = base.clone().lerp(tip, t).add(v(0, 0, Math.sin(t * Math.PI) * bend));
    centers.push(center);
    const w = Math.pow(Math.sin(t * Math.PI), .65) * width;
    for (const side of [-1, 1]) { const q = center.clone().addScaledVector(cross, w * side); p.push(...q.toArray()); uv.push(t, (side + 1) / 2); }
    if (i < n) { const a = i * 2; indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(indices); g.computeVertexNormals();
  const mesh = new THREE.Mesh(g, mat); parent.add(mesh);
  const ribs = [];
  for (let i = 2; i < n - 1; i++) {
    const c = centers[i - 1];
    for (let side = 0; side < 2; side++) ribs.push(...c.toArray(), ...p.slice((i * 2 + side) * 3, (i * 2 + side) * 3 + 3));
  }
  strands(parent, ribs, ribMat, .5);
  return mesh;
}
function bird(spec) {
  const r = random(spec.id), root = new THREE.Group();
  const [primary, secondary, third] = palettes[spec.palette];
  const mat = material(primary, .3, .65);
  const breast = material(third, .35, .4), black = material(0x182227, .3, .4);
  const pearl = material(secondary, .3, .25, secondary);
  const wingMat = new THREE.MeshStandardMaterial({color: primary, roughness: .34, metalness: .5, side: THREE.DoubleSide});
  const lightWing = wingMat.clone(); lightWing.color.set(secondary);
  ellipsoid(root, breast, v(0, 0), v(.65 * spec.body, .34 * spec.bulk, .3 * spec.bulk), -.12);
  ellipsoid(root, mat, v(.53, .16), v(.32, .30, .26));
  ellipsoid(root, black, v(.68, .24, .235), v(.11, .10, .037));
  ellipsoid(root, pearl, v(.70, .26, .267), v(.055, .055, .018));
  const beak = new THREE.Mesh(cone, mat); beak.scale.set(.10, .55 * spec.snout, .10);
  beak.rotation.z = -Math.PI / 2; beak.position.set(1.04, .12, .015); root.add(beak);
  for (let i = 0; i < spec.crest; i++) feather(root, v(.38, .32, i * .012), v(.03 - i * .065, .54 + i * .055 * spec.ears, 0), .05, lightWing, secondary, .07);
  const wings = [];
  for (const side of [-1, 1]) {
    const wing = new THREE.Group(); wing.position.set(.02, .07, side * .22); root.add(wing);
    for (let i = 0; i < spec.featherCount; i++) {
      const u = i / (spec.featherCount - 1);
      feather(wing, v(-.1 + .12 * u, 0, i * .005),
        v(mix(-1.55, 1.0, u) * spec.wing * (spec.form === 1 ? .55 : 1), (1.38 + .72 * Math.sin(u * Math.PI)) * side * (spec.form === 2 ? .6 : spec.form === 1 ? 1.4 : 1), -.06),
        .075 + .03 * spec.bulk, i % 4 ? wingMat : lightWing, secondary, .16);
    }
    for (let i = 0; i < 12; i++) {
      const u = i / 11;
      feather(wing, v(-.1, side * .06, .045), v(mix(-1.1, .68, u), side * (.84 + .34 * Math.sin(u * Math.PI)), .12), .095, lightWing, 0xd3ffe9, .08);
    }
    wings.push(wing);
    curve(root, [v(.02, -.25, side * .15), v(-.08, -.39, side * .15), v(.09, -.41, side * .15)], .021, mat, true);
  }
  const tails = [], filaments = [];
  for (let i = 0; i < 13; i++) {
    const tail = new THREE.Group(); tail.position.set(-.48, -.01, .02); root.add(tail);
    const u = (i - 6) / 6;
    const tailX = spec.form === 2 ? -1.25 : spec.form === 3 ? -2.2 * (1 - Math.abs(u) * .4) : -1.7 - .8 * (1 - Math.abs(u));
    const tailY = u * (spec.form === 2 ? 1.65 : spec.form === 3 ? .12 : .55);
    feather(tail, v(0, 0), v(tailX * spec.tail, tailY, u * .12), spec.form === 2 ? .15 : .075, i % 3 ? wingMat : lightWing, secondary, .07);
    tails.push(tail);
  }
  const wake = new THREE.Group(); root.add(wake);
  for (let i = 0; i < 24; i++) {
    const y = (r() - .5) * .7, z = (r() - .5) * .45;
    const mesh = curve(wake, [v(-.7, y, z), v(-1.8, y + .1, z + .2), v(-3.1 - r() * 1.1, y + .35, z + .2)], .009, pearl, true);
    filaments.push(mesh);
  }
  return {root, animate(t) {
    const arrive = beat(t, .2, 2.7), bank = beat(t, 3.4, 5.5), unwind = beat(t, 6.2, 8.1), depart = beat(t, 8.4, 11.6);
    root.position.set(mix(-9, -1.5, arrive) + 12 * depart, 2.1 + .48 * depart, .25);
    root.rotation.set(.09 + .48 * bank * (1 - unwind), -.28 + .2 * arrive, .12 * (1 - arrive) + Math.PI * 2 * bank - .32 * depart);
    const effort = (1 - arrive) + depart;
    wings.forEach((wing, i) => { wing.rotation.x = (i ? 1 : -1) * (.13 + Math.sin(t * 10) * .42 * effort); });
    tails.forEach((tail, i) => { tail.rotation.z = .34 * bank * (1 - unwind) + (i - 6) * .025 * unwind; });
    wake.scale.x = Math.max(.001, unwind); wake.visible = unwind > .01;
    return t < 2.7 ? 'Swooping toward her' : t < 3.4 ? 'Gliding above the walker' : t < 6.2 ? 'The tail coils around a turn' : t < 8.4 ? 'Feathers release a comet wake' : 'Disappearing beyond the stage';
  }};
}

const builders = [spirit, moth, bird];
const names = [['Moon fox', 'Crownback deer', 'Coiled forest cat', 'Branch-horn drake'],
  ['Silk moth', 'Ribbon-wing spirit', 'Petal-wing moth', 'Serrated nightwing'],
  ['Comet bird', 'Needle-wing swift', 'Fan-tailed phoenix', 'Ribbon-tailed bird']];
function freshSeed() { const data = new Uint32Array(1); crypto.getRandomValues(data); return data[0]; }
const querySeed = new URLSearchParams(location.search).get('seed');
let current = null, currentSpec = null, worldSeed = querySeed !== null ? Number(querySeed) >>> 0 : freshSeed(), time = .2;
let running = !matchMedia('(prefers-reduced-motion: reduce)').matches, lastClock = null;
let width = 1280, height = 720;
const labels = {family: document.getElementById('family'), phase: document.getElementById('phase'),
  specimen: document.getElementById('specimen'), seed: document.getElementById('seed-label'), progress: document.getElementById('progress')};

function dispose(being) {
  const geometries = new Set(), materials = new Set();
  being.root.traverse(o => { if (o.geometry && !resources.has(o.geometry)) geometries.add(o.geometry);
    if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => materials.add(m)); });
  geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose()); scene.remove(being.root);
}
function resize() {
  const rect = document.getElementById('root').getBoundingClientRect();
  width = Math.max(1, Math.round(rect.width)); height = Math.max(1, Math.round(rect.height));
  renderer.setSize(width, height, false); camera.aspect = width / height;
  // Narrow screens preserve full anatomy instead of cropping wing tips or horns.
  const distance = Math.max(12.6, 10.8 / camera.aspect);
  camera.position.set(0, .65, distance); camera.lookAt(0, .55, 0); camera.updateProjectionMatrix();
  const planeHeight = 2 * Math.tan(THREE.MathUtils.degToRad(16)) * (distance - 1.8);
  walker.scale.setScalar(planeHeight * .64 / 4.7);
  if (current) renderAt(time);
}
function renderAt(t) {
  time = Math.max(0, Number.isFinite(t) ? t : 0);
  const index = Math.floor(time / CYCLE), age = time - index * CYCLE;
  const spec = identity(worldSeed, index);
  if (!currentSpec || currentSpec.id !== spec.id || currentSpec.index !== index) {
    if (current) dispose(current);
    current = builders[spec.family](spec); currentSpec = spec; scene.add(current.root);
    const size = new THREE.Box3().setFromObject(current.root).getSize(v(0, 0));
    current.fit = (3.1 + (spec.id % 7) * .12) / Math.max(size.x, size.y, size.z);
    labels.family.textContent = names[spec.family][spec.form];
    labels.specimen.textContent = `Visitor ${String(index + 1).padStart(3, '0')}`;
    labels.seed.textContent = `Seed ${String(worldSeed).padStart(5, '0')}`;
  }
  current.root.scale.setScalar(1);
  labels.phase.textContent = current.animate(age);
  current.root.scale.multiplyScalar(current.fit);
  if (camera.aspect < .9) {
    current.root.position.x *= .5;
    current.root.scale.multiplyScalar(.75);
    // Bring visitors in front of the lower body in narrow layouts, preserving
    // their faces without obscuring the woman's head.
    current.root.position.z += 2.2;
  }
  walkFrame = Math.floor(time * 24) % 33;
  walkTexture.offset.set((walkFrame % 6) / 6, 1 - (Math.floor(walkFrame / 6) + 1) / 6);
  labels.progress.style.transform = `scaleX(${age / CYCLE})`;
  renderer.render(scene, camera);
  return state();
}
function state() { return {time, seed: worldSeed, running, ready, walkFrame, walkFrames: 33,
  specimen: currentSpec, activeCreatures: current ? 1 : 0,
  phase: labels.phase.textContent, size: [width, height],
  gpu: {...renderer.info.memory}, calls: renderer.info.render.calls}; }

function updatePause() {
  const button = document.getElementById('pause');
  button.textContent = running ? 'Pause' : 'Play'; button.setAttribute('aria-label', running ? 'Pause animation' : 'Play animation');
}
document.getElementById('pause').addEventListener('click', () => { running = !running; lastClock = null; updatePause(); });
document.getElementById('next').addEventListener('click', () => { renderAt((Math.floor(time / CYCLE) + 1) * CYCLE + .2); lastClock = null; });
document.getElementById('dream').addEventListener('click', () => {
  worldSeed = freshSeed(); currentSpec = null; renderAt(.2); lastClock = null;
});
document.addEventListener('visibilitychange', () => { lastClock = null; });
window.addEventListener('resize', resize);
function frame(clock) {
  // The browser's RAF timestamp advances playback time only. All visual state
  // still comes from renderAt, including the original 24 fps walk cycle.
  if (ready && running && !document.hidden) {
    if (lastClock !== null) renderAt(time + Math.min((clock - lastClock) / 1000, .1));
    lastClock = clock;
  } else lastClock = null;
  requestAnimationFrame(frame);
}
window.theatre = {get ready() {return ready;}, state, identity: index => identity(worldSeed, index),
  seek(t) { running = false; lastClock = null; updatePause(); return renderAt(t); },
  reseed(seed) { worldSeed = seed >>> 0; currentSpec = null; return renderAt(time); },
  renderAt};
resize(); renderAt(time); updatePause(); requestAnimationFrame(frame);
