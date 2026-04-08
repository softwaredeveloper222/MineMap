import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Keyboard, KeyboardAvoidingView, LogBox, Platform, View } from 'react-native';
import 'react-native-reanimated';

LogBox.ignoreLogs(['Calculated frame index']);
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuthProvider } from '@/contexts/authContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Sentry from "sentry-expo";

Sentry.init({
  dsn: "https://a3d0364bcf73b960fc8068bd7cf778a5@o4509879370907648.ingest.us.sentry.io/4510428523134976",
  sendDefaultPii: true,
  tracesSampleRate: 1.0,

});


export default function RootLayout() {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const [shownKeyboard, setShownKeyboard] = useState(false);

  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    Sentry.Native.captureException("test error");
    const showSub = Keyboard.addListener("keyboardDidShow", (e: any) => {
      setShownKeyboard(true);
      console.log("Keyboard Shown, height:", (e as any).endCoordinates.height);
    });

    const hideSub = Keyboard.addListener("keyboardDidHide", () => {
      setShownKeyboard(false);
      console.log("Keyboard Hidden");
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>

    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <View style={{ minHeight: '100%', minWidth: '100%', position: 'absolute', zIndex: -20, backgroundColor: '#FFFFFF' }} />
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : shownKeyboard ? 0 : -(insets.top + insets.bottom)}
        >

            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="+not-found" />
            </Stack>

        </KeyboardAvoidingView>
        <StatusBar style="auto" />
      </AuthProvider>
    </ThemeProvider>
    </GestureHandlerRootView>

  );
}

