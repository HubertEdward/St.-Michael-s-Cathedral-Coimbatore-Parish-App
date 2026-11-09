import { givingPurposes, type GivingPurpose } from '@parish/core';
import { StyleSheet, View } from 'react-native';
import { Icon, Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

import { IconBadge } from '@/components/design/IconBadge';
import { Tap } from '@/components/design/Tap';
import { radius } from '@/components/design/tokens';

export const purposeIcons: Record<GivingPurpose, string> = {
  parish: 'church',
  restoration: 'hammer-wrench',
  charity: 'hand-heart-outline',
};

/** Where the monthly offering goes, as three large choices. */
export function PurposePicker({ value, onChange }: { value: GivingPurpose; onChange: (purpose: GivingPurpose) => void }) {
  const { t } = useTranslation();
  const theme = useTheme();
  return (
    <View style={styles.list}>
      {givingPurposes.map((purpose) => {
        const selected = purpose === value;
        return (
          <Tap
            key={purpose}
            onPress={() => onChange(purpose)}
            accessibilityRole="radio"
            selected={selected}
            accessibilityLabel={t(`give.purposes.${purpose}`)}
            style={[
              styles.row,
              {
                backgroundColor: selected ? theme.colors.primaryContainer : theme.dark ? theme.colors.elevation.level2 : '#FFFFFF',
                borderColor: selected ? theme.colors.primary : theme.colors.outlineVariant,
              },
            ]}>
            <IconBadge
              icon={purposeIcons[purpose]}
              color={selected ? theme.colors.onPrimary : theme.colors.primary}
              background={selected ? theme.colors.primary : theme.colors.primaryContainer}
              size={44}
            />
            <View style={styles.text}>
              <Text variant="titleMedium">{t(`give.purposes.${purpose}`)}</Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                {t(`give.purposeHints.${purpose}`)}
              </Text>
            </View>
            <Icon
              source={selected ? 'radiobox-marked' : 'radiobox-blank'}
              size={24}
              color={selected ? theme.colors.primary : theme.colors.outline}
            />
          </Tap>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: radius.tile, borderWidth: 1 },
  text: { flex: 1, gap: 2 },
});
