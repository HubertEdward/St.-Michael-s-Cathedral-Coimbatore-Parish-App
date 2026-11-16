import { StyleSheet, View } from 'react-native';
import { Icon, Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

import { Screen } from '@/components/Screen';
import { Panel } from '@/components/design/Panel';

/** The privacy promise in plain words, in the app's language. The full policy is docs/PRIVACY-POLICY.md. */
export default function Privacy() {
  const { t } = useTranslation();
  const theme = useTheme();
  const points = t('privacy.points', { returnObjects: true });

  return (
    <Screen>
      <Panel style={styles.panel}>
        <Text variant="bodyLarge">{t('privacy.intro')}</Text>
        {points.map((point) => (
          <View key={point} style={styles.point}>
            <Icon source="shield-check-outline" size={20} color={theme.colors.primary} />
            <Text variant="bodyMedium" style={styles.flex}>
              {point}
            </Text>
          </View>
        ))}
      </Panel>
      <Text variant="bodySmall" style={[styles.updated, { color: theme.colors.onSurfaceVariant }]}>
        {t('privacy.updated')}
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  panel: { gap: 14 },
  point: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  flex: { flex: 1 },
  updated: { textAlign: 'center' },
});
