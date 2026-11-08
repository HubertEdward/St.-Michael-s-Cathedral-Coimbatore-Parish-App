import { parish, useResetDemoData, type Language } from '@parish/core';
import Constants from 'expo-constants';
import { useState } from 'react';
import { Button, Card, SegmentedButtons, Snackbar, Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

import { Screen } from '@/components/Screen';
import { languageNames, languages, useLanguage, useLanguageState, useLocalized } from '@/i18n';

export default function Settings() {
  const { t } = useTranslation();
  const text = useLocalized();
  const language = useLanguage();
  const { choose } = useLanguageState();
  const reset = useResetDemoData();
  const [done, setDone] = useState(false);

  return (
    <Screen>
      {languages.length > 1 && (
        <>
          <Text variant="titleMedium">{t('settings.language')}</Text>
          <SegmentedButtons
            value={language}
            onValueChange={(value) => choose(value as Language)}
            buttons={languages.map((code) => ({ value: code, label: languageNames[code] }))}
          />
        </>
      )}
      <Card mode="outlined">
        <Card.Title title={t('settings.about')} titleVariant="titleMedium" />
        <Card.Content style={{ gap: 8 }}>
          <Text variant="bodyMedium">{t('settings.aboutText', { name: text(parish.name) })}</Text>
          <Text variant="bodySmall">{t('settings.version', { version: Constants.expoConfig?.version ?? '' })}</Text>
        </Card.Content>
      </Card>
      <Button
        mode="outlined"
        icon="restore"
        loading={reset.isPending}
        onPress={() => reset.mutate(undefined, { onSuccess: () => setDone(true) })}>
        {t('settings.resetDemo')}
      </Button>
      <Snackbar visible={done} onDismiss={() => setDone(false)} duration={3000}>
        {t('settings.resetDone')}
      </Snackbar>
    </Screen>
  );
}
