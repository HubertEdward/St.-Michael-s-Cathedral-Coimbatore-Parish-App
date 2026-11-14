import type { FamilyStatus } from '@parish/core';
import { StyleSheet, View } from 'react-native';
import { Icon, Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

const look: Record<FamilyStatus, { icon: string; color: string; background: string }> = {
  pending: { icon: 'clock-outline', color: '#8A5A00', background: 'rgba(226,184,92,0.22)' },
  approved: { icon: 'check-circle', color: '#1F7A4D', background: 'rgba(62,148,121,0.18)' },
  declined: { icon: 'close-circle', color: '#B3261E', background: 'rgba(179,38,30,0.14)' },
  removed: { icon: 'home-export-outline', color: '#5F5A54', background: 'rgba(95,90,84,0.16)' },
};

/** "Awaiting approval" / "Approved" / "Not approved" / "Left the parish", as a small coloured pill. */
export function MembershipPill({ status, onDark = false }: { status: FamilyStatus; onDark?: boolean }) {
  const { t } = useTranslation();
  const { icon, color, background } = look[status];
  const tint = onDark ? '#FFFFFF' : color;
  return (
    <View style={[styles.pill, { backgroundColor: onDark ? 'rgba(255,255,255,0.18)' : background }]}>
      <Icon source={icon} size={14} color={tint} />
      <Text variant="labelMedium" style={{ color: tint }}>
        {t(`family.status.${status}`)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, alignSelf: 'flex-start' },
});
