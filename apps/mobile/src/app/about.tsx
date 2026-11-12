import { churchPhotos, clergy, formatDayOfYear, history, parish } from '@parish/core';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Divider, Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

import { Display } from '@/components/design/Display';
import { Eyebrow } from '@/components/design/Eyebrow';
import { IconBadge } from '@/components/design/IconBadge';
import { Panel } from '@/components/design/Panel';
import { ParallaxScreen } from '@/components/design/ParallaxScreen';
import { radius } from '@/components/design/tokens';
import { useLanguage, useLocalized } from '@/i18n';

export default function About() {
  const { t } = useTranslation();
  const theme = useTheme();
  const text = useLocalized();
  const language = useLanguage();
  const gallery = [...churchPhotos, ...(parish.images.night ? [parish.images.night] : [])];
  const credits = [...gallery, parish.images.patron].flatMap((image) => (image.credit ? [text(image.credit)] : []));

  return (
    <ParallaxScreen back images={churchPhotos.map((p) => p.source)} imagePosition="top" height={420} title={text(parish.name)} subtitle={text(parish.diocese)}>
      <Panel onPress={parish.patronPrayer ? () => router.push({ pathname: '/prayers/[id]', params: { id: parish.patronPrayer! } }) : undefined} style={styles.patron}>
        <Image source={parish.images.patron.source} contentFit="cover" contentPosition="top" style={styles.patronImage} />
        <View style={styles.patronText}>
          <Eyebrow>{t('about.patron')}</Eyebrow>
          <Display size={24}>{text(parish.feast.name)}</Display>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            {t('about.feast', { date: formatDayOfYear(parish.feast.month, parish.feast.day, language) })}
          </Text>
        </View>
      </Panel>

      <Panel>
        <Eyebrow>{t('about.clergy')}</Eyebrow>
        {clergy.map((member, index) => (
          <View key={member.role}>
            {index > 0 && <Divider />}
            <View style={styles.person}>
              <IconBadge icon="account-tie" size={44} color={theme.colors.primary} background={theme.colors.primaryContainer} />
              <View style={styles.flex}>
                <Text variant="titleMedium">{member.name ?? t('about.toBeConfirmed')}</Text>
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                  {member.title ? text(member.title) : t(`about.role.${member.role}`)}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </Panel>

      {parish.images.church.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bleed} contentContainerStyle={styles.gallery}>
          {gallery.map((photo, index) => (
            <Image
              key={index}
              source={photo.source}
              contentFit="cover"
              transition={300}
              style={[styles.photo, photo === parish.images.night && styles.panorama]}
            />
          ))}
        </ScrollView>
      )}

      <Display size={30}>{text(history.title)}</Display>
      {history.paragraphs.map((paragraph, index) => (
        <Text key={index} variant="bodyLarge" style={styles.paragraph}>
          {text(paragraph)}
        </Text>
      ))}

      {credits.length > 0 && (
        <View style={styles.credits}>
          <Eyebrow>{t('about.credits')}</Eyebrow>
          {credits.map((credit) => (
            <Text key={credit} variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              {credit}
            </Text>
          ))}
        </View>
      )}
    </ParallaxScreen>
  );
}

const styles = StyleSheet.create({
  patron: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  patronImage: { width: 96, height: 128, borderRadius: radius.tile },
  patronText: { flex: 1, gap: 4 },
  person: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 10 },
  flex: { flex: 1 },
  paragraph: { lineHeight: 30 },
  credits: { gap: 4, marginTop: 8 },
  bleed: { marginHorizontal: -16 },
  gallery: { paddingHorizontal: 16, gap: 12 },
  photo: { width: 200, height: 260, borderRadius: radius.card },
  panorama: { width: 520 },
});
