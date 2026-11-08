import { configureDemoStore } from '@parish/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { PaperProvider } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

import { LanguageProvider, useLanguageState } from '@/i18n';
import { darkTheme, lightTheme, navigationTheme } from '@/theme';

SplashScreen.preventAutoHideAsync();
configureDemoStore({ sampleRequests: false });
const queryClient = new QueryClient();

export default function RootLayout() {
  const theme = useColorScheme() === 'dark' ? darkTheme : lightTheme;
  return (
    <QueryClientProvider client={queryClient}>
      <PaperProvider theme={theme}>
        <ThemeProvider value={navigationTheme(theme)}>
          <LanguageProvider>
            <StatusBar style={theme.dark ? 'light' : 'dark'} />
            <RootStack />
          </LanguageProvider>
        </ThemeProvider>
      </PaperProvider>
    </QueryClientProvider>
  );
}

function RootStack() {
  const { ready, chosen } = useLanguageState();
  const { t } = useTranslation();

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    <Stack screenOptions={{ headerBackButtonDisplayMode: 'minimal' }}>
      <Stack.Protected guard={chosen}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="about" options={{ title: t('more.about') }} />
        <Stack.Screen name="contact" options={{ title: t('more.contact') }} />
        <Stack.Screen name="ministries" options={{ title: t('more.ministries') }} />
        <Stack.Screen name="roster" options={{ title: t('more.roster') }} />
        <Stack.Screen name="sacraments/index" options={{ title: t('more.sacraments') }} />
        <Stack.Screen name="sacraments/[id]" options={{ title: '' }} />
        <Stack.Screen name="prayers/index" options={{ title: t('more.prayers') }} />
        <Stack.Screen name="prayers/[id]" options={{ title: '' }} />
        <Stack.Screen name="announcement/[id]" options={{ title: t('news.announcements') }} />
        <Stack.Screen name="event/[id]" options={{ title: t('news.events') }} />
        <Stack.Screen name="requests/intention" options={{ title: t('more.intention') }} />
        <Stack.Screen name="requests/certificate" options={{ title: t('more.certificate') }} />
        <Stack.Screen name="requests/index" options={{ title: t('more.myRequests') }} />
        <Stack.Screen name="settings" options={{ title: t('more.settings') }} />
      </Stack.Protected>
      <Stack.Protected guard={!chosen}>
        <Stack.Screen name="welcome" options={{ headerShown: false }} />
      </Stack.Protected>
    </Stack>
  );
}
