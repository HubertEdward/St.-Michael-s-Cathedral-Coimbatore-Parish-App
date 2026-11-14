import { monthName, type Language, type Officer, type OfficerRole, type ParishGroup } from '@parish/core';
import { Linking, StyleSheet, View } from 'react-native';
import { IconButton, Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

import { IconBadge } from '@/components/design/IconBadge';
import { useLocalized } from '@/i18n';

const roleIcon: Record<OfficerRole, string> = {
  president: 'crown-outline',
  vicePresident: 'account-star-outline',
  head: 'crown-outline',
  director: 'church',
  coordinator: 'account-cog-outline',
  secretary: 'notebook-edit-outline',
  jointSecretary: 'notebook-outline',
  treasurer: 'cash-multiple',
  member: 'account-outline',
};

/** "2 Aug 2026" */
export const longDate = (date: string, language: Language) => `${Number(date.slice(8, 10))} ${monthName(date, language)} ${date.slice(0, 4)}`;

/** Someone's post in a group, how they hold it on a council, and a button to call them. */
export function OfficerRow({ officer, groups }: { officer: Officer; groups: ParishGroup[] }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const text = useLocalized();
  const represents = groups.find((g) => g.id === officer.representsId);
  const seat =
    officer.seat === 'anbiyam' ? t('groups.seat.anbiyam', { name: represents ? text(represents.name) : '' }) : officer.seat ? t(`groups.seat.${officer.seat}`) : null;
  const phone = officer.phone;

  return (
    <View style={styles.row}>
      <IconBadge icon={roleIcon[officer.role]} size={42} color={theme.colors.primary} background={theme.colors.primaryContainer} />
      <View style={styles.text}>
        <Text variant="titleMedium">{officer.name}</Text>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          {[t(`groups.role.${officer.role}`), seat].filter(Boolean).join(' · ')}
        </Text>
      </View>
      {phone && (
        <IconButton
          icon="phone"
          mode="contained-tonal"
          accessibilityLabel={t('groups.call', { name: officer.name })}
          onPress={() => void Linking.openURL(`tel:${phone.replace(/[^+0-9]/g, '')}`)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  text: { flex: 1, gap: 2 },
});
