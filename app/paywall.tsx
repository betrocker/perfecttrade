import { usePremium } from "@/context/PremiumContext";
import { useRouter } from "expo-router";
import React from "react";
import { ActivityIndicator, Button, Text, View } from "react-native";

export default function PaywallScreen() {
  const { loading, isPremium, purchase, restore } = usePremium();
  const router = useRouter();

  if (loading) return <ActivityIndicator />;
  if (isPremium) {
    router.back();
    return null;
  }

  return (
    <View style={{ padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 20, fontWeight: "600" }}>Premium</Text>
      <Text>Custom checklist, unlimited trades i advanced stats.</Text>

      <Button title="Start free trial (Annual)" onPress={purchase} />
      <Button title="Restore purchases" onPress={restore} />
      <Button title="Not now" onPress={() => router.back()} />
    </View>
  );
}
