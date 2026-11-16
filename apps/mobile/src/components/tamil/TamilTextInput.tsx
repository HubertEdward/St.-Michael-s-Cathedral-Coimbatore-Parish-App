import { keepsEnglish, tamilCompletions } from '@parish/core';
import { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Chip, Text, TextInput, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

import { finishTamilText, rememberSpelling, setPendingFinish, spellingsFor, useTamilTyping } from './typingPreferences';
import { useVoiceTyping } from './useVoiceTyping';

interface Props {
  value: string;
  onChangeText: (text: string) => void;
  onBlur?: () => void;
  label?: string;
  placeholder?: string;
  error?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
}

/** The English-letter word at the end of the text, being typed. */
const trailingWord = (text: string) => /[A-Za-z]+$/.exec(text)?.[0];
/** A word ends when one of these is typed after it. */
const ends = /^[\s.,!?;:()]$/;

/**
 * A text field where people can type Tamil in English letters, the way they would on a phonetic
 * keyboard: "vanakkam" becomes வணக்கம் when the word ends, spelt as the real word it most likely is.
 * Words starting with a capital letter (names, places) stay in English. While a word is typed, and
 * just after it changes, a strip under the field offers other spellings, longer words it may be
 * becoming, and the English word; a switch turns Tamil typing off. Backspace straight after a word
 * changes gives back the English letters. A last word typed without a space goes in as Tamil when
 * the field is left or the screen's main button is pressed. A microphone lets people speak instead,
 * in Tamil or English, chosen while listening.
 */
export function TamilTextInput({ value, onChangeText, onBlur, label, placeholder, error, multiline, numberOfLines }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const [tamil, setTamil] = useTamilTyping();
  const [focused, setFocused] = useState(false);
  // The word just turned into Tamil, so the strip can offer to change it and backspace can undo it.
  const [last, setLast] = useState<{ before: string; latin: string; tamil: string; end: string }>();
  const latest = useRef({ value, onChangeText });
  latest.current = { value, onChangeText };
  const blurTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(blurTimer.current), []);

  /** Turn a last word still in English letters into Tamil. */
  const finish = () => {
    const done = finishTamilText(latest.current.value);
    if (done !== latest.current.value) latest.current.onChangeText(done);
  };

  // What was said goes after the text, as it is: already in Tamil script, or English.
  const voice = useVoiceTyping((said) => {
    const v = latest.current.value;
    setLast(undefined);
    latest.current.onChangeText(`${v}${v === '' || /\s$/.test(v) ? '' : ' '}${said} `);
  });

  const change = (next: string) => {
    // Backspace straight after a word turned into Tamil: give back the English letters.
    if (last && value === last.before + last.tamil + last.end && next === last.before + last.tamil) {
      setLast(undefined);
      onChangeText(last.before + last.latin);
      return;
    }
    // A word just ended: typed letter by letter then a space, or put in whole by swipe typing or a keyboard suggestion.
    const typedEnd = next.length > value.length && next.startsWith(value) && ends.test(next.slice(-1));
    const before = next.slice(0, -1);
    const word = typedEnd ? trailingWord(before) : undefined;
    if (tamil && word && !keepsEnglish(word)) {
      const spelling = spellingsFor(word)[0] ?? word;
      if (spelling !== word) {
        const start = before.slice(0, -word.length);
        setLast({ before: start, latin: word, tamil: spelling, end: next.slice(-1) });
        onChangeText(start + spelling + next.slice(-1));
        return;
      }
    }
    setLast(undefined);
    onChangeText(next);
  };

  const typing = tamil ? trailingWord(value) : undefined;
  const justChanged = tamil && last && value === last.before + last.tamil + last.end ? last : undefined;
  const latin = typing ?? justChanged?.latin;
  const spellings = latin ? spellingsFor(latin).filter((s) => s !== justChanged?.tamil) : [];
  const more = typing ? tamilCompletions(typing).filter((w) => !spellings.includes(w)) : [];

  // Replace the word being typed, or the one just changed, with the chosen spelling.
  const choose = (spelling: string) => {
    if (typing) {
      rememberSpelling(typing, spelling);
      onChangeText(`${value.slice(0, -typing.length)}${spelling} `);
    } else if (justChanged) {
      rememberSpelling(justChanged.latin, spelling);
      onChangeText(justChanged.before + spelling + justChanged.end);
    }
    setLast(undefined);
  };

  return (
    <View>
      <TextInput
        mode="outlined"
        label={label}
        placeholder={placeholder}
        value={value}
        onChangeText={change}
        onFocus={() => {
          clearTimeout(blurTimer.current);
          setFocused(true);
          setPendingFinish(finish);
        }}
        onBlur={() => {
          finish();
          // Wait a moment, so that a tap on a suggestion (which takes the focus) still lands.
          blurTimer.current = setTimeout(() => {
            setFocused(false);
            setPendingFinish(undefined);
          }, 250);
          onBlur?.();
        }}
        error={error}
        multiline={multiline}
        numberOfLines={numberOfLines}
        // The phone's own corrections would rewrite the English-letter Tamil words.
        autoCapitalize={tamil ? 'none' : 'sentences'}
        autoCorrect={!tamil}
        spellCheck={!tamil}
        autoComplete="off"
        right={
          voice.available ? (
            <TextInput.Icon
              icon={voice.listening ? 'stop-circle' : 'microphone'}
              color={voice.listening ? theme.colors.error : theme.colors.primary}
              accessibilityLabel={voice.listening ? t('voice.stop') : t('voice.start')}
              onPress={() => (voice.listening ? voice.stop() : void voice.start())}
            />
          ) : undefined
        }
      />
      {voice.listening && (
        <View style={styles.strip}>
          <Text variant="bodyMedium" numberOfLines={2} style={[styles.hint, { color: theme.colors.primary }]}>
            {voice.heard || t('voice.listening')}
          </Text>
          {(['ta', 'en'] as const).map((language) => (
            <Chip
              key={language}
              compact
              selected={voice.language === language}
              mode={voice.language === language ? 'flat' : 'outlined'}
              accessibilityLabel={`${t('voice.language')}: ${language === 'ta' ? 'தமிழ்' : 'English'}`}
              onPress={() => voice.setLanguage(language)}>
              {language === 'ta' ? 'தமிழ்' : 'English'}
            </Chip>
          ))}
        </View>
      )}
      {voice.problem && (
        <Text variant="bodyMedium" style={[styles.voice, { color: theme.colors.error }]}>
          {t(`voice.${voice.problem}`)}
        </Text>
      )}
      {focused && !voice.listening && (
        <View style={styles.strip}>
          <Chip
            compact
            icon={tamil ? 'check' : undefined}
            mode={tamil ? 'flat' : 'outlined'}
            selected={tamil}
            onPress={() => setTamil(!tamil)}
            accessibilityLabel={t('typing.switch')}
            style={tamil ? { backgroundColor: theme.colors.primaryContainer } : undefined}>
            {t('typing.tamil')}
          </Chip>
          {latin ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="always" contentContainerStyle={styles.chips}>
              {spellings.map((spelling, index) => (
                <Chip key={spelling} compact mode={index === 0 && typing ? 'flat' : 'outlined'} onPress={() => choose(spelling)}>
                  {spelling}
                </Chip>
              ))}
              {more.map((word) => (
                <Chip key={`more-${word}`} compact mode="outlined" onPress={() => choose(word)}>
                  {word}
                </Chip>
              ))}
              <Chip compact mode="outlined" icon="alphabetical" accessibilityLabel={`${t('typing.keepEnglish')}: ${latin}`} onPress={() => choose(latin)}>
                {latin}
              </Chip>
            </ScrollView>
          ) : (
            <Text variant="bodySmall" style={[styles.hint, { color: theme.colors.onSurfaceVariant }]}>
              {tamil ? t('typing.hint') : t('typing.hintOff')}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  strip: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 6 },
  chips: { gap: 6, alignItems: 'center' },
  hint: { flex: 1 },
  voice: { paddingTop: 6 },
});
