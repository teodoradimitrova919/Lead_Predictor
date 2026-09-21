// Optional local preview server. Run: node preview.cjs
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(__dirname, 'styles.css'), 'utf8');
if (!html.includes('href="styles.css"')) throw new Error('Missing stylesheet');
if (css.split('{').length !== css.split('}').length) throw new Error('Unbalanced CSS');
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
if (new Set(ids).size !== ids.length) throw new Error('Duplicate IDs');
for (const match of html.matchAll(/\bfor="([^"]+)"/g)) {
  if (!ids.includes(match[1])) throw new Error('Missing label target');
}
console.log('HTML and CSS checks passed.');

http.createServer((request, response) => {
  const pathname = new URL(request.url, 'http://localhost').pathname;
<<<<<<< Updated upstream
  const files = { '/': ['text/html', html], '/index.html': ['text/html', html], '/styles.css': ['text/css', css] };
=======
  const files = { '/': ['text/html', 'index.html'], '/index.html': ['text/html', 'index.html'], '/styles.css': ['text/css', 'styles.css'], '/script.js': ['text/javascript', 'script.js'] };
  files['/sidebar.js'] = ['text/javascript', 'sidebar.js'];
>>>>>>> Stashed changes
  const file = files[pathname];
  if (!file) { response.writeHead(404); response.end('Not found'); return; }
  response.writeHead(200, { 'Content-Type': `${file[0]}; charset=utf-8` });
  response.end(file[1]);
}).listen(4173, '127.0.0.1', () => console.log('Preview: http://localhost:4173'));
