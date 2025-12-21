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

const PRIVACY_URL = "https://yourwebsite.com/privacy"; // optional (recommended)

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

export default function PrivacyPolicyScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-bg-primary">
      {/* Header */}
      <View className="px-6 pt-16 pb-4 border-b border-border">
        <View className="flex-row items-center justify-between">
          <H1>Privacy</H1>

          <View className="flex-row items-center gap-3">
            <Pressable
              onPress={() => openUrl(PRIVACY_URL)}
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
          This Privacy Policy explains how PerfectTrade (“we”, “us”) handles
          information when you use the PerfectTrade mobile application (the
          “App”).
        </P>

        <Card>
          <Text className="text-txt-primary text-lg font-bold">Summary</Text>
          <Text className="text-txt-secondary text-base leading-6">
            The App is designed as a trading journal. We aim to collect only
            what’s needed to run subscriptions, provide core features, and
            improve reliability.
          </Text>
        </Card>

        <View className="gap-2">
          <H2>1) Information you provide</H2>
          <P>
            You may provide content such as trade notes, checklists, tags, and
            other journal data entered in the App.
          </P>
        </View>

        <View className="gap-2">
          <H2>2) Information collected automatically</H2>
          <Card>
            <Text className="text-txt-secondary text-base leading-6">
              Depending on enabled features, we may process:
              {"\n"}• Diagnostics (e.g., crash logs, performance data).
              {"\n"}• Basic device details (e.g., OS version, device model) as
              part of diagnostics.
              {"\n"}• Basic usage events if analytics are enabled.
            </Text>
          </Card>
          <Text className="text-txt-tertiary text-sm leading-5">
            Replace/trim this list to match your actual SDKs and data
            collection.
          </Text>
        </View>

        <View className="gap-2">
          <H2>3) Purchases & subscription status</H2>
          <P>
            Purchases are processed by Google Play. The App may receive
            subscription status (e.g., active/expired) so Premium features can
            be unlocked.
          </P>
        </View>

        <View className="gap-2">
          <H2>4) How we use information</H2>
          <Card>
            <Text className="text-txt-secondary text-base leading-6">
              We use information to:
              {"\n"}• Provide and maintain App features (including Premium).
              {"\n"}• Fix bugs, prevent crashes, and improve performance.
              {"\n"}• Respond to support requests.
            </Text>
          </Card>
        </View>

        <View className="gap-2">
          <H2>5) Sharing</H2>
          <P>
            We do not sell personal information. We may share limited data with
            service providers (e.g., billing/subscription validation, analytics,
            crash reporting) or when required by law.
          </P>
        </View>

        <View className="gap-2">
          <H2>6) Retention</H2>
          <P>
            Information is kept only as long as necessary for the purposes
            described above, unless a longer period is required by law.
          </P>
        </View>

        <View className="gap-2">
          <H2>7) Contact</H2>
          <Card>
            <Text className="text-txt-primary text-base font-semibold">
              support@yourwebsite.com
            </Text>
            <Text className="text-txt-secondary text-base leading-6">
              Contact for privacy questions, deletion requests, or support.
            </Text>
          </Card>
        </View>
      </ScrollView>
    </View>
  );
}
