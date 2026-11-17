// Lets Node scripts load parish code written for the app bundler: `@parish/profile` points at the parish
// chosen with PARISH (as in apps/*/metro.config.js), and bundled pictures load as nothing.
const Module = require('node:module');
const path = require('node:path');

const parish = process.env.PARISH || 'st-michaels-coimbatore';
const profile = path.join(__dirname, '..', 'parishes', parish, 'index.ts');

const resolve = Module._resolveFilename;
Module._resolveFilename = function (request, ...rest) {
  return resolve.call(this, request === '@parish/profile' ? profile : request, ...rest);
};
for (const extension of ['.jpg', '.jpeg', '.png', '.webp']) {
  require.extensions[extension] = (module) => {
    module.exports = 0;
  };
}
