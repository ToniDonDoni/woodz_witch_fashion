import { build } from 'esbuild';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const dir = fileURLToPath(new URL('.', import.meta.url));
const bundled = await build({entryPoints: [dir + 'theatre.js'], bundle: true, minify: true,
  format: 'iife', write: false, legalComments: 'inline', target: 'es2022'});
const template = await readFile(dir + 'template.html.in', 'utf8');
// Reuse the exact approved 33-frame atlas already embedded by the main build.
const main = await readFile(dir + '../../index.html', 'utf8');
const atlas = main.match(/atlas\.src='(data:image\/webp;base64,[^']+)'/);
if (!atlas) throw new Error('Approved walk atlas missing: rebuild the main forest page first.');
const html = template.replace('__ATLAS_DATA_URL__', () => atlas[1])
  .replace('__BUNDLE__', () => bundled.outputFiles[0].text.replace(/<\/script/gi, '<\\/script'))
  .replace(/[\t ]+$/gm, '');
await writeFile(dir + 'index.html', html);
console.log(`Built endless offline runway: ${Buffer.byteLength(html)} bytes; original 33 walk frames`);
