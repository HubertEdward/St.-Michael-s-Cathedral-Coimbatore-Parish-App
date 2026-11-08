// Material 3 themes for both apps: archangel red, gold and sky blue.
import { configureFonts, MD3DarkTheme, MD3LightTheme, type MD3Theme } from 'react-native-paper';

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
  colors: {
    ...MD3LightTheme.colors,
    primary: '#8C1D2C',
    onPrimary: '#FFFFFF',
    primaryContainer: '#FFDAD9',
    onPrimaryContainer: '#3F0009',
    secondary: '#765A0B',
    onSecondary: '#FFFFFF',
    secondaryContainer: '#FFDF9E',
    onSecondaryContainer: '#261A00',
    tertiary: '#3F5F90',
    tertiaryContainer: '#D6E3FF',
    onTertiaryContainer: '#001B3D',
    background: '#FFF8F6',
    surface: '#FFF8F6',
    surfaceVariant: '#F4DDDB',
    onSurfaceVariant: '#534342',
    outline: '#857372',
    outlineVariant: '#D8C2C0',
    elevation: {
      level0: 'transparent',
      level1: '#FCEFEC',
      level2: '#F9E8E5',
      level3: '#F6E1DE',
      level4: '#F5DFDC',
      level5: '#F3DAD7',
    },
  },
};

export const darkTheme: MD3Theme = {
  ...MD3DarkTheme,
  fonts,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#FFB3B3',
    onPrimary: '#680018',
    primaryContainer: '#7A1626',
    onPrimaryContainer: '#FFDAD9',
    secondary: '#E7C26C',
    onSecondary: '#3F2E00',
    secondaryContainer: '#5A4300',
    onSecondaryContainer: '#FFDF9E',
    tertiary: '#A8C8FF',
    tertiaryContainer: '#264777',
    onTertiaryContainer: '#D6E3FF',
    background: '#1A1111',
    surface: '#1A1111',
    surfaceVariant: '#534342',
    onSurfaceVariant: '#D8C2C0',
    outline: '#A08C8B',
    outlineVariant: '#534342',
    elevation: {
      level0: 'transparent',
      level1: '#251919',
      level2: '#2A1D1D',
      level3: '#302121',
      level4: '#322323',
      level5: '#362626',
    },
  },
};
