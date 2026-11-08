// Material 3 themes for both apps, in the parish's colours (see its profile).
import { configureFonts, MD3DarkTheme, MD3LightTheme, type MD3Theme } from 'react-native-paper';

import { parish } from './parish';

// Larger body text than Material defaults: many daily-Mass parishioners are elderly.
const fonts = configureFonts({
  config: {
    bodySmall: { fontSize: 14, lineHeight: 20, letterSpacing: 0.2 },
    bodyMedium: { fontSize: 16, lineHeight: 24, letterSpacing: 0.2 },
    bodyLarge: { fontSize: 18, lineHeight: 27, letterSpacing: 0.15 },
    labelLarge: { fontSize: 16, lineHeight: 22, letterSpacing: 0.1, fontWeight: '600' },
  },
});

export const lightTheme: MD3Theme = {
  ...MD3LightTheme,
  fonts,
  colors: { ...MD3LightTheme.colors, ...parish.colors.light },
};

export const darkTheme: MD3Theme = {
  ...MD3DarkTheme,
  fonts,
  colors: { ...MD3DarkTheme.colors, ...parish.colors.dark },
};
