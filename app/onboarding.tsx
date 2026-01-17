// screens/Onboarding.tsx
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width: W, height: H } = Dimensions.get("window");

type Page = {
  key: string;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  features?: string[];
};

export default function Onboarding() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const pages = useMemo<Page[]>(
    () => [
      {
        key: "p1",
        title: "Track Every Trade\nLike a Pro",
        subtitle:
          "Log entry, exit, position size and notes in seconds. Never lose your trading context.",
        icon: "newspaper-outline",
        color: "#00F5D4",
        features: ["Quick entry", "Smart tags", "Cloud sync"],
      },
      {
        key: "p2",
        title: "Build Your Edge\nWith Checklists",
        subtitle:
          "Multi-timeframe confluence system. 70+ criteria across Weekly → Daily → 4H → Entry.",
        icon: "checkmark-done-circle",
        color: "#06B6D4",
        features: ["Structured process", "Higher win rate", "Risk control"],
      },
      {
        key: "p3",
        title: "Improve with\nReal Analytics",
        subtitle:
          "Win rate, profit factor, drawdown, and setup performance. See what actually works.",
        icon: "analytics",
        color: "#10B981",
        features: ["Win rate tracking", "Setup analysis", "Profit factor"],
      },
      {
        key: "p4",
        title: "Start Your\nFree Trial",
        subtitle:
          "3 days free, then $79.99/year. Cancel anytime. Join traders who stay disciplined.",
        icon: "rocket",
        color: "#F59E0B",
        features: ["Unlimited trades", "Custom checklists", "Advanced stats"],
      },
    ],
    []
  );

  const listRef = useRef<Animated.FlatList<Page>>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const [index, setIndex] = useState(0);

  const goTo = (i: number) => {
    const clamped = Math.max(0, Math.min(i, pages.length - 1));
    listRef.current?.scrollToOffset({ offset: clamped * W, animated: true });
  };

  const onMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const nextIndex = Math.round(e.nativeEvent.contentOffset.x / W);
    setIndex(nextIndex);
  };

  const isLastSlide = index === pages.length - 1;
  const ctaText = isLastSlide ? "Sign up" : "Continue";
  const topRightText = isLastSlide ? "Later" : "Skip";

  const onCtaPress = async () => {
    if (!isLastSlide) {
      goTo(index + 1);
      return;
    }
    await AsyncStorage.setItem("hasOnboarded", "1");
    router.replace("/(auth)/register");
  };

  const onSkipPress = async () => {
    await AsyncStorage.setItem("hasOnboarded", "1");
    router.replace("/(auth)/login");
  };

  // ===== ORIGINAL TOP-LEFT INDICATOR =====
  const slotW = 18;
  const gap = 6;
  const dotSize = 4;
  const barW = 18;
  const barH = 4;

  const totalSlotsW = pages.length * slotW + (pages.length - 1) * gap;
  const progress = Animated.divide(scrollX, W);

  const baseTranslateX = progress.interpolate({
    inputRange: pages.map((_, i) => i),
    outputRange: pages.map((_, i) => i * (slotW + gap)),
    extrapolate: "clamp",
  });

  const frac = progress.interpolate({
    inputRange: pages.flatMap((_, i) =>
      i === pages.length - 1 ? [i] : [i, i + 1]
    ),
    outputRange: pages.flatMap((_, i) =>
      i === pages.length - 1 ? [0] : [0, 1]
    ),
    extrapolate: "clamp",
  });

  const scaleX = frac.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 2.5, 1],
    extrapolate: "clamp",
  });

  const dotOpacityFor = (i: number) =>
    scrollX.interpolate({
      inputRange: [(i - 1) * W, i * W, (i + 1) * W],
      outputRange: [1, 0, 1],
      extrapolate: "clamp",
    });

  return (
    <View style={{ flex: 1, backgroundColor: "#1B2838" }}>
      <LinearGradient
        colors={["#1B2838", "#0f1722"]}
        style={{ position: "absolute", left: 0, top: 0, width: W, height: H }}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* TOP-LEFT INDICATOR (original) */}
      <View
        style={{
          position: "absolute",
          left: 18,
          top: insets.top + 10,
          width: totalSlotsW,
          height: 20,
          justifyContent: "center",
          zIndex: 10,
        }}
      >
        {/* DOTS */}
        <View
          style={{
            position: "absolute",
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          {pages.map((_, i) => (
            <View
              key={i}
              style={{
                width: slotW,
                alignItems: "center",
                marginRight: i === pages.length - 1 ? 0 : gap,
              }}
            >
              <Animated.View
                style={{
                  width: dotSize,
                  height: dotSize,
                  borderRadius: dotSize / 2,
                  backgroundColor: "rgba(255,255,255,0.9)",
                  opacity: dotOpacityFor(i),
                }}
              />
            </View>
          ))}
        </View>

        {/* ACTIVE BAR */}
        <Animated.View
          style={{
            position: "absolute",
            width: slotW,
            height: 20,
            justifyContent: "center",
            alignItems: "center",
            transform: [{ translateX: baseTranslateX }],
          }}
        >
          <Animated.View
            style={{
              width: barW,
              height: barH,
              borderRadius: barH / 2,
              backgroundColor: "rgba(255,255,255,0.95)",
              transform: [{ scaleX }],
            }}
          />
        </Animated.View>
      </View>

      {/* TOP-RIGHT SKIP (original) */}
      <TouchableOpacity
        onPress={onSkipPress}
        style={{
          position: "absolute",
          right: 18,
          top: insets.top + 6,
          paddingHorizontal: 10,
          paddingVertical: 8,
          zIndex: 10,
        }}
      >
        <Text style={{ color: "rgba(255,255,255,0.9)", fontWeight: "600" }}>
          {topRightText}
        </Text>
      </TouchableOpacity>

      {/* SLIDES */}
      <Animated.FlatList
        ref={listRef}
        data={pages}
        keyExtractor={(it) => it.key}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onMomentumScrollEnd={onMomentumEnd}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: true }
        )}
        getItemLayout={(_, i) => ({ length: W, offset: W * i, index: i })}
        renderItem={({ item, index: itemIndex }) => {
          const inputRange = [
            (itemIndex - 1) * W,
            itemIndex * W,
            (itemIndex + 1) * W,
          ];

          const scale = scrollX.interpolate({
            inputRange,
            outputRange: [0.8, 1, 0.8],
            extrapolate: "clamp",
          });

          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.5, 1, 0.5],
            extrapolate: "clamp",
          });

          return (
            <View style={{ width: W, flex: 1 }}>
              <View
                style={{
                  flex: 1,
                  justifyContent: "center",
                  alignItems: "center",
                  paddingHorizontal: 32,
                  paddingTop: insets.top + 80,
                  paddingBottom: insets.bottom + 180,
                }}
              >
                <Animated.View
                  style={{
                    transform: [{ scale }],
                    opacity,
                    alignItems: "center",
                  }}
                >
                  {/* Icon Circle */}
                  <View
                    style={{
                      width: 120,
                      height: 120,
                      borderRadius: 40,
                      backgroundColor: "rgba(255,255,255,0.1)",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: 32,
                      shadowColor: item.color,
                      shadowOffset: { width: 0, height: 8 },
                      shadowOpacity: 0.3,
                      shadowRadius: 16,
                    }}
                  >
                    <Ionicons name={item.icon} size={56} color={item.color} />
                  </View>

                  {/* Title */}
                  <Text
                    style={{
                      color: "#FFFFFF",
                      fontSize: 36,
                      fontWeight: "800",
                      textAlign: "center",
                      lineHeight: 44,
                      marginBottom: 16,
                    }}
                  >
                    {item.title}
                  </Text>

                  {/* Subtitle */}
                  <Text
                    style={{
                      color: "rgba(255,255,255,0.7)",
                      fontSize: 16,
                      textAlign: "center",
                      lineHeight: 24,
                      marginBottom: 32,
                      paddingHorizontal: 8,
                    }}
                  >
                    {item.subtitle}
                  </Text>

                  {/* Features */}
                  {item.features && (
                    <View style={{ gap: 12 }}>
                      {item.features.map((feature, idx) => (
                        <View
                          key={idx}
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            backgroundColor: "rgba(0, 245, 212, 0.1)",
                            paddingHorizontal: 16,
                            paddingVertical: 10,
                            borderRadius: 12,
                            borderWidth: 1,
                            borderColor: "rgba(0, 245, 212, 0.2)",
                          }}
                        >
                          <Ionicons
                            name="checkmark-circle"
                            size={20}
                            color="#00F5D4"
                            style={{ marginRight: 8 }}
                          />
                          <Text
                            style={{
                              color: "#E5E7EB",
                              fontSize: 14,
                              fontWeight: "600",
                            }}
                          >
                            {feature}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
                </Animated.View>
              </View>
            </View>
          );
        }}
      />

      {/* BOTTOM CTA */}
      <View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          paddingHorizontal: 24,
          paddingBottom: insets.bottom + 14,
        }}
      >
        <TouchableOpacity
          onPress={onCtaPress}
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: 9999,
            paddingVertical: 16,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#1B2838", fontWeight: "700", fontSize: 16 }}>
            {ctaText}
          </Text>
        </TouchableOpacity>

        {isLastSlide && (
          <TouchableOpacity
            onPress={() => router.replace("/(auth)/login")}
            style={{ alignItems: "center", marginTop: 16 }}
          >
            <Text style={{ color: "rgba(255,255,255,0.9)", fontWeight: "600" }}>
              Login
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
