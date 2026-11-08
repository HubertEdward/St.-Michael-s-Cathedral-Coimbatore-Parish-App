// Builds the clickable demo and serves it: the parishioner app under /app, the
// office app under /office, and demo/index.html at / showing both side by side.
// One origin means both apps share the demo data in the browser's localStorage.
//
//   npm run demo                 build, then serve on http://localhost:8095
//   npm run demo -- --no-build   serve the last build
//   PARISH=<id> PORT=<n> npm run demo
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');

const { selectedParish } = require('../parishes/select');

const root = path.resolve(__dirname, '..');
const out = path.join(root, 'dist', 'demo');
const port = Number(process.env.PORT) || 8095;
const apps = { app: 'mobile', office: 'admin' };

function build() {
  const parish = selectedParish();
  fs.rmSync(out, { recursive: true, force: true });
  for (const [base, app] of Object.entries(apps)) {
    console.log(`\nBuilding the ${app} app for ${parish.id} under /${base} …`);
    const result = spawnSync('npx', ['expo', 'export', '--platform', 'web', '--output-dir', `../../dist/demo/${base}`], {
      cwd: path.join(root, 'apps', app),
      env: { ...process.env, WEB_BASE_URL: `/${base}` },
      stdio: 'inherit',
      shell: true,
    });
    if (result.status !== 0) process.exit(result.status ?? 1);
  }
  const page = fs
    .readFileSync(path.join(__dirname, 'index.html'), 'utf8')
    .replaceAll('{{APP_NAME}}', parish.build.mobile.name)
    .replaceAll('{{BRAND_COLOR}}', parish.build.brandColor)
    .replaceAll('{{PARISH_ID}}', parish.id);
  fs.writeFileSync(path.join(out, 'index.html'), page);
}

const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.map': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.ttf': 'font/ttf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

function isFile(file) {
  try {
    return fs.statSync(file).isFile();
  } catch {
    return false;
  }
}

// Each app is a single-page app: any path under its base that is not a file gets its index.html.
function resolveFile(urlPath) {
  const file = path.join(out, path.normalize(urlPath));
  if (!file.startsWith(out)) return null;
  if (isFile(file)) return file;
  const base = Object.keys(apps).find((b) => urlPath === `/${b}` || urlPath.startsWith(`/${b}/`));
  return path.join(out, base ?? '', 'index.html');
}

function serve() {
  if (!isFile(path.join(out, 'index.html'))) {
    console.error('No demo build found. Run `npm run demo` without --no-build first.');
    process.exit(1);
  }
  http
    .createServer((req, res) => {
      let urlPath;
      try {
        urlPath = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
      } catch {
        res.writeHead(400).end();
        return;
      }
      const file = resolveFile(urlPath);
      if (!file) {
        res.writeHead(403).end();
        return;
      }
      res.writeHead(200, { 'Content-Type': types[path.extname(file)] ?? 'application/octet-stream', 'Cache-Control': 'no-cache' });
      fs.createReadStream(file).pipe(res);
    })
    .listen(port, () => {
      const lan = Object.values(os.networkInterfaces())
        .flat()
        .find((i) => i && i.family === 'IPv4' && !i.internal)?.address;
      console.log(`\nDemo running:  http://localhost:${port}`);
      if (lan) {
        console.log(`On a phone on the same Wi-Fi:  http://${lan}:${port}/app/`);
        console.log('  (a phone keeps its own demo data; side-by-side sharing works within one browser)');
      }
      console.log('Press Ctrl+C to stop.');
    });
}

if (!process.argv.includes('--no-build')) build();
serve();
