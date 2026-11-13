// Design tokens beyond the Material theme: the gold accent, brand gradients and shapes.
import type { MD3Theme } from 'react-native-paper';

/**
 * How far text may grow with the phone's font size setting, where its space is fixed: headings,
 * pills, tab labels, tiles. Body text is left to grow freely.
 */
export const maxTextScale = { heading: 1.15, label: 1.2 } as const;

export const radius = { card: 24, tile: 20, button: 16 } as const;

/** Gold that reads on the crimson gradients and over photos. */
export const gold = '#E2B85C';

/** Deep crimson for headers and the subscription card; the same in light and dark. */
export const crimson = ['#3D0710', '#7A1626', '#9E2436'] as const;

/** Darkens the lower part of a photo so white text on it stays readable. */
export const photoScrim = ['rgba(15,4,6,0.35)', 'rgba(15,4,6,0)', 'rgba(15,4,6,0.88)'] as const;

/** The quiet card surface used across the app. */
export const panel = (theme: MD3Theme) => ({
  backgroundColor: theme.dark ? theme.colors.elevation.level2 : '#FFFFFF',
  borderColor: theme.colors.outlineVariant,
});
