import type { RosaryMysteries } from '@parish/core';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Button, Icon, Text } from 'react-native-paper';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

import { Display } from '@/components/design/Display';
import { Eyebrow } from '@/components/design/Eyebrow';
import { gold, radius } from '@/components/design/tokens';
import { useLocalized } from '@/i18n';

const BEADS = 10;

const tick = () => Haptics.selectionAsync().catch(() => undefined);
const thud = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);

/**
 * Pray the day's Rosary bead by bead: tap anywhere on the card for each Hail Mary.
 * After ten the next mystery comes up; after the fifth decade the Rosary is complete.
 */
export function RosaryCounter({ rosary }: { rosary: RosaryMysteries }) {
  const { t } = useTranslation();
  const text = useLocalized();
  const [decade, setDecade] = useState(0);
  const [bead, setBead] = useState(0);
  const done = decade >= rosary.mysteries.length;

  const pray = () => {
    if (done) return;
    if (bead + 1 < BEADS) {
      void tick();
      setBead(bead + 1);
    } else {
      void thud();
      setBead(0);
      setDecade(decade + 1);
    }
  };

  const restart = () => {
    setDecade(0);
    setBead(0);
  };

  return (
    <View style={styles.card}>
      <LinearGradient colors={['#14284A', '#2E4F86', '#5B7FB8']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      <View style={styles.header}>
        <Eyebrow color={gold}>{t('prayers.rosaryToday', { name: text(rosary.name) })}</Eyebrow>
        {(decade > 0 || bead > 0) && (
          <Button compact textColor="#FFFFFF" icon="restart" onPress={restart}>
            {t('rosary.restart')}
          </Button>
        )}
      </View>

      {done ? (
        <Animated.View entering={ZoomIn.springify()} style={styles.center}>
          <Icon source="check-decagram" size={56} color={gold} />
          <Display size={30} color="#FFFFFF" style={styles.centerText}>
            {t('rosary.complete')}
          </Display>
        </Animated.View>
      ) : (
        <Pressable onPress={pray} accessibilityRole="button" accessibilityLabel={t('rosary.tapHint')}>
          <Animated.View key={decade} entering={FadeIn.duration(400)} style={styles.body}>
          <Text variant="labelLarge" style={styles.soft}>
            {t('rosary.decade', { number: decade + 1, total: rosary.mysteries.length })}
          </Text>
          <Display size={30} color="#FFFFFF">
            {rosary.mysteries[decade]}
          </Display>
          <View style={styles.beads}>
            {Array.from({ length: BEADS }, (_, index) =>
              index < bead ? (
                <Animated.View key={index} entering={ZoomIn.springify().damping(10)} style={[styles.bead, styles.beadDone]} />
              ) : (
                <View key={index} style={styles.bead} />
              ),
            )}
          </View>
          <Text variant="bodyMedium" style={styles.soft}>
            {t('rosary.tapHint')}
          </Text>
          </Animated.View>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.card, overflow: 'hidden', padding: 20, gap: 12, minHeight: 260 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 36 },
  body: { gap: 12 },
  center: { alignItems: 'center', gap: 10, paddingVertical: 24 },
  centerText: { textAlign: 'center' },
  beads: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  bead: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: 'rgba(255,255,255,0.45)' },
  beadDone: { backgroundColor: gold, borderColor: gold },
  soft: { color: 'rgba(255,255,255,0.8)' },
});
