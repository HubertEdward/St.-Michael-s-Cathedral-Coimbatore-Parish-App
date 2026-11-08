import { parish } from '@stmichaels/core';
import { StyleSheet, View } from 'react-native';
import { Button, Icon, Text, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useLanguageState } from '@/i18n';
import en from '@/i18n/en';
import ta from '@/i18n/ta';

/** First launch: choose Tamil or English. Both prompts are shown, since we don't know the reader yet. */
export default function Welcome() {
  const theme = useTheme();
  const { choose } = useLanguageState();
  return (
    <SafeAreaView style={[styles.page, { backgroundColor: theme.colors.primary }]}>
      <View style={styles.body}>
        <Icon source="church" size={72} color={theme.colors.onPrimary} />
        <Text variant="headlineMedium" style={[styles.center, { color: theme.colors.onPrimary }]}>
          {parish.name.ta}
        </Text>
        <Text variant="titleLarge" style={[styles.center, { color: theme.colors.onPrimary }]}>
          {parish.name.en}, {parish.place.en}
        </Text>
        <Text variant="bodyLarge" style={[styles.center, { color: theme.colors.onPrimary }]}>
          {ta.welcome.subtitle}
          {'\n'}
          {en.welcome.subtitle}
        </Text>
        <View style={styles.buttons}>
          <Button
            mode="contained"
            buttonColor={theme.colors.onPrimary}
            textColor={theme.colors.primary}
            contentStyle={styles.button}
            labelStyle={styles.label}
            onPress={() => choose('ta')}>
            தமிழ்
          </Button>
          <Button
            mode="contained"
            buttonColor={theme.colors.onPrimary}
            textColor={theme.colors.primary}
            contentStyle={styles.button}
            labelStyle={styles.label}
            onPress={() => choose('en')}>
            English
          </Button>
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
