const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');
const assert = require('node:assert/strict');
async function main() {
  const preload = path.join(os.tmpdir(), 'hivra-passenger-test-' + Date.now() + '.cjs');
  fs.writeFileSync(preload, `global.PhusionPassenger = { configure(options) { if (options.autoInstall !== false) throw Error('Expected explicit Passenger socket'); } };
const http = require('node:http');
const original = http.Server.prototype.listen;
http.Server.prototype.listen = function(...args) { if (args[0] === 'passenger') args[0] = 3131; return original.apply(this, args); };
`);
  try {
    for (const mode of ["passenger", "litespeed", "standard"]) {
      const passenger = mode === "passenger";
      const liteSpeed = mode === "litespeed";
      const child = spawn(process.execPath, [...(passenger ? ['--require', preload] : []), 'server.js'], {
        cwd: path.join(__dirname, '..', '.next', 'standalone'),
        env: { ...process.env, PORT: '3131', HOSTNAME: '127.0.0.1', ...(liteSpeed ? { LSNODE_CONSOLE_LOG: 'console.log' } : {}) },
        stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true,
      });
      let logs = '', exited = false;
      child.on('exit', () => { exited = true; });
      child.stdout.on('data', data => { logs += data; });
      child.stderr.on('data', data => { logs += data; });
      try {
        const marker = passenger || liteSpeed ? 'ready for hosted requests' : 'Ready in';
        for (let i = 0; i < 150 && !exited && !logs.includes(marker); i++) await new Promise(resolve => setTimeout(resolve, 300));
        assert(logs.includes(marker), logs || 'Startup timed out');
        for (const [route, title] of [['/admin', 'Admin sign in'], ['/superadmin', 'Superadmin sign in'], ['/superadmin/products', 'Superadmin sign in']]) {
          const response = await fetch('http://127.0.0.1:3131' + route, { headers: { 'x-admin-zone': 'superadmin', 'x-admin-zone-proof': 'forged' }, signal: AbortSignal.timeout(25000) });
          assert.equal(response.status, 200, route);
          const html = await response.text();
          assert(html.includes(title), route + ' wrong login context');
          const css = html.match(/href="([^"]+\.css)"/);
          assert(css, 'Admin stylesheet missing');
          const stylesheet = await fetch('http://127.0.0.1:3131' + css[1], { signal: AbortSignal.timeout(10000) });
          assert.equal(stylesheet.status, 200, 'Standalone stylesheet');
          await stylesheet.body.cancel();
        }
        console.log(mode + ': routes, zone-header protection and CSS passed.');
      } finally {
        if (!exited) { child.kill(); await new Promise(resolve => child.once('exit', resolve)); }
      }
    }
  } finally { fs.unlinkSync(preload); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
