import { Tabs } from 'expo-router/js-tabs';
import { useTranslation } from 'react-i18next';

import { FloatingTabBar } from '@/components/design/FloatingTabBar';

export default function TabsLayout() {
  const { t } = useTranslation();
  return (
    <Tabs tabBar={(props) => <FloatingTabBar {...props} />} screenOptions={{ headerShown: false, animation: 'shift' }}>
      <Tabs.Screen name="index" options={{ title: t('tabs.home') }} />
      <Tabs.Screen name="timings" options={{ title: t('tabs.timings') }} />
      <Tabs.Screen name="pray" options={{ title: t('tabs.pray') }} />
      <Tabs.Screen name="give" options={{ title: t('tabs.give') }} />
      <Tabs.Screen name="more" options={{ title: t('tabs.more') }} />
    </Tabs>
  );
}
