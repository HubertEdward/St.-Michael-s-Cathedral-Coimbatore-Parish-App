import { StyleSheet, View } from 'react-native';
import { Button } from 'react-native-paper';

import { Display } from './Display';

/** A serif section heading with an optional "See all" style action. */
export function SectionTitle({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={styles.row}>
      <Display size={26} style={styles.title}>
        {title}
      </Display>
      {action && onAction && (
        <Button compact onPress={onAction}>
          {action}
        </Button>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  title: { flexShrink: 1 },
});
