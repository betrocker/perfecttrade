import { useAuth } from "@/context/AuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";

export default function Index() {
  const { user, loading } = useAuth();
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (loading || redirecting) return;

    setRedirecting(true);

    (async () => {
      const hasOnboarded = await AsyncStorage.getItem("hasOnboarded");

      // 1) Onboarding gate
      if (hasOnboarded !== "1") {
        router.replace("/onboarding");
        return;
      }

      // 2) Auth gate (tvoj postojeći flow)
      if (user) {
        router.replace("/(tabs)");
      } else {
        router.replace("/(auth)/login");
      }
    })();
  }, [user, loading, redirecting]);

  return (
    <View className="flex-1 bg-bg-primary items-center justify-center">
      <ActivityIndicator size="large" color="#00F5D4" />
      <Text className="text-txt-secondary mt-4">
        {loading ? "Loading..." : "Redirecting..."}
      </Text>
    </View>
  );
}
