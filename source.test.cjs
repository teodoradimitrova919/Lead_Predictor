const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { execFileSync } = require('node:child_process');

test('source files have no merge markers and JavaScript parses', () => {
  for (const file of fs.readdirSync(__dirname).filter(name => /\.(js|cjs|html|css)$/.test(name))) {
    const source = fs.readFileSync(`${__dirname}/${file}`, 'utf8');
    assert.ok(!/^(<{7}|={7}|>{7})(?:\s.*)?$/m.test(source), `Unresolved merge in ${file}`);
    if (/\.(js|cjs)$/.test(file)) execFileSync(process.execPath, ['--check', file], { cwd: __dirname });
  }
});

test('HTML includes every application script once in dependency order', () => {
  const html = fs.readFileSync(`${__dirname}/index.html`, 'utf8');
  const scripts = [...html.matchAll(/<script\s+src="([^"]+)"\s+defer><\/script>/g)].map(match => match[1]);
  assert.deepEqual(scripts, ['script.js','sidebar.js','response-rates.js','calculations.js','dashboard.js']);
});
