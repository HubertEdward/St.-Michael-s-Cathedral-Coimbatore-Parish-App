import { groupKinds, useGroups, type ParishGroup } from '@parish/core';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Icon, Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

import { Notice } from '@/components/Notice';
import { QueryState } from '@/components/QueryState';
import { Screen } from '@/components/Screen';
import { Panel } from '@/components/design/Panel';
import { SectionTitle } from '@/components/design/SectionTitle';
import { useLocalized } from '@/i18n';

/** The parish councils, the Anbiyams, and the ministries, associations and faith formation. */
export default function Groups() {
  const { t } = useTranslation();
  const theme = useTheme();
  const groups = useGroups();

  return (
    <Screen onRefresh={() => groups.refetch()}>
      <Notice text={t('groups.sample')} />
      <QueryState query={groups}>
        {(all) =>
          groupKinds
            .filter((kind) => all.some((g) => g.kind === kind))
            .map((kind) => (
              <View key={kind} style={styles.section}>
                <SectionTitle title={t(`groups.kind.${kind}`)} />
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                  {t(`groups.intro.${kind}`)}
                </Text>
                {all
                  .filter((g) => g.kind === kind)
                  .map((group) => (
                    <GroupCard key={group.id} group={group} />
                  ))}
              </View>
            ))
        }
      </QueryState>
    </Screen>
  );
}

function GroupCard({ group }: { group: ParishGroup }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const text = useLocalized();
  const lead = group.officers.find((o) => o.role !== 'member' && !o.pending);
  const detail = group.kind === 'anbiyam' && group.area ? text(group.area) : text(group.description);

  return (
    <Panel onPress={() => router.push(`/groups/${group.id}`)} accessibilityLabel={text(group.name)} style={styles.card}>
      <View style={styles.text}>
        <Text variant="titleMedium">{text(group.name)}</Text>
        {detail !== '' && (
          <Text variant="bodyMedium" numberOfLines={2} style={{ color: theme.colors.onSurfaceVariant }}>
            {detail}
          </Text>
        )}
        {lead && (
          <Text variant="labelLarge" style={{ color: theme.colors.primary }}>
            {t(`groups.role.${lead.role}`)}: {lead.name}
          </Text>
        )}
      </View>
      <Icon source="chevron-right" size={24} color={theme.colors.onSurfaceVariant} />
    </Panel>
  );
}

const styles = StyleSheet.create({
  section: { gap: 10 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  text: { flex: 1, gap: 4 },
});
