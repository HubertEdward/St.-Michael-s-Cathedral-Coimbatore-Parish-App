import { router } from 'expo-router';
import { Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

import { Screen } from '@/components/Screen';
import { Display } from '@/components/design/Display';
import { GradientButton } from '@/components/design/GradientButton';
import { SuccessMark } from '@/components/design/SuccessMark';

/** The thank-you after a family registration, a join request or a new member: it now waits for the parish office. */
export function SentForApproval({ body }: { body: string }) {
  const { t } = useTranslation();
  const theme = useTheme();
  return (
    <Screen>
      <SuccessMark />
      <Display size={32} style={{ textAlign: 'center' }}>
        {t('account.sentTitle')}
      </Display>
      <Text variant="bodyLarge" style={{ textAlign: 'center', color: theme.colors.onSurfaceVariant }}>
        {body}
      </Text>
      <GradientButton label={t('account.seeFamily')} icon="home-heart" onPress={() => router.replace('/account')} />
    </Screen>
  );
}
