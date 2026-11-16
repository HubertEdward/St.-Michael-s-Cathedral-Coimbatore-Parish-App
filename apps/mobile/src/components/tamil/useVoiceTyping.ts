// Speaking instead of typing, in Tamil or English, with the phone's own speech recogniser
// (expo-speech-recognition, MIT; no cost and no key). The language is chosen at the microphone, apart
// from Tamil typing. It keeps listening through pauses until the person taps stop, where the phone
// allows. Words are recognised on the phone when it has offline speech for the language; otherwise
// the person is told once that speech goes to the phone's speech service before anything is sent.
// Parish and prayer words are given to the recogniser as hints, and listening stops when the field goes.
import type { Language } from '@parish/core';
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent, type ExpoSpeechRecognitionErrorCode } from 'expo-speech-recognition';
import { useEffect, useRef, useState } from 'react';
import { Alert, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useVoicePreferences } from './typingPreferences';

/** Whether this phone (or browser) has a speech recogniser at all. */
const available = (() => {
  try {
    return ExpoSpeechRecognitionModule.isRecognitionAvailable();
  } catch {
    return false;
  }
})();

const LOCALE: Record<Language, string> = { ta: 'ta-IN', en: 'en-IN' };
/** Google's on-device recogniser on Android ("Android System Intelligence"). */
const ON_DEVICE_SERVICE = 'com.google.android.as';
/** Listening through pauses needs Android 13 or later; iOS and browsers can. */
const NEW_ANDROID = Platform.OS === 'android' && Number(Platform.Version) >= 33;
const CONTINUOUS = Platform.OS !== 'android' || NEW_ANDROID;

// Words people say in intentions and messages that a recogniser might otherwise mishear.
const HINTS = [
  'Mass',
  'Anbiyam',
  'Jesus',
  'Mary',
  'Saint Michael',
  'Velankanni',
  'novena',
  'Rosary',
  'திருப்பலி',
  'அன்பியம்',
  'இயேசு',
  'மாதா',
  'புனித மிக்கேல்',
  'வேளாங்கண்ணி',
  'நவநாள்',
  'செபமாலை',
  'பங்குத்தந்தை',
];

export type VoiceProblem = 'noSpeech' | 'notAllowed' | 'unavailable' | 'network' | 'failed';

const problemFor = (code: ExpoSpeechRecognitionErrorCode): VoiceProblem | undefined => {
  switch (code) {
    case 'aborted':
      return undefined;
    case 'no-speech':
    case 'speech-timeout':
      return 'noSpeech';
    case 'not-allowed':
      return 'notAllowed';
    case 'language-not-supported':
    case 'service-not-allowed':
      return 'unavailable';
    case 'network':
      return 'network';
    default:
      return 'failed';
  }
};

/** Whether the phone can recognise this language without sending anything (Android 13+ with Google's offline speech). */
async function onDevice(locale: string): Promise<boolean> {
  if (Platform.OS !== 'android') return false;
  try {
    const { installedLocales } = await ExpoSpeechRecognitionModule.getSupportedLocales({ androidRecognitionServicePackage: ON_DEVICE_SERVICE });
    const want = locale.toLowerCase().replace('_', '-');
    return installedLocales.some((l) => l.toLowerCase().replace('_', '-') === want);
  } catch {
    return false;
  }
}

/**
 * Speaking instead of typing: `onText` gets each finished phrase. Several fields can use this, but
 * only the one that started listening takes the result.
 */
export function useVoiceTyping(onText: (text: string) => void) {
  const { t } = useTranslation();
  const prefs = useVoicePreferences();
  const [listening, setListening] = useState(false);
  const [heard, setHeard] = useState('');
  const [problem, setProblem] = useState<VoiceProblem>();
  const mine = useRef(false);

  useSpeechRecognitionEvent('result', (event) => {
    if (!mine.current) return;
    const text = event.results[0]?.transcript.trim() ?? '';
    if (event.isFinal) {
      setHeard('');
      if (text) onText(text);
    } else setHeard(text);
  });
  useSpeechRecognitionEvent('error', (event) => {
    if (mine.current) setProblem(problemFor(event.error));
  });
  useSpeechRecognitionEvent('end', () => {
    if (!mine.current) return;
    mine.current = false;
    setListening(false);
    setHeard('');
  });

  // Stop listening when the field goes away (the screen closed while listening).
  useEffect(
    () => () => {
      if (mine.current) ExpoSpeechRecognitionModule.abort();
    },
    [],
  );

  /** Ask once before speech is sent to the phone's speech service. Resolves true to go ahead. */
  const askOnline = (locale: string): Promise<boolean> => {
    if (Platform.OS === 'web') return Promise.resolve(window.confirm(t('voice.onlineAskWeb')));
    return new Promise((resolve) =>
      Alert.alert('', t('voice.onlineAsk'), [
        { text: t('voice.cancel'), style: 'cancel', onPress: () => resolve(false) },
        ...(NEW_ANDROID
          ? [
              {
                text: t('voice.download'),
                onPress: () => {
                  resolve(false);
                  ExpoSpeechRecognitionModule.androidTriggerOfflineModelDownload({ locale })
                    .then(() => Alert.alert('', t('voice.downloadStarted')))
                    .catch(() => setProblem('failed'));
                },
              },
            ]
          : []),
        { text: t('voice.continue'), onPress: () => resolve(true) },
      ]),
    );
  };

  const start = async (language: Language = prefs.language) => {
    setProblem(undefined);
    const permission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!permission.granted) {
      setProblem('notAllowed');
      return;
    }
    const locale = LOCALE[language];
    const local = await onDevice(locale);
    if (!local && !prefs.onlineOk()) {
      if (!(await askOnline(locale))) return;
      prefs.agreeOnline();
    }
    mine.current = true;
    setListening(true);
    ExpoSpeechRecognitionModule.start({
      lang: locale,
      interimResults: true,
      continuous: CONTINUOUS,
      addsPunctuation: true,
      contextualStrings: HINTS,
      ...(local ? { requiresOnDeviceRecognition: true, androidRecognitionServicePackage: ON_DEVICE_SERVICE } : {}),
      // Where it cannot listen through pauses, at least let people pause to think.
      androidIntentOptions: { EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS: 3000 },
    });
  };

  /** Listen for the other language instead, starting again if already listening. */
  const setLanguage = (language: Language) => {
    prefs.setLanguage(language);
    if (mine.current) {
      mine.current = false;
      ExpoSpeechRecognitionModule.abort();
      setListening(false);
      // Give the recogniser a moment to close before it opens again.
      setTimeout(() => void start(language), 300);
    }
  };

  return { available, listening, heard, problem, language: prefs.language, start, stop: () => ExpoSpeechRecognitionModule.stop(), setLanguage };
}
