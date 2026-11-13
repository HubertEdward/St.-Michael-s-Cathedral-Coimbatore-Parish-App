// The parishioner app, built for the parish named by PARISH (see parishes/select.js).
const { selectedParish } = require('@parish/parishes/select');

module.exports = ({ projectRoot }) => {
  const { build, asset } = selectedParish(projectRoot);
  const { mobile, brandColor } = build;
  return {
    name: mobile.name,
    slug: mobile.slug,
    version: '0.1.0',
    orientation: 'portrait',
    icon: asset('icon.png'),
    scheme: mobile.scheme,
    userInterfaceStyle: 'automatic',
    ios: {
      bundleIdentifier: mobile.bundleIdentifier,
      supportsTablet: true,
    },
    android: {
      package: mobile.bundleIdentifier,
      adaptiveIcon: {
        backgroundColor: brandColor,
        backgroundImage: asset('adaptive-background.png'),
        foregroundImage: asset('adaptive-icon.png'),
        monochromeImage: asset('monochrome-icon.png'),
      },
      predictiveBackGestureEnabled: false,
    },
    web: {
      output: 'single',
      favicon: asset('favicon.png'),
    },
    plugins: [
      'expo-router',
      'expo-localization',
      'expo-image',
      ['expo-splash-screen', { backgroundColor: brandColor, image: asset('splash-icon.png'), imageWidth: 160 }],
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
      // Set by the demo build, which serves this app under /app (see demo/run.js).
      ...(process.env.WEB_BASE_URL && { baseUrl: process.env.WEB_BASE_URL }),
    },
  };
};
