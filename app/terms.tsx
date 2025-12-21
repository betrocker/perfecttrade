import { useRouter } from "expo-router";
import React from "react";
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

const TERMS_URL = "https://yourwebsite.com/terms"; // optional (recommended)

const openUrl = (url: string) =>
  Linking.openURL(url).catch(() =>
    Alert.alert("Error", "Could not open link.")
  );

const H1 = ({ children }: { children: React.ReactNode }) => (
  <Text className="text-txt-primary text-3xl font-extrabold">{children}</Text>
);

const H2 = ({ children }: { children: React.ReactNode }) => (
  <Text className="text-txt-primary text-xl font-extrabold">{children}</Text>
);

const P = ({ children }: { children: React.ReactNode }) => (
  <Text className="text-txt-secondary text-base leading-6">{children}</Text>
);

const Card = ({ children }: { children: React.ReactNode }) => (
  <View className="bg-bg-tertiary border border-border rounded-3xl p-5 gap-2">
    {children}
  </View>
);

export default function TermsOfServiceScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-bg-primary">
      {/* Header */}
      <View className="px-6 pt-16 pb-4 border-b border-border">
        <View className="flex-row items-center justify-between">
          <H1>Terms</H1>

          <View className="flex-row items-center gap-3">
            <Pressable
              onPress={() => openUrl(TERMS_URL)}
              style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}
              className="px-3 py-2 rounded-full bg-bg-secondary border border-border"
            >
              <Text className="text-accent-cyan text-base font-semibold">
                Open full
              </Text>
            </Pressable>

            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => [{ opacity: pressed ? 0.75 : 1 }]}
              className="px-3 py-2"
            >
              <Text className="text-txt-secondary text-base font-semibold">
                Close
              </Text>
            </Pressable>
          </View>
        </View>

        <Text className="text-txt-tertiary text-sm mt-2">
          Last updated: 2025-12-21
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-6 py-6 gap-6"
      >
        <P>
          These Terms of Service (“Terms”) govern your use of the PerfectTrade
          app (the “App”). By using the App, you agree to these Terms.
        </P>

        <View className="gap-2">
          <H2>1) Premium & billing</H2>
          <Card>
            <Text className="text-txt-secondary text-base leading-6">
              • Premium features require a subscription.
              {"\n"}• Purchases are processed by Google Play.
              {"\n"}• Subscriptions may auto-renew unless canceled in your
              Google Play settings.
            </Text>
          </Card>
        </View>

        <View className="gap-2">
          <H2>2) Acceptable use</H2>
          <Card>
            <Text className="text-txt-secondary text-base leading-6">
              You agree not to:
              {"\n"}• Misuse the App or attempt to disrupt its operation.
              {"\n"}• Reverse engineer or redistribute the App except where
              permitted by law.
              {"\n"}• Use the App for unlawful activities.
            </Text>
          </Card>
        </View>

        <View className="gap-2">
          <H2>3) Trading disclaimer</H2>
          <P>
            The App is for journaling and informational purposes only and does
            not provide financial, investment, legal, or tax advice.
          </P>
          <P>
            Trading involves risk. Past performance does not guarantee future
            results. You are solely responsible for your decisions and outcomes.
          </P>
        </View>

        <View className="gap-2">
          <H2>4) Warranty disclaimer</H2>
          <P>
            To the maximum extent permitted by law, the App is provided “as is”
            and “as available”, without warranties of any kind.
          </P>
        </View>

        <View className="gap-2">
          <H2>5) Limitation of liability</H2>
          <P>
            To the maximum extent permitted by law, we are not liable for any
            indirect, incidental, special, consequential, or punitive damages
            arising from your use of the App.
          </P>
        </View>

        <View className="gap-2">
          <H2>6) Contact</H2>
          <Card>
            <Text className="text-txt-primary text-base font-semibold">
              support@yourwebsite.com
            </Text>
            <Text className="text-txt-secondary text-base leading-6">
              Contact for billing questions and general support.
            </Text>
          </Card>
        </View>
      </ScrollView>
    </View>
  );
}
