import * as Haptics from 'expo-haptics';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { Icon, useTheme } from 'react-native-paper';
import Animated, { ZoomIn } from 'react-native-reanimated';

import { Burst } from './Burst';

/** A big tick that springs in with a burst of sparks and a success buzz. */
export function SuccessMark() {
  const theme = useTheme();
  useEffect(() => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
  }, []);
  return (
    <View style={styles.box}>
      <Burst size={240} />
      <Animated.View entering={ZoomIn.springify().damping(11)} style={[styles.circle, { backgroundColor: theme.colors.primary }]}>
        <Icon source="check-bold" size={52} color={theme.colors.onPrimary} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { height: 140, alignItems: 'center', justifyContent: 'center' },
  circle: { width: 104, height: 104, borderRadius: 52, alignItems: 'center', justifyContent: 'center' },
});
