import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

import { IconBadge } from '@/components/design/IconBadge';
import { Tap } from '@/components/design/Tap';
import { callOffice, openDirections } from '@/components/open';

/** Four round shortcuts under the next Mass. */
export function QuickActions() {
  const { t } = useTranslation();
  const theme = useTheme();
  const actions = [
    { label: t('home.call'), icon: 'phone', onPress: callOffice },
    { label: t('home.directions'), icon: 'map-marker', onPress: openDirections },
    { label: t('home.intention'), icon: 'candle', onPress: () => router.push('/requests/intention') },
    { label: t('home.give'), icon: 'hand-heart', onPress: () => router.navigate('/give') },
  ];
  return (
    <View style={styles.row}>
      {actions.map((action) => (
        <Tap key={action.label} onPress={action.onPress} style={styles.action} accessibilityLabel={action.label}>
          <IconBadge icon={action.icon} size={60} color={theme.colors.primary} background={theme.colors.primaryContainer} />
          <Text variant="labelLarge" numberOfLines={2} style={styles.label}>
            {action.label}
          </Text>
        </Tap>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  action: { flex: 1, alignItems: 'center', gap: 8 },
  label: { textAlign: 'center' },
});
