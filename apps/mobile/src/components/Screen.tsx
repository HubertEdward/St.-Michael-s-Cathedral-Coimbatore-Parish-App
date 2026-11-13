import type { ReactNode } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useTheme } from 'react-native-paper';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Display } from './design/Display';
import { Eyebrow } from './design/Eyebrow';
import { TAB_BAR_SPACE } from './design/FloatingTabBar';
import { gold } from './design/tokens';

interface Props {
  children: ReactNode;
  onRefresh?: () => void;
  refreshing?: boolean;
  /** A large serif page title, for screens without a navigation header (the tabs). */
  title?: string;
  eyebrow?: string;
}

/**
 * Scrollable page body with consistent spacing and a capped width on tablets and web.
 * The page fades in gently when it opens.
 */
export function Screen({ children, onRefresh, refreshing = false, title, eyebrow }: Props) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      style={{ backgroundColor: theme.colors.background }}
      contentContainerStyle={[styles.content, title ? { paddingTop: insets.top + 20 } : null]}
      refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={gold} /> : undefined}>
      <Animated.View entering={FadeIn.duration(220)} style={styles.inner}>
        {title && (
          <View style={styles.title}>
            {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
            <Display size={40}>{title}</Display>
          </View>
        )}
        {children}
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: TAB_BAR_SPACE + 32, alignItems: 'center' },
  inner: { width: '100%', maxWidth: 720, gap: 16 },
  title: { gap: 2, marginBottom: 4 },
});
