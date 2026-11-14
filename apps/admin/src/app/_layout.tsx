import { darkTheme, lightTheme, parish, useDemoDataSync } from '@parish/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { router, Slot, usePathname, type Href } from 'expo-router';
import { ScrollView, StyleSheet, useColorScheme, useWindowDimensions, View } from 'react-native';
import { Appbar, Chip, Drawer, PaperProvider, useTheme } from 'react-native-paper';

const queryClient = new QueryClient();

const nav: { label: string; icon: string; href: Href }[] = [
  { label: 'Dashboard', icon: 'view-dashboard-outline', href: '/' },
  { label: 'Mass timetable', icon: 'clock-outline', href: '/timetable' },
  { label: 'Announcements', icon: 'bullhorn-outline', href: '/announcements' },
  { label: 'Events', icon: 'calendar', href: '/events' },
  { label: 'Families', icon: 'home-group', href: '/families' },
  { label: 'Anbiyams', icon: 'home-city-outline', href: '/anbiyams' },
  { label: 'Parish council', icon: 'account-tie-outline', href: '/council' },
  { label: 'Groups and ministries', icon: 'account-group-outline', href: '/groups' },
  { label: 'Mass intentions', icon: 'candle', href: '/intentions' },
  { label: 'Certificates', icon: 'file-certificate-outline', href: '/certificates' },
  { label: 'Ministry rosters', icon: 'clipboard-text-clock-outline', href: '/rosters' },
  { label: 'Monthly offerings', icon: 'hand-heart-outline', href: '/subscriptions' },
  { label: 'Settings', icon: 'cog-outline', href: '/settings' },
];

export default function RootLayout() {
  const theme = useColorScheme() === 'dark' ? darkTheme : lightTheme;
  return (
    <QueryClientProvider client={queryClient}>
      <PaperProvider theme={theme}>
        <Shell />
      </PaperProvider>
    </QueryClientProvider>
  );
}

function Shell() {
  const theme = useTheme();
  const pathname = usePathname();
  useDemoDataSync();
  const wide = useWindowDimensions().width >= 900;
  const active = (href: Href) => (href === '/' ? pathname === '/' : pathname.startsWith(String(href)));

  return (
    <View style={[styles.page, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header style={{ backgroundColor: theme.colors.primary }}>
        <Appbar.Content title={`${parish.name.en} · Parish office`} color={theme.colors.onPrimary} />
        <Chip compact icon="flask-outline" style={styles.demo}>
          Demo data in this browser
        </Chip>
      </Appbar.Header>
      <View style={[styles.body, !wide && styles.stacked]}>
        {wide ? (
          <View style={[styles.sidebar, { borderColor: theme.colors.outlineVariant }]}>
            {nav.map((item) => (
              <Drawer.Item
                key={item.label}
                label={item.label}
                icon={item.icon}
                active={active(item.href)}
                onPress={() => router.navigate(item.href)}
              />
            ))}
          </View>
        ) : (
          <ScrollView horizontal style={styles.topNav} contentContainerStyle={styles.topNavRow} showsHorizontalScrollIndicator={false}>
            {nav.map((item) => (
              <Chip key={item.label} icon={item.icon} selected={active(item.href)} onPress={() => router.navigate(item.href)}>
                {item.label}
              </Chip>
            ))}
          </ScrollView>
        )}
        <View style={styles.content}>
          <Slot />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  demo: { marginRight: 12 },
  body: { flex: 1, flexDirection: 'row' },
  stacked: { flexDirection: 'column' },
  sidebar: { width: 290, paddingVertical: 12, borderRightWidth: StyleSheet.hairlineWidth },
  topNav: { flexGrow: 0 },
  topNavRow: { gap: 8, padding: 12 },
  content: { flex: 1 },
});
