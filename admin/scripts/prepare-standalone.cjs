const fs = require('node:fs');
const path = require('node:path');
const file = path.join(__dirname, '..', '.next', 'standalone', 'server.js');
let source = fs.readFileSync(file, 'utf8');
const marker = '// Passenger initializes Next before accepting requests.';
if (!source.includes(marker)) {
  const start = source.indexOf('startServer({');
  if (start < 0) throw new Error('Unexpected Next.js standalone bootstrap; refusing to modify it.');
  const originalStart = source.slice(start);
  source = source.slice(0, start) + marker + '\n' + `
const passenger = typeof PhusionPassenger !== 'undefined';
const liteSpeed = Boolean(process.env.LSNODE_CONSOLE_LOG);
if (passenger || liteSpeed) {
  if (passenger) PhusionPassenger.configure({ autoInstall: false });
  process.env.__NEXT_PRIVATE_ORIGIN = 'http://' + (hostname === '0.0.0.0' ? 'localhost' : hostname) + ':' + currentPort;
  const { createServer } = require('node:http');
  const { getRequestHandlers } = require('next/dist/server/lib/start-server');
  let requestHandler;
  const server = createServer((req, res) => {
    Promise.resolve(requestHandler(req, res)).catch((error) => {
      console.error(error);
      if (!res.headersSent) res.writeHead(500);
      res.end('Internal server error');
    });
  });
  server.on('error', (error) => { console.error(error); process.exit(1); });
  getRequestHandlers({ dir, port: currentPort, hostname, isDev: false, server, keepAliveTimeout })
    .then((handlers) => {
      requestHandler = handlers.requestHandler;
      server.on('upgrade', handlers.upgradeHandler);
      const ready = () => console.log('Admin Next.js ready for hosted requests');
      if (passenger) server.listen('passenger', ready);
      else server.listen(currentPort, hostname, ready);
    })
    .catch((error) => { console.error(error); process.exit(1); });
} else {
` + originalStart + '\n}\n';
  fs.writeFileSync(file, source);
}
console.log('Prepared admin standalone startup for Passenger and standard Node.js.');

// Standalone output does not include public or static assets automatically.
const appRoot = path.join(__dirname, "..");
const standalone = path.join(appRoot, ".next", "standalone");
for (const [from, to] of [["public", "public"], [".next/static", ".next/static"]]) {
  const source = path.join(appRoot, from);
  if (fs.existsSync(source)) fs.cpSync(source, path.join(standalone, to), { recursive: true });
}
