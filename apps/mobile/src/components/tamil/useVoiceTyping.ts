import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent, type ExpoSpeechRecognitionErrorCode } from 'expo-speech-recognition';
import { useState } from 'react';

/** Whether this phone (or browser) has a speech recogniser at all. */
const available = (() => {
  try {
    return ExpoSpeechRecognitionModule.isRecognitionAvailable();
  } catch {
    return false;
  }
})();

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

/**
 * Speaking instead of typing, with the phone's own speech recogniser: in Tamil (ta-IN) or English
 * (en-IN). Listens until the person pauses; \`onText\` gets what they said. Several fields can use
 * this, but only the one that started listening takes the result.
 */
export function useVoiceTyping(onText: (text: string) => void) {
  const [listening, setListening] = useState(false);
  const [heard, setHeard] = useState('');
  const [problem, setProblem] = useState<VoiceProblem>();

  useSpeechRecognitionEvent('result', (event) => {
    if (!listening) return;
    const text = event.results[0]?.transcript.trim() ?? '';
    if (event.isFinal) {
      setHeard('');
      if (text) onText(text);
    } else setHeard(text);
  });
  useSpeechRecognitionEvent('error', (event) => {
    if (listening) setProblem(problemFor(event.error));
  });
  useSpeechRecognitionEvent('end', () => {
    if (!listening) return;
    setListening(false);
    setHeard('');
  });

  const start = async (tamil: boolean) => {
    setProblem(undefined);
    const permission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!permission.granted) {
      setProblem('notAllowed');
      return;
    }
    setListening(true);
    ExpoSpeechRecognitionModule.start({ lang: tamil ? 'ta-IN' : 'en-IN', interimResults: true, continuous: false });
  };

  return { available, listening, heard, problem, start, stop: () => ExpoSpeechRecognitionModule.stop() };
}
