import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Tabs } from 'expo-router/js-tabs';
import type { ComponentProps } from 'react';
import type { ColorValue } from 'react-native';
import { useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { displayFonts } from '@/components/design/Display';
import { tapFeedback } from '@/components/design/Tap';
import { useLanguage } from '@/i18n';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];
const icon =
  (name: IconName) =>
  ({ color, size }: { color: ColorValue; size: number }) => <MaterialCommunityIcons name={name} color={color} size={size} />;

export default function TabsLayout() {
  const { t } = useTranslation();
  const theme = useTheme();
  const language = useLanguage();
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenListeners={{ tabPress: () => void tapFeedback() }}
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
        tabBarStyle: {
          backgroundColor: theme.dark ? theme.colors.elevation.level2 : '#FFFFFF',
          borderTopColor: theme.colors.outlineVariant,
          height: 64 + insets.bottom,
          paddingTop: 6,
        },
        headerStyle: { backgroundColor: theme.colors.background },
        headerShadowVisible: false,
        headerTitleStyle: { fontFamily: displayFonts[language], fontSize: language === 'ta' ? 20 : 28 },
      }}>
      <Tabs.Screen name="index" options={{ title: t('tabs.home'), headerShown: false, tabBarIcon: icon('home-variant') }} />
      <Tabs.Screen name="timings" options={{ title: t('tabs.timings'), tabBarIcon: icon('clock-outline') }} />
      <Tabs.Screen name="give" options={{ title: t('tabs.give'), headerShown: false, tabBarIcon: icon('hand-heart-outline') }} />
      <Tabs.Screen name="news" options={{ title: t('tabs.news'), tabBarIcon: icon('bullhorn-outline') }} />
      <Tabs.Screen name="more" options={{ title: t('tabs.more'), tabBarIcon: icon('menu') }} />
    </Tabs>
  );
}
