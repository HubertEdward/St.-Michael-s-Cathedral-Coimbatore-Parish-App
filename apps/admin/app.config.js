// The parish office web app, built for the parish named by PARISH (see parishes/select.js).
const { selectedParish } = require('@parish/parishes/select');

module.exports = ({ projectRoot }) => {
  const { build, asset } = selectedParish(projectRoot);
  const { admin } = build;
  return {
    name: admin.name,
    slug: admin.slug,
    version: '0.1.0',
    scheme: admin.scheme,
    platforms: ['web'],
    userInterfaceStyle: 'automatic',
    web: {
      output: 'single',
      favicon: asset('favicon.png'),
    },
    plugins: ['expo-router'],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
      // Set by the demo build, which serves this app under /office (see demo/run.js).
      ...(process.env.WEB_BASE_URL && { baseUrl: process.env.WEB_BASE_URL }),
    },
  };
};
