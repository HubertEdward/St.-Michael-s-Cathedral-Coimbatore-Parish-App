import type { UseQueryResult } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

/** Renders loading and error states for a query, and its data once loaded. */
export function QueryState<T>({ query, children }: { query: UseQueryResult<T>; children: (data: T) => ReactNode }) {
  const { t } = useTranslation();
  if (query.isPending) {
    return (
      <View style={styles.center}>
        <ActivityIndicator accessibilityLabel={t('common.loading')} />
      </View>
    );
  }
  if (query.isError) {
    return (
      <View style={styles.center}>
        <Text variant="bodyMedium">{t('common.error')}</Text>
        <Button onPress={() => query.refetch()}>{t('common.retry')}</Button>
      </View>
    );
  }
  return <>{children(query.data)}</>;
}

const styles = StyleSheet.create({
  center: { padding: 32, alignItems: 'center', gap: 12 },
});
