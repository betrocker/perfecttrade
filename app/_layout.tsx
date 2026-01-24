import { AuthProvider } from "@/context/AuthContext";
import { ChecklistProvider } from "@/context/ChecklistContext";
import { NotificationProvider } from "@/context/NotificationContext";
import { PremiumProvider } from "@/context/PremiumContext";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "../global.css";

// Spreči auto-hiding splash screen-a
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Ovde možeš da učitaš fontove, podatke, itd.
        // Simuliraj minimalno vreme učitavanja za smooth UX
        await new Promise((resolve) => setTimeout(resolve, 1500));
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  useEffect(() => {
    if (appIsReady) {
      // Sakrij native splash screen nakon što je app spreman
      SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return null;
  }

  return (
    <AuthProvider>
      <PremiumProvider>
        <NotificationProvider>
          <SafeAreaProvider>
            <ChecklistProvider>
              <StatusBar style="light" backgroundColor="#1B2838" />
              <Stack
                screenOptions={{
                  headerShown: false,
                  contentStyle: {
                    backgroundColor: "#1B2838",
                  },
                }}
              >
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              </Stack>
            </ChecklistProvider>
          </SafeAreaProvider>
        </NotificationProvider>
      </PremiumProvider>
    </AuthProvider>
  );
}
