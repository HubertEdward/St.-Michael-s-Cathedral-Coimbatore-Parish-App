import { CormorantGaramond_700Bold } from '@expo-google-fonts/cormorant-garamond';
import { NotoSerifTamil_600SemiBold } from '@expo-google-fonts/noto-serif-tamil';
import { useDemoDataSync } from '@parish/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack, ThemeProvider, usePathname } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { PaperProvider } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

import { LanguageProvider, useLanguageState } from '@/i18n';
import { darkTheme, lightTheme, navigationTheme } from '@/theme';

SplashScreen.preventAutoHideAsync();
const queryClient = new QueryClient();

export default function RootLayout() {
  const theme = useColorScheme() === 'dark' ? darkTheme : lightTheme;
  return (
    <QueryClientProvider client={queryClient}>
      <PaperProvider theme={theme}>
        <ThemeProvider value={navigationTheme(theme)}>
          <LanguageProvider>
            <RootStack />
          </LanguageProvider>
        </ThemeProvider>
      </PaperProvider>
    </QueryClientProvider>
  );
}

function RootStack() {
  const { ready, chosen } = useLanguageState();
  const [fontsLoaded, fontError] = useFonts({ CormorantGaramond_700Bold, NotoSerifTamil_600SemiBold });
  const { t } = useTranslation();
  const dark = useColorScheme() === 'dark';
  const pathname = usePathname();
  useDemoDataSync();

  // A missing font falls back to the system face; it must not keep the splash screen up.
  const loaded = ready && (fontsLoaded || fontError !== null);
  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  if (!loaded) return null;

  return (
    <>
      <StatusBar style={dark || overPicture.includes(pathname) ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerBackButtonDisplayMode: 'minimal' }}>
        <Stack.Protected guard={chosen}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="about" options={{ headerShown: false }} />
          <Stack.Screen name="contact" options={{ title: t('more.contact') }} />
          <Stack.Screen name="ministries" options={{ title: t('more.ministries') }} />
          <Stack.Screen name="roster" options={{ title: t('more.roster') }} />
          <Stack.Screen name="sacraments/index" options={{ title: t('more.sacraments') }} />
          <Stack.Screen name="sacraments/[id]" options={{ title: '' }} />
          <Stack.Screen name="prayers/[id]" options={{ title: '' }} />
          <Stack.Screen name="announcement/[id]" options={{ title: t('news.announcements') }} />
          <Stack.Screen name="event/[id]" options={{ title: t('news.events') }} />
          <Stack.Screen name="requests/intention" options={{ title: t('more.intention') }} />
          <Stack.Screen name="requests/certificate" options={{ title: t('more.certificate') }} />
          <Stack.Screen name="requests/index" options={{ title: t('more.myRequests') }} />
          <Stack.Screen name="settings" options={{ title: t('more.settings') }} />
          <Stack.Screen name="news" options={{ title: t('more.news') }} />
          <Stack.Screen name="story" options={{ headerShown: false, presentation: 'fullScreenModal', animation: 'fade' }} />
        </Stack.Protected>
        <Stack.Protected guard={!chosen}>
          <Stack.Screen name="welcome" options={{ headerShown: false }} />
        </Stack.Protected>
      </Stack>
    </>
  );
}

/** Routes whose top edge is a picture or the crimson header, so the status bar text is white. */
const overPicture = ['/', '/welcome', '/about', '/give', '/pray', '/story'];
