import { AuthProvider } from "@/context/AuthContext";
import { ChecklistProvider } from "@/context/ChecklistContext";
import { PremiumProvider } from "@/context/PremiumContext";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "../global.css";

export default function RootLayout() {
  return (
    <PremiumProvider>
      <SafeAreaProvider>
        <AuthProvider>
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
        </AuthProvider>
      </SafeAreaProvider>
    </PremiumProvider>
  );
}
