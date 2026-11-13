import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Icon, Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

import { Tap } from '@/components/design/Tap';
import { maxTextScale } from '@/components/design/tokens';
import { callOffice, openDirections } from '@/components/open';

/** Four shortcuts as jewel-coloured round tiles. */
export function QuickActions() {
  const { t } = useTranslation();
  const actions = [
    { label: t('home.call'), icon: 'phone', colors: ['#7A1626', '#C2364C'] as const, onPress: callOffice },
    { label: t('home.directions'), icon: 'map-marker-radius', colors: ['#1E3A66', '#4A72B0'] as const, onPress: openDirections },
    { label: t('home.intention'), icon: 'candle', colors: ['#7A5A10', '#D1A440'] as const, onPress: () => router.push('/requests/intention') },
    { label: t('home.news'), icon: 'bullhorn-variant', colors: ['#1F5A4A', '#3E9479'] as const, onPress: () => router.push('/news') },
  ];
  return (
    <View style={styles.row}>
      {actions.map((action) => (
        <Tap key={action.label} onPress={action.onPress} style={styles.action} accessibilityLabel={action.label}>
          <LinearGradient colors={action.colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.tile}>
            <Icon source={action.icon} size={28} color="#FFFFFF" />
          </LinearGradient>
          <Text variant="labelLarge" numberOfLines={2} maxFontSizeMultiplier={maxTextScale.label} style={styles.label}>
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
  tile: {
    width: 62,
    height: 62,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
  },
  label: { textAlign: 'center' },
});
