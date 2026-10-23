// Static and timeline invariants for the standalone offline prototype.
const fs=require('node:fs'),assert=require('node:assert/strict'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'../../site/teknium-three-effects/index.html'),'utf8');
const src=fs.readFileSync(path.join(__dirname,'effects.js'),'utf8');
assert(html.includes('data:image/webp;base64,'));
assert(!html.includes('__ATLAS__'));
assert(!/<script[^>]+src=/.test(html));
assert(src.includes("function liquid(")&&src.includes("function pixels(")&&src.includes("function smoke("));
assert(src.includes('function fbm(')&&src.includes('function creatureGeometry('));
assert(src.includes('window.runwayFX='));
assert(html.includes('background:#000'));
assert(!/https?:\/\//.test(html));
new Function(src.replace('__ATLAS__','AAAA'));
const body=html.match(/<script>([\s\S]*)<\/script>/);
assert(body,'Missing inline script');
new Function(body[1]);
console.log('PASS: standalone script syntax, all three effects, offline inline atlas, black stage');
