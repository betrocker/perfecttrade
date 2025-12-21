import { usePremium } from "@/context/PremiumContext";
import { useRouter } from "expo-router";
import React from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

export default function PaywallScreen() {
  const { loading, isPremium, purchase, restore } = usePremium();
  const router = useRouter();

  if (loading) return <ActivityIndicator />;
  if (isPremium) {
    router.back();
    return null;
  }

  return (
    <View className="flex-1 bg-bg-primary px-6 pt-16 pb-10">
      {/* Top */}
      <View className="gap-4">
        <Text className="self-start bg-accent-orange text-txt-primary px-3 py-1 rounded-full text-sm font-semibold">
          PREMIUM
        </Text>

        <Text className="text-txt-primary text-4xl font-extrabold leading-[44px]">
          Trade with{" "}
          <Text className="text-accent-cyan text-4xl font-extrabold leading-[44px]">
            confidence
          </Text>
        </Text>

        <Text className="text-txt-secondary text-lg leading-6">
          Unlock custom checklists, unlimited trades, and advanced analytics to
          stay consistent and improve faster.
        </Text>
      </View>

      {/* Middle */}
      <View className="flex-1 justify-center gap-4 mt-2">
        <View className="bg-bg-tertiary border border-border rounded-3xl p-5">
          <Text className="text-txt-primary text-xl font-bold">
            What you get
          </Text>

          <View className="mt-3 gap-2">
            <Text className="text-txt-primary text-lg">• Unlimited trades</Text>
            <Text className="text-txt-primary text-lg">
              • Custom checklist per setup
            </Text>
            <Text className="text-txt-primary text-lg">
              • Advanced performance analytics
            </Text>
          </View>

          <Text className="text-txt-secondary text-sm mt-3 leading-5">
            Built to keep you disciplined, not emotional.
          </Text>
        </View>

        <View className="flex-row gap-3">
          <View className="flex-1 bg-bg-secondary border border-border rounded-3xl p-5">
            <Text className="text-txt-primary text-lg font-semibold">
              Less noise
            </Text>
            <Text className="text-txt-secondary text-sm mt-1 leading-5">
              Clear rules and faster reviews.
            </Text>
          </View>

          <View className="flex-1 bg-bg-secondary border border-border rounded-3xl p-5">
            <Text className="text-txt-primary text-lg font-semibold">
              More edge
            </Text>
            <Text className="text-txt-secondary text-sm mt-1 leading-5">
              See what works with real stats.
            </Text>
          </View>
        </View>
      </View>

      {/* Bottom */}
      <View className="gap-3">
        <Pressable
          onPress={purchase}
          style={({ pressed }) => [{ opacity: pressed ? 0.92 : 1 }]}
          className="bg-accent-cyan rounded-full px-5 py-4"
        >
          <Text className="text-bg-primary text-center text-lg font-extrabold">
            Start free trial
          </Text>
          <Text className="text-bg-primary/80 text-center text-sm mt-1">
            Annual plan · Cancel anytime
          </Text>
        </Pressable>

        <Pressable
          onPress={restore}
          style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}
          className="border border-border bg-bg-tertiary rounded-full px-5 py-3.5"
        >
          <Text className="text-txt-primary text-center text-base font-semibold">
            Restore purchases
          </Text>
        </Pressable>

        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
          className="py-2"
        >
          <Text className="text-txt-tertiary text-center text-base">
            Not now
          </Text>
        </Pressable>

        <Text className="text-txt-tertiary text-center text-xs leading-4">
          Billing is handled by the App Store / Google Play. You can cancel at
          any time.
        </Text>
      </View>
    </View>
  );
}
