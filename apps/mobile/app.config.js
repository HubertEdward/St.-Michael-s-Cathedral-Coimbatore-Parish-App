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
      // Speaking instead of typing, in Tamil or English, with the phone's own speech recogniser (no cost, no key).
      [
        'expo-speech-recognition',
        {
          microphonePermission: 'Allow $(PRODUCT_NAME) to hear you when you tap the microphone to speak instead of typing.',
          speechRecognitionPermission: 'Allow $(PRODUCT_NAME) to turn what you say into text, in Tamil or English.',
          // Google's on-device recogniser first, so speech can stay on the phone where it has the language.
          androidSpeechServicePackages: ['com.google.android.as', 'com.google.android.googlequicksearchbox', 'com.google.android.tts'],
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
      // Set by the demo build, which serves this app under /app (see demo/run.js).
      ...(process.env.WEB_BASE_URL && { baseUrl: process.env.WEB_BASE_URL }),
    },
  };
};
