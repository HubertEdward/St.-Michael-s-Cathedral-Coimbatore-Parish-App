import type { ReactNode } from 'react';
import type { StyleProp, TextStyle } from 'react-native';
import { Text, useTheme } from 'react-native-paper';

import { useLanguage } from '@/i18n';

import { maxTextScale } from './tokens';

/** Font families loaded in the root layout. */
export const displayFonts = {
  en: 'CormorantGaramond_700Bold',
  ta: 'NotoSerifTamil_600SemiBold',
} as const;

interface Props {
  children: ReactNode;
  /** Size for the Latin serif; Tamil script is drawn smaller to match its visual size. */
  size?: number;
  color?: string;
  numberOfLines?: number;
  style?: StyleProp<TextStyle>;
}

/** Serif heading text, in the face that suits the current language. */
export function Display({ children, size = 28, color, numberOfLines, style }: Props) {
  const theme = useTheme();
  const language = useLanguage();
  const fontSize = language === 'ta' ? Math.round(size * 0.72) : size;
  return (
    <Text
      accessibilityRole="header"
      numberOfLines={numberOfLines}
      maxFontSizeMultiplier={maxTextScale.heading}
      style={[
        { fontFamily: displayFonts[language], fontSize, lineHeight: Math.round(fontSize * (language === 'ta' ? 1.5 : 1.15)) },
        { color: color ?? theme.colors.onSurface },
        style,
      ]}>
      {children}
    </Text>
  );
}
