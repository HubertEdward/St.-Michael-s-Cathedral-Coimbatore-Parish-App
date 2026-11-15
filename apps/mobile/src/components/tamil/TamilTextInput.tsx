import { keepsEnglish, tamilSpellings } from '@parish/core';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Chip, Text, TextInput, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

import { pickedSpelling, rememberSpelling, useTamilTyping } from './typingPreferences';
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

/** The spellings to offer for a word: one picked before comes first. */
function spellingsFor(latin: string): string[] {
  const picked = pickedSpelling(latin);
  return [...new Set([...(picked ? [picked] : []), ...tamilSpellings(latin)])].slice(0, 4);
}

/**
 * A text field where people can type Tamil in English letters, the way they would on a phonetic
 * keyboard: "vanakkam" becomes வணக்கம் when the word ends. Words starting with a capital letter
 * (names, places) stay in English. While a word is typed, and just after it changes, a strip under
 * the field offers other spellings and the English word; a switch turns Tamil typing off. A microphone
 * lets people speak instead, in Tamil or English, following the same switch.
 */
export function TamilTextInput({ value, onChangeText, onBlur, label, placeholder, error, multiline, numberOfLines }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const [tamil, setTamil] = useTamilTyping();
  const [focused, setFocused] = useState(false);
  // The word just turned into Tamil, so the strip can offer to change it back.
  const [last, setLast] = useState<{ latin: string; tamil: string; end: string }>();
  // What was said goes after the text, as it is: already in Tamil script, or English.
  const voice = useVoiceTyping((said) => {
    setLast(undefined);
    onChangeText(`${value}${value === '' || /\s$/.test(value) ? '' : ' '}${said} `);
  });

  const change = (next: string) => {
    // A word just ended: typed letter by letter then a space, or put in whole by swipe typing or a keyboard suggestion.
    const typedEnd = next.length > value.length && next.startsWith(value) && ends.test(next.slice(-1));
    const before = next.slice(0, -1);
    const word = typedEnd ? trailingWord(before) : undefined;
    if (tamil && word && !keepsEnglish(word)) {
      const spelling = spellingsFor(word)[0] ?? word;
      if (spelling !== word) {
        const end = next.slice(-1);
        setLast({ latin: word, tamil: spelling, end });
        onChangeText(before.slice(0, -word.length) + spelling + end);
        return;
      }
    }
    setLast(undefined);
    onChangeText(next);
  };

  const typing = tamil ? trailingWord(value) : undefined;
  const justChanged = tamil && last && value.endsWith(last.tamil + last.end) ? last : undefined;

  // Replace the word being typed, or the one just changed, with the chosen spelling.
  const choose = (spelling: string) => {
    if (typing) {
      rememberSpelling(typing, spelling);
      onChangeText(`${value.slice(0, -typing.length)}${spelling} `);
    } else if (justChanged) {
      rememberSpelling(justChanged.latin, spelling);
      onChangeText(value.slice(0, -(justChanged.tamil.length + 1)) + spelling + justChanged.end);
      setLast(undefined);
    }
  };

  const latin = typing ?? justChanged?.latin;
  const spellings = latin ? spellingsFor(latin).filter((s) => s !== justChanged?.tamil) : [];

  return (
    <View>
      <TextInput
        mode="outlined"
        label={label}
        placeholder={placeholder}
        value={value}
        onChangeText={change}
        onFocus={() => setFocused(true)}
        onBlur={() => {
          // Wait a moment, so that a tap on a suggestion (which takes the focus) still lands.
          setTimeout(() => setFocused(false), 250);
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
              onPress={() => (voice.listening ? voice.stop() : void voice.start(tamil))}
            />
          ) : undefined
        }
      />
      {(voice.listening || voice.problem) && (
        <Text variant="bodyMedium" style={[styles.voice, { color: voice.problem ? theme.colors.error : theme.colors.primary }]}>
          {voice.problem ? t(`voice.${voice.problem}`) : voice.heard || (tamil ? t('voice.listeningTamil') : t('voice.listeningEnglish'))}
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
              <Chip compact mode="outlined" icon="alphabetical" onPress={() => choose(latin)}>
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
