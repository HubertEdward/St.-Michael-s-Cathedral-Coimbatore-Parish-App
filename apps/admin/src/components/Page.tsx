import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';

interface Props {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}

export function Page({ title, description, actions, children }: Props) {
  const theme = useTheme();
  return (
    <ScrollView style={{ backgroundColor: theme.colors.background }} contentContainerStyle={styles.content}>
      <View style={styles.inner}>
        <View style={styles.header}>
          <View style={styles.titles}>
            <Text variant="headlineSmall">{title}</Text>
            {description && (
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                {description}
              </Text>
            )}
          </View>
          {actions}
        </View>
        {children}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 24, alignItems: 'center' },
  inner: { width: '100%', maxWidth: 1100, gap: 16 },
  header: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, alignItems: 'center', justifyContent: 'space-between' },
  titles: { flexShrink: 1, gap: 4 },
});
