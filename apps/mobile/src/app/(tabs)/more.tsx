import type { Href } from 'expo-router';
import { router } from 'expo-router';
import { List } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

import { Screen } from '@/components/Screen';

interface Item {
  label: string;
  icon: string;
  href: Href;
}

export default function More() {
  const { t } = useTranslation();
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
        <List.Section key={section.title} title={section.title}>
          {section.items.map((item) => (
            <List.Item
              key={item.label}
              title={item.label}
              titleNumberOfLines={2}
              left={(props) => <List.Icon {...props} icon={item.icon} />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => router.push(item.href)}
            />
          ))}
        </List.Section>
      ))}
    </Screen>
  );
}
