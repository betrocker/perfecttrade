import { useAuth } from "@/context/AuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Animated, Text, View } from "react-native";

export default function Index() {
  const { user, loading } = useAuth();
  const [redirecting, setRedirecting] = useState(false);

  // Animacije
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    // Pokreni animaciju pojave
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

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

      // 2) Auth gate
      if (user) {
        router.replace("/(tabs)");
      } else {
        router.replace("/(auth)/login");
      }
    })();
  }, [user, loading, redirecting]);

  return (
    <View className="flex-1 bg-[#1B2838] items-center justify-center">
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        }}
        className="items-center"
      >
        {/* Logo Container */}
        <View className="w-24 h-24 bg-[#2A3F54] rounded-2xl items-center justify-center mb-6 border-2 border-[#00F5D4]">
          <Text className="text-4xl font-bold text-[#00F5D4]">PT</Text>
        </View>

        {/* App Name */}
        <Text className="text-2xl font-bold text-white mb-2">
          Perfect Trade
        </Text>

        {/* Loading Indicator */}
        <View className="mt-8">
          <ActivityIndicator size="large" color="#00F5D4" />
        </View>

        {/* Status Text */}
        <Text className="text-[#8B9DC3] mt-4 text-sm">
          {loading ? "Loading..." : "Redirecting..."}
        </Text>
      </Animated.View>

      {/* Version */}
      <Animated.View
        style={{ opacity: fadeAnim }}
        className="absolute bottom-10"
      >
        <Text className="text-xs text-[#6B7C93]">v1.0.0</Text>
      </Animated.View>
    </View>
  );
}
