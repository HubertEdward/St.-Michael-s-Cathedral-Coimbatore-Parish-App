import type { ReactNode } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useTheme } from 'react-native-paper';

interface Props {
  children: ReactNode;
  onRefresh?: () => void;
  refreshing?: boolean;
}

/** Scrollable page body with consistent spacing, capped width on tablets and web. */
export function Screen({ children, onRefresh, refreshing = false }: Props) {
  const theme = useTheme();
  return (
    <ScrollView
      style={{ backgroundColor: theme.colors.background }}
      contentContainerStyle={styles.content}
      refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} /> : undefined}>
      <View style={styles.inner}>{children}</View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 32, alignItems: 'center' },
  inner: { width: '100%', maxWidth: 720, gap: 16 },
});
