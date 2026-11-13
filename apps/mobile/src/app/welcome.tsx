import { churchPhotos, parish, pick } from '@parish/core';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import Animated, { FadeIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { displayFonts } from '@/components/design/Display';
import { KenBurns } from '@/components/design/KenBurns';
import { Tap } from '@/components/design/Tap';
import { gold, radius } from '@/components/design/tokens';
import { languageNames, languages, useLanguageState } from '@/i18n';
import en from '@/i18n/en';
import ta from '@/i18n/ta';

const strings = { en, ta };

/** First launch: choose a language. Every prompt is shown in each offered language, since we don't know the reader yet. */
export default function Welcome() {
  const { choose } = useLanguageState();

  return (
    <View style={styles.page}>
      <KenBurns images={churchPhotos.map((p) => p.source)} position="top" dots={false} />
      <LinearGradient colors={['rgba(15,4,6,0.25)', 'rgba(15,4,6,0.6)', 'rgba(15,4,6,0.96)']} locations={[0, 0.42, 0.78]} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={styles.safe}>
        <View style={styles.body}>
          <Animated.View entering={FadeIn.duration(500)} style={styles.names}>
            {languages.map((language, index) => (
              <Text
                key={language}
                style={{
                  fontFamily: displayFonts[language],
                  color: index === 0 ? '#FFFFFF' : 'rgba(255,255,255,0.85)',
                  fontSize: language === 'ta' ? (index === 0 ? 28 : 20) : index === 0 ? 44 : 30,
                  lineHeight: language === 'ta' ? (index === 0 ? 44 : 32) : index === 0 ? 50 : 36,
                }}>
                {pick(parish.name, language)}
              </Text>
            ))}
            <View style={styles.rule} />
            <Text variant="titleMedium" style={styles.soft}>
              {pick(parish.place, languages[0])}
            </Text>
          </Animated.View>

          <Animated.View entering={FadeIn.delay(150).duration(500)} style={styles.choose}>
            <Text variant="bodyLarge" style={styles.soft}>
              {languages.map((language) => strings[language].welcome.subtitle).join(' · ')}
            </Text>
            {languages.map((language) => (
              <Tap key={language} onPress={() => choose(language)} style={styles.button} accessibilityLabel={languageNames[language]}>
                <Text style={[styles.language, { fontFamily: displayFonts[language], fontSize: language === 'ta' ? 22 : 30 }]}>
                  {languageNames[language]}
                </Text>
              </Tap>
            ))}
          </Animated.View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#14060A' },
  safe: { flex: 1 },
  body: { flex: 1, justifyContent: 'flex-end', padding: 24, gap: 32, width: '100%', maxWidth: 520, alignSelf: 'center' },
  names: { gap: 4 },
  rule: { width: 56, height: 2, backgroundColor: gold, borderRadius: 1, marginVertical: 8 },
  soft: { color: 'rgba(255,255,255,0.85)' },
  choose: { gap: 12 },
  language: { color: '#FFFFFF' },
  button: {
    height: 64,
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: 'rgba(226,184,92,0.7)',
    backgroundColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
