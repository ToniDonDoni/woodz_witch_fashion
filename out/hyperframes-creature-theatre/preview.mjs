import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
const port = Number(process.env.PORT || 4117);
const server = createServer(async (req, res) => {
  const pathname = new URL(req.url, 'http://localhost').pathname;
  if (pathname === '/favicon.ico') { res.writeHead(204); res.end(); return; }
  if (pathname !== '/' && pathname !== '/index.html') { res.writeHead(404); res.end('Not found'); return; }
  try {
    const html = await readFile(new URL('index.html', import.meta.url));
    res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store'}); res.end(html);
  } catch { res.writeHead(500); res.end('Run npm run build before previewing.'); }
});
server.listen(port, '127.0.0.1', () => console.log(`Endless theatre: http://localhost:${port}`));
