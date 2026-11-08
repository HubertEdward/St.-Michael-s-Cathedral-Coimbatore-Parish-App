import { parish, pick } from '@parish/core';
import { StyleSheet, View } from 'react-native';
import { Button, Icon, Text, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { languageNames, languages, useLanguageState } from '@/i18n';
import en from '@/i18n/en';
import ta from '@/i18n/ta';

const strings = { en, ta };

/** First launch: choose a language. Every prompt is shown in each offered language, since we don't know the reader yet. */
export default function Welcome() {
  const theme = useTheme();
  const { choose } = useLanguageState();
  const onPrimary = { color: theme.colors.onPrimary };
  const names = [...new Set(languages.map((language) => pick(parish.name, language)))];
  return (
    <SafeAreaView style={[styles.page, { backgroundColor: theme.colors.primary }]}>
      <View style={styles.body}>
        <Icon source="church" size={72} color={theme.colors.onPrimary} />
        {names.map((name, index) => (
          <Text key={name} variant={index === 0 ? 'headlineMedium' : 'titleLarge'} style={[styles.center, onPrimary]}>
            {name}
          </Text>
        ))}
        <Text variant="titleMedium" style={[styles.center, onPrimary]}>
          {pick(parish.place, languages[0])}
        </Text>
        <Text variant="bodyLarge" style={[styles.center, onPrimary]}>
          {languages.map((language) => strings[language].welcome.subtitle).join('\n')}
        </Text>
        <View style={styles.buttons}>
          {languages.map((language) => (
            <Button
              key={language}
              mode="contained"
              buttonColor={theme.colors.onPrimary}
              textColor={theme.colors.primary}
              contentStyle={styles.button}
              labelStyle={styles.label}
              onPress={() => choose(language)}>
              {languageNames[language]}
            </Button>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  body: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 16 },
  center: { textAlign: 'center' },
  buttons: { width: '100%', maxWidth: 360, gap: 16, marginTop: 16 },
  button: { height: 64 },
  label: { fontSize: 22, lineHeight: 30 },
});
