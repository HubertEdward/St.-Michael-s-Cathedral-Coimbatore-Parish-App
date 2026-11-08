import { DarkTheme as NavDark, DefaultTheme as NavLight, type Theme as NavTheme } from 'expo-router';
import type { MD3Theme } from 'react-native-paper';

export { darkTheme, lightTheme } from '@parish/core';

export function navigationTheme(theme: MD3Theme): NavTheme {
  const base = theme.dark ? NavDark : NavLight;
  return {
    ...base,
    colors: {
      ...base.colors,
      primary: theme.colors.primary,
      background: theme.colors.background,
      card: theme.colors.elevation.level2,
      text: theme.colors.onSurface,
      border: theme.colors.outlineVariant,
    },
  };
}
