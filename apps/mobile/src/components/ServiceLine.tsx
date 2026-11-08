import { formatTime, type Service } from '@stmichaels/core';
import { StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

import { useLanguage, useLocalized } from '@/i18n';

/** "6:30 AM · Mass · Tamil · Cemetery" — one line of the timetable. */
export function ServiceLine({ service, emphasis = false }: { service: Service; emphasis?: boolean }) {
  const { t } = useTranslation();
  const language = useLanguage();
  const text = useLocalized();
  const theme = useTheme();
  const details = [
    service.kind === 'mass' ? null : t(`service.kind.${service.kind}`),
    service.language ? t(`service.language.${service.language}`) : null,
    service.place ? text(service.place) : null,
    service.note ? text(service.note) : null,
  ].filter(Boolean);

  return (
    <View style={styles.row}>
      <Text variant={emphasis ? 'headlineSmall' : 'titleMedium'} style={[styles.time, { color: theme.colors.primary }]}>
        {formatTime(service.time, language)}
      </Text>
      {details.length > 0 && (
        <Text variant="bodyMedium" style={[styles.details, { color: theme.colors.onSurfaceVariant }]}>
          {details.join(' · ')}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' },
  time: { fontVariant: ['tabular-nums'], fontWeight: '600' },
  details: { flexShrink: 1 },
});
