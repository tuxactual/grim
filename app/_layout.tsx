import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';

import { QuoteSplash } from '@/components/splash/QuoteSplash';
import { getRandomQuote } from '@/constants/quotes';
import { useColorScheme } from '@/hooks/use-color-scheme';

const queryClient = new QueryClient();
const LAST_QUOTE_SPLASH_DATE_KEY = 'lastQuoteSplashDate';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [isCheckingSplash, setIsCheckingSplash] = useState(true);
  const [showQuoteSplash, setShowQuoteSplash] = useState(false);
  const [quote, setQuote] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function prepareSplash() {
      const today = new Date().toISOString().slice(0, 10);

      if (__DEV__) {
        if (!isMounted) {
          return;
        }

        setQuote(getRandomQuote());
        setShowQuoteSplash(true);
        setIsCheckingSplash(false);
        return;
      }

      try {
        const lastShownDate = await AsyncStorage.getItem(LAST_QUOTE_SPLASH_DATE_KEY);

        if (!isMounted) {
          return;
        }

        if (lastShownDate !== today) {
          setQuote(getRandomQuote());
          setShowQuoteSplash(true);
        }
      } finally {
        if (isMounted) {
          setIsCheckingSplash(false);
        }
      }
    }

    prepareSplash();

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleQuoteSplashComplete() {
    const today = new Date().toISOString().slice(0, 10);
    setShowQuoteSplash(false);
    await AsyncStorage.setItem(LAST_QUOTE_SPLASH_DATE_KEY, today);
  }

  if (isCheckingSplash) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        {showQuoteSplash ? (
          <QuoteSplash quote={quote} onComplete={handleQuoteSplashComplete} />
        ) : (
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
          </Stack>
        )}
        <StatusBar style="auto" />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
