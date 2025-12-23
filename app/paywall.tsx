import { usePremium } from "@/context/PremiumContext";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import Purchases, { PurchasesPackage } from "react-native-purchases";

export default function PaywallScreen() {
  const { loading, isPremium, purchase, restore } = usePremium();
  const router = useRouter();
  const [pkg, setPkg] = useState<PurchasesPackage | null>(null);
  const [loadingPrice, setLoadingPrice] = useState(true);

  useEffect(() => {
    loadPackage();
  }, []);

  const loadPackage = async () => {
    try {
      const offerings = await Purchases.getOfferings();
      const current = offerings.current;
      if (current?.availablePackages[0]) {
        setPkg(current.availablePackages[0]);
      }
    } catch (error) {
      console.error("Error loading package:", error);
    } finally {
      setLoadingPrice(false);
    }
  };

  if (loading || loadingPrice) {
    return (
      <View className="flex-1 bg-bg-primary items-center justify-center">
        <ActivityIndicator size="large" color="#00F5D4" />
      </View>
    );
  }

  if (isPremium) {
    router.back();
    return null;
  }

  // Extract price and trial info
  const priceString = pkg?.product.priceString || "$49.99";
  const trialPeriod = pkg?.product.introPrice?.periodNumberOfUnits || 3;
  const trialUnit = pkg?.product.introPrice?.periodUnit || "DAY";

  return (
    <ScrollView
      className="flex-1 bg-bg-primary"
      contentContainerStyle={{ flexGrow: 1 }}
      showsVerticalScrollIndicator={false}
    >
      <View className="flex-1 px-6 pt-16 pb-10">
        {/* Close Button */}
        <Pressable
          onPress={() => router.back()}
          className="absolute top-12 right-6 z-10"
          style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
        >
          <View className="w-10 h-10 rounded-full bg-bg-tertiary items-center justify-center">
            <Ionicons name="close" size={24} color="#8B95A5" />
          </View>
        </Pressable>

        {/* Header */}
        <View className="gap-3">
          <View className="flex-row items-center gap-2">
            <View className="bg-accent-cyan/20 px-3 py-1.5 rounded-full">
              <Text className="text-accent-cyan text-xs font-bold tracking-wider">
                LIMITED OFFER
              </Text>
            </View>
            <View className="bg-accent-orange/20 px-3 py-1.5 rounded-full">
              <Text className="text-accent-orange text-xs font-bold tracking-wider">
                {trialPeriod} DAYS FREE
              </Text>
            </View>
          </View>

          <Text className="text-txt-primary text-4xl font-extrabold leading-tight mt-2">
            Elevate Your{"\n"}
            <Text className="text-accent-cyan">Trading Game</Text>
          </Text>

          <Text className="text-txt-secondary text-base leading-6">
            Join serious traders using data-driven tools to stay consistent and
            profitable.
          </Text>
        </View>

        {/* Pricing Card */}
        <View className="mt-8 bg-gradient-to-b from-accent-cyan/10 to-transparent border-2 border-accent-cyan/30 rounded-3xl p-6">
          <View className="flex-row items-baseline justify-center gap-1">
            <Text className="text-txt-secondary text-lg line-through">
              {priceString}
            </Text>
            <Text className="text-accent-cyan text-5xl font-extrabold">
              Free
            </Text>
          </View>

          <Text className="text-txt-primary text-center text-base font-semibold mt-2">
            for {trialPeriod} days, then {priceString}/year
          </Text>

          <View className="mt-4 bg-bg-tertiary/50 rounded-2xl p-3">
            <Text className="text-txt-secondary text-center text-sm leading-5">
              💡 That's less than{" "}
              <Text className="text-accent-cyan font-bold">
                $
                {(parseFloat(priceString.replace(/[^0-9.]/g, "")) / 12).toFixed(
                  2
                )}
                /month
              </Text>
              {"\n"}Cancel anytime during trial. No charges.
            </Text>
          </View>
        </View>

        {/* Features */}
        <View className="mt-8 gap-3">
          <Text className="text-txt-primary text-xl font-bold mb-1">
            Premium Features
          </Text>

          {[
            {
              icon: "infinite",
              title: "Unlimited Trades",
              desc: "Log as many trades as you need",
            },
            {
              icon: "checkmark-done-circle",
              title: "Custom Checklists",
              desc: "Create your own setup-specific rules",
            },
            {
              icon: "stats-chart",
              title: "Advanced Analytics",
              desc: "Deep insights into your performance",
            },
            {
              icon: "trending-up",
              title: "Win Rate Tracking",
              desc: "Monitor your edge across timeframes",
            },
            {
              icon: "notifications",
              title: "Smart Reminders",
              desc: "Never miss a trading opportunity",
            },
            {
              icon: "cloud-upload",
              title: "Cloud Sync",
              desc: "Access your data on any device",
            },
          ].map((feature, index) => (
            <View
              key={index}
              className="flex-row items-center bg-bg-secondary border border-border rounded-2xl p-4 gap-4"
            >
              <View className="w-12 h-12 rounded-full bg-accent-cyan/20 items-center justify-center">
                <Ionicons
                  name={feature.icon as any}
                  size={24}
                  color="#00F5D4"
                />
              </View>
              <View className="flex-1">
                <Text className="text-txt-primary text-base font-semibold">
                  {feature.title}
                </Text>
                <Text className="text-txt-secondary text-sm mt-0.5">
                  {feature.desc}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Social Proof */}
        <View className="mt-6 bg-bg-tertiary border border-border rounded-2xl p-4">
          <View className="flex-row items-center gap-2 mb-2">
            <View className="flex-row">
              {[1, 2, 3, 4, 5].map((i) => (
                <Ionicons key={i} name="star" size={16} color="#FFB800" />
              ))}
            </View>
            <Text className="text-txt-secondary text-sm">4.8/5</Text>
          </View>
          <Text className="text-txt-secondary text-sm italic leading-5">
            "This app transformed my trading discipline. The checklists keep me
            objective and the analytics show exactly what works."
          </Text>
          <Text className="text-txt-tertiary text-xs mt-2">
            — Alex M., Professional Trader
          </Text>
        </View>

        {/* CTA Buttons */}
        <View className="mt-8 gap-3">
          <Pressable
            onPress={purchase}
            style={({ pressed }) => [
              {
                opacity: pressed ? 0.9 : 1,
                transform: [{ scale: pressed ? 0.98 : 1 }],
              },
            ]}
            className="bg-accent-cyan rounded-full px-6 py-5 shadow-lg"
          >
            <View className="flex-row items-center justify-center gap-2">
              <Ionicons name="rocket" size={20} color="#1B2838" />
              <Text className="text-bg-primary text-center text-lg font-extrabold">
                Start {trialPeriod}-Day Free Trial
              </Text>
            </View>
            <Text className="text-bg-primary/80 text-center text-sm mt-1.5">
              Then {priceString}/year · Cancel anytime
            </Text>
          </Pressable>

          <Pressable
            onPress={restore}
            style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
            className="border-2 border-border bg-bg-tertiary rounded-full px-6 py-4"
          >
            <Text className="text-txt-primary text-center text-base font-semibold">
              Restore Purchases
            </Text>
          </Pressable>

          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
            className="py-3"
          >
            <Text className="text-txt-tertiary text-center text-base">
              Maybe Later
            </Text>
          </Pressable>
        </View>

        {/* Legal */}
        <View className="mt-6 gap-2">
          <Text className="text-txt-tertiary text-center text-xs leading-4">
            Free trial for {trialPeriod} days. After trial, automatically renews
            at {priceString}/year unless cancelled at least 24 hours before the
            end of trial period.
          </Text>
          <Text className="text-txt-tertiary text-center text-xs leading-4">
            Payment charged to App Store/Google Play account. Subscription
            managed in account settings. No refunds for unused portion.
          </Text>
          <View className="flex-row justify-center gap-4 mt-2">
            <Pressable onPress={() => {}}>
              <Text className="text-accent-cyan text-xs underline">
                Terms of Service
              </Text>
            </Pressable>
            <Pressable onPress={() => {}}>
              <Text className="text-accent-cyan text-xs underline">
                Privacy Policy
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
