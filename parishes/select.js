// Picks the parish an app is built for, from the PARISH environment variable.
// Used by both apps' app.config.js and metro.config.js, so the app's name,
// identifiers, icons and bundled content always come from the same folder.
const fs = require('node:fs');
const path = require('node:path');

const DEFAULT_PARISH = 'st-michaels-coimbatore';

function availableParishes() {
  return fs
    .readdirSync(__dirname, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && fs.existsSync(path.join(__dirname, entry.name, 'build.json')))
    .map((entry) => entry.name);
}

/**
 * The selected parish: its id (folder name), folder, build settings from build.json,
 * and `asset(file)`, the path of one of its assets relative to `projectRoot`.
 */
function selectedParish(projectRoot = process.cwd()) {
  const id = process.env.PARISH || DEFAULT_PARISH;
  const dir = path.join(__dirname, id);
  const buildFile = path.join(dir, 'build.json');
  if (!fs.existsSync(buildFile)) {
    throw new Error(`Unknown parish "${id}". Set PARISH to one of: ${availableParishes().join(', ')}`);
  }
  return {
    id,
    dir,
    build: JSON.parse(fs.readFileSync(buildFile, 'utf8')),
    asset: (file) => path.relative(projectRoot, path.join(dir, 'assets', file)).split(path.sep).join('/'),
  };
}

/** Points the `@parish/profile` import at the selected parish's index.ts. */
function withParishProfile(metroConfig) {
  const { id } = selectedParish();
  metroConfig.resolver.resolveRequest = (context, moduleName, platform) =>
    context.resolveRequest(context, moduleName === '@parish/profile' ? `@parish/parishes/${id}` : moduleName, platform);
  return metroConfig;
}

module.exports = { selectedParish, withParishProfile };
