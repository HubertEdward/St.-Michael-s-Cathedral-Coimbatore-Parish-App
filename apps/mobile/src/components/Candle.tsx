import AsyncStorage from '@react-native-async-storage/async-storage';
import { parish } from '@parish/core';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
  ZoomIn,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

import { Burst } from './design/Burst';
import { Display } from './design/Display';
import { Eyebrow } from './design/Eyebrow';
import { GradientButton } from './design/GradientButton';
import { gold, radius } from './design/tokens';
import { useLanguage } from '@/i18n';

const KEY = `${parish.id}.candle`;
const BURN_MS = 24 * 3_600_000;

/**
 * Light a candle for your intentions: tap, and a flame catches and flickers for a day.
 * A private act of devotion; nothing leaves the phone.
 */
export function Candle() {
  const { t } = useTranslation();
  const language = useLanguage();
  const [litAt, setLitAt] = useState<number | null>(null);
  const [justLit, setJustLit] = useState(false);
  const lit = litAt !== null && Date.now() - litAt < BURN_MS;

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((saved) => setLitAt(saved ? Number(saved) : null))
      .catch(() => undefined);
  }, []);

  const light = () => {
    const now = Date.now();
    setLitAt(now);
    setJustLit(true);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
    void AsyncStorage.setItem(KEY, String(now)).catch(() => undefined);
  };

  const until = litAt
    ? new Date(litAt + BURN_MS).toLocaleTimeString(language === 'ta' ? 'ta-IN' : 'en-IN', { hour: 'numeric', minute: '2-digit', timeZone: parish.timeZone })
    : '';

  return (
    <View style={styles.card}>
      <LinearGradient colors={['#120507', '#2A0C10', '#3D1218']} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={StyleSheet.absoluteFill} />
      <View style={styles.scene}>
        {lit && <Glow />}
        {justLit && <Burst size={180} />}
        <View style={styles.candleColumn}>
          {lit ? <Animated.View entering={ZoomIn.springify().damping(9)}><Flame /></Animated.View> : <View style={styles.flameSpace} />}
          <View style={styles.wick} />
          <LinearGradient colors={['#FFF8EA', '#F1E2C2', '#D9C49A']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.wax} />
        </View>
      </View>
      <View style={styles.text}>
        <Eyebrow color={gold}>{t('candle.eyebrow')}</Eyebrow>
        <Display size={28} color="#FFFFFF">
          {lit ? t('candle.litTitle') : t('candle.title')}
        </Display>
        <Text variant="bodyMedium" style={styles.soft}>
          {lit ? t('candle.litBody', { time: until }) : t('candle.body')}
        </Text>
        {!lit && <GradientButton label={t('candle.light')} icon="fire" onPress={light} />}
      </View>
    </View>
  );
}

function Flame() {
  const flicker = useSharedValue(0);
  useEffect(() => {
    flicker.set(
      withRepeat(
        withSequence(withTiming(1, { duration: 180 }), withTiming(0.35, { duration: 140 }), withTiming(0.8, { duration: 220 }), withTiming(0, { duration: 260 })),
        -1,
      ),
    );
  }, [flicker]);
  const style = useAnimatedStyle(() => ({
    transform: [
      { scaleY: interpolate(flicker.get(), [0, 1], [0.92, 1.1]) },
      { scaleX: interpolate(flicker.get(), [0, 1], [1.04, 0.94]) },
      { rotate: `${interpolate(flicker.get(), [0, 1], [-3, 3])}deg` },
    ],
  }));
  return (
    <Animated.View style={[styles.flame, style]}>
      <LinearGradient colors={['#FFF6C9', '#FFC94A', '#FF8A1F', '#D9480F']} locations={[0, 0.35, 0.75, 1]} style={StyleSheet.absoluteFill} />
      <View style={styles.flameCore} />
    </Animated.View>
  );
}

function Glow() {
  const pulse = useSharedValue(0);
  useEffect(() => {
    pulse.set(withRepeat(withSpring(1, { damping: 4, stiffness: 20 }), -1, true));
  }, [pulse]);
  const style = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.get(), [0, 1], [0.7, 1]),
    transform: [{ scale: interpolate(pulse.get(), [0, 1], [0.9, 1.1]) }],
  }));
  return (
    <Animated.View style={[styles.glow, style]}>
      <View style={[styles.ring, { width: 112, height: 112, opacity: 0.18 }]} />
      <View style={[styles.ring, { width: 80, height: 80, opacity: 0.28 }]} />
      <View style={[styles.ring, { width: 48, height: 48, opacity: 0.45 }]} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.card, overflow: 'hidden', flexDirection: 'row', alignItems: 'center', padding: 20, gap: 18, minHeight: 230 },
  scene: { width: 96, height: 190, alignItems: 'center', justifyContent: 'flex-end' },
  glow: { position: 'absolute', top: 2, width: 112, height: 112, alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute', borderRadius: 60, backgroundColor: '#FFB547' },
  candleColumn: { alignItems: 'center' },
  flameSpace: { height: 58 },
  flame: {
    width: 26,
    height: 58,
    borderTopLeftRadius: 13,
    borderTopRightRadius: 13,
    borderBottomLeftRadius: 13,
    borderBottomRightRadius: 13,
    overflow: 'hidden',
    transformOrigin: 'bottom',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  flameCore: { width: 8, height: 18, borderRadius: 4, backgroundColor: 'rgba(80,140,255,0.55)', marginBottom: 3 },
  wick: { width: 3, height: 8, backgroundColor: '#2A2A2A', borderRadius: 1 },
  wax: { width: 46, height: 110, borderTopLeftRadius: 8, borderTopRightRadius: 8, borderBottomLeftRadius: 4, borderBottomRightRadius: 4 },
  text: { flex: 1, gap: 8 },
  soft: { color: 'rgba(255,255,255,0.8)' },
});
