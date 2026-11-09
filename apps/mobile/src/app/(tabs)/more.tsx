import type { Href } from 'expo-router';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Divider, Icon, Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

import { Screen } from '@/components/Screen';
import { Eyebrow } from '@/components/design/Eyebrow';
import { IconBadge } from '@/components/design/IconBadge';
import { Panel } from '@/components/design/Panel';
import { Tap } from '@/components/design/Tap';

interface Item {
  label: string;
  icon: string;
  href: Href;
}

export default function More() {
  const { t } = useTranslation();
  const theme = useTheme();
  const sections: { title: string; items: Item[] }[] = [
    {
      title: t('more.parish'),
      items: [
        { label: t('more.about'), icon: 'church', href: '/about' },
        { label: t('more.contact'), icon: 'map-marker-outline', href: '/contact' },
        { label: t('more.ministries'), icon: 'account-group-outline', href: '/ministries' },
        { label: t('more.roster'), icon: 'clipboard-text-clock-outline', href: '/roster' },
      ],
    },
    {
      title: t('more.faith'),
      items: [
        { label: t('more.sacraments'), icon: 'water-outline', href: '/sacraments' },
        { label: t('more.prayers'), icon: 'hands-pray', href: '/prayers' },
      ],
    },
    {
      title: t('more.requests'),
      items: [
        { label: t('more.intention'), icon: 'candle', href: '/requests/intention' },
        { label: t('more.certificate'), icon: 'file-certificate-outline', href: '/requests/certificate' },
        { label: t('more.give'), icon: 'hand-heart-outline', href: '/give' },
        { label: t('more.myRequests'), icon: 'inbox-outline', href: '/requests' },
      ],
    },
    {
      title: t('more.app'),
      items: [{ label: t('more.settings'), icon: 'translate', href: '/settings' }],
    },
  ];

  return (
    <Screen>
      {sections.map((section) => (
        <View key={section.title} style={styles.section}>
          <Eyebrow>{section.title}</Eyebrow>
          <Panel style={styles.list}>
            {section.items.map((item, index) => (
              <View key={item.label}>
                {index > 0 && <Divider />}
                <Tap onPress={() => router.push(item.href)} style={styles.row} accessibilityLabel={item.label}>
                  <IconBadge icon={item.icon} size={40} color={theme.colors.primary} background={theme.colors.primaryContainer} />
                  <Text variant="titleMedium" numberOfLines={2} style={styles.label}>
                    {item.label}
                  </Text>
                  <Icon source="chevron-right" size={22} color={theme.colors.onSurfaceVariant} />
                </Tap>
              </View>
            ))}
          </Panel>
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: { gap: 8 },
  list: { paddingVertical: 4, gap: 0 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12 },
  label: { flex: 1 },
});
