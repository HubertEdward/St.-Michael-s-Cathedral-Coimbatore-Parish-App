import { churchPhotos, parish } from '@parish/core';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import type { Href } from 'expo-router';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Icon, Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

import { Screen } from '@/components/Screen';
import { AccountCard } from '@/components/family/AccountCard';
import { Display } from '@/components/design/Display';
import { Eyebrow } from '@/components/design/Eyebrow';
import { Tap } from '@/components/design/Tap';
import { gold, photoScrim, radius } from '@/components/design/tokens';
import { languageNames, languages, useLanguage, useLanguageState, useLocalized } from '@/i18n';

interface Item {
  label: string;
  icon: string;
  href: Href;
  colors: readonly [string, string];
}

const crimsonTile = ['#7A1626', '#C2364C'] as const;
const blueTile = ['#1E3A66', '#4A72B0'] as const;
const goldTile = ['#7A5A10', '#D1A440'] as const;
const greenTile = ['#1F5A4A', '#3E9479'] as const;

/** Everything else, as a parish card and a grid of colourful tiles. */
export default function More() {
  const { t } = useTranslation();
  const sections: { title: string; items: Item[] }[] = [
    {
      title: t('more.parish'),
      items: [
        { label: t('more.about'), icon: 'church', href: '/about', colors: crimsonTile },
        { label: t('more.contact'), icon: 'map-marker-radius', href: '/contact', colors: blueTile },
        { label: t('more.news'), icon: 'bullhorn-variant', href: '/news', colors: greenTile },
        { label: t('more.ministries'), icon: 'account-group', href: '/groups', colors: goldTile },
        { label: t('messages.title'), icon: 'bell-outline', href: '/messages', colors: goldTile },
        { label: t('more.roster'), icon: 'clipboard-text-clock', href: '/roster', colors: blueTile },
        { label: t('more.sacraments'), icon: 'water', href: '/sacraments', colors: crimsonTile },
      ],
    },
    {
      title: t('more.requests'),
      items: [
        { label: t('more.intention'), icon: 'candle', href: '/requests/intention', colors: goldTile },
        { label: t('more.certificate'), icon: 'file-certificate', href: '/requests/certificate', colors: greenTile },
        { label: t('more.give'), icon: 'hand-heart', href: '/give', colors: crimsonTile },
        { label: t('more.myRequests'), icon: 'inbox-full', href: '/requests', colors: blueTile },
      ],
    },
  ];

  return (
    <Screen title={t('tabs.more')}>
      <AccountCard />
      <ParishCard />
      {sections.map((section) => (
        <View key={section.title} style={styles.section}>
          <Eyebrow>{section.title}</Eyebrow>
          <View style={styles.grid}>
            {section.items.map((item) => (
              <Tile key={item.label} item={item} />
            ))}
          </View>
        </View>
      ))}
      <SettingsRow />
    </Screen>
  );
}

function ParishCard() {
  const text = useLocalized();
  return (
    <Tap onPress={() => router.push('/about')} style={styles.parish} accessibilityLabel={text(parish.name)}>
      <Image source={churchPhotos[0].source} contentFit="cover" style={StyleSheet.absoluteFill} />
      <LinearGradient colors={photoScrim} locations={[0, 0.2, 1]} style={StyleSheet.absoluteFill} />
      <View style={styles.parishText}>
        <Display size={30} color="#FFFFFF">
          {text(parish.name)}
        </Display>
        <Text variant="bodyMedium" style={styles.soft}>
          {text(parish.diocese)}
        </Text>
      </View>
      <Image source={parish.images.patron.source} contentFit="cover" contentPosition="top" style={styles.avatar} />
    </Tap>
  );
}

function Tile({ item }: { item: Item }) {
  const theme = useTheme();
  return (
    <Tap
      onPress={() => router.push(item.href)}
      accessibilityLabel={item.label}
      style={[styles.tile, { backgroundColor: theme.dark ? theme.colors.elevation.level2 : '#FFFFFF', borderColor: theme.colors.outlineVariant }]}>
      <LinearGradient colors={item.colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.tileIcon}>
        <Icon source={item.icon} size={24} color="#FFFFFF" />
      </LinearGradient>
      <Text variant="titleSmall" numberOfLines={2} style={styles.tileLabel}>
        {item.label}
      </Text>
    </Tap>
  );
}

function SettingsRow() {
  const { t } = useTranslation();
  const theme = useTheme();
  const language = useLanguage();
  const { choose } = useLanguageState();
  return (
    <View style={[styles.settings, { backgroundColor: theme.dark ? theme.colors.elevation.level2 : '#FFFFFF', borderColor: theme.colors.outlineVariant }]}>
      <View style={styles.settingsHead}>
        <Icon source="translate" size={22} color={theme.colors.primary} />
        <Text variant="titleMedium" style={styles.flex}>
          {t('settings.language')}
        </Text>
        <Tap onPress={() => router.push('/settings')} accessibilityLabel={t('more.settings')} style={styles.gear}>
          <Icon source="cog-outline" size={22} color={theme.colors.onSurfaceVariant} />
        </Tap>
      </View>
      {languages.length > 1 && (
        <View style={[styles.segment, { backgroundColor: theme.colors.surfaceVariant }]}>
          {languages.map((l) => {
            const active = l === language;
            return (
              <Tap
                key={l}
                onPress={() => void choose(l)}
                accessibilityRole="radio"
                selected={active}
                accessibilityLabel={languageNames[l]}
                style={[styles.segmentItem, active && { backgroundColor: theme.colors.primary }]}>
                <Text variant="titleMedium" style={{ color: active ? theme.colors.onPrimary : theme.colors.onSurfaceVariant }}>
                  {languageNames[l]}
                </Text>
              </Tap>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  parish: { height: 190, borderRadius: radius.card, overflow: 'hidden', justifyContent: 'flex-end', padding: 18 },
  parishText: { gap: 2, paddingRight: 72 },
  soft: { color: 'rgba(255,255,255,0.85)' },
  avatar: { position: 'absolute', right: 18, bottom: 18, width: 56, height: 56, borderRadius: 28, borderWidth: 2, borderColor: gold },
  tile: {
    flexGrow: 1,
    flexBasis: '45%',
    minHeight: 112,
    borderRadius: radius.tile,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
    gap: 12,
    justifyContent: 'space-between',
    shadowColor: '#3D0710',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  tileIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  tileLabel: { lineHeight: 20 },
  settings: { borderRadius: radius.card, borderWidth: StyleSheet.hairlineWidth, padding: 16, gap: 14 },
  settingsHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  flex: { flex: 1 },
  gear: { padding: 6 },
  segment: { flexDirection: 'row', borderRadius: 999, padding: 4, gap: 4 },
  segmentItem: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 999 },
});
