import { officerRoles, useGroups, type Officer } from '@parish/core';
import { Stack, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Divider, Icon, Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

import { QueryState } from '@/components/QueryState';
import { Screen } from '@/components/Screen';
import { Display } from '@/components/design/Display';
import { Eyebrow } from '@/components/design/Eyebrow';
import { Panel } from '@/components/design/Panel';
import { GroupMessages } from '@/components/groups/GroupMessages';
import { OfficerRow, longDate } from '@/components/groups/OfficerRow';
import { useLanguage, useLocalized } from '@/i18n';

const byRank = (a: Officer, b: Officer) => officerRoles.indexOf(a.role) - officerRoles.indexOf(b.role);

/** One group: what it is, where it meets, and who holds its posts. */
export default function GroupDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const theme = useTheme();
  const text = useLocalized();
  const language = useLanguage();
  const groups = useGroups();

  return (
    <Screen>
      <QueryState query={groups}>
        {(all) => {
          const group = all.find((g) => g.id === id);
          if (!group) return <Text variant="bodyLarge">{t('common.notFound')}</Text>;
          const listed = group.officers.filter((o) => !o.pending);
          const officers = listed.filter((o) => o.role !== 'member').sort(byRank);
          const members = listed.filter((o) => o.role === 'member');
          const facts = [
            group.area && { icon: 'map-marker-outline', label: t('groups.area'), value: text(group.area) },
            group.meets && { icon: 'calendar-clock', label: t('groups.meets'), value: text(group.meets) },
            group.term && {
              icon: 'calendar-range',
              label: '',
              value: t('groups.term', { from: longDate(group.term.from, language), to: longDate(group.term.to, language) }),
            },
          ].filter((fact) => !!fact);

          return (
            <>
              <Stack.Screen options={{ title: t(`groups.kind.${group.kind}`) }} />
              <View style={styles.head}>
                <Display size={34}>{text(group.name)}</Display>
                {text(group.description) !== '' && (
                  <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant }}>
                    {text(group.description)}
                  </Text>
                )}
              </View>
              {facts.length > 0 && (
                <Panel style={styles.facts}>
                  {facts.map((fact) => (
                    <View key={fact.icon} style={styles.fact}>
                      <Icon source={fact.icon} size={20} color={theme.colors.primary} />
                      <Text variant="bodyMedium" style={styles.flex}>
                        {fact.label ? <Text variant="labelLarge">{fact.label}: </Text> : null}
                        {fact.value}
                      </Text>
                    </View>
                  ))}
                </Panel>
              )}
              <GroupMessages groupId={group.id} />
              <Panel style={styles.list}>
                <Eyebrow>{t('groups.officers')}</Eyebrow>
                {officers.length === 0 && (
                  <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                    {t('groups.none')}
                  </Text>
                )}
                {officers.map((officer, index) => (
                  <View key={officer.id}>
                    {index > 0 && <Divider />}
                    <OfficerRow officer={officer} groups={all} />
                  </View>
                ))}
              </Panel>
              {members.length > 0 && (
                <Panel style={styles.list}>
                  <Eyebrow>{t('groups.members')}</Eyebrow>
                  {members.map((officer, index) => (
                    <View key={officer.id}>
                      {index > 0 && <Divider />}
                      <OfficerRow officer={officer} groups={all} />
                    </View>
                  ))}
                </Panel>
              )}
            </>
          );
        }}
      </QueryState>
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { gap: 8 },
  facts: { gap: 10 },
  fact: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  flex: { flex: 1 },
  list: { gap: 4 },
});
