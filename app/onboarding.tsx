import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
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
  emoji: string;
};

export default function Onboarding() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const pages = useMemo<Page[]>(
    () => [
      {
        key: "p1",
        title: "Log every trade\nin seconds",
        subtitle:
          "Capture entry, exit, size, strategy and notes fast — so you never lose context.",
        emoji: "🧾",
      },
      {
        key: "p2",
        title: "Review faster\nwith screenshots",
        subtitle:
          "Attach charts and mark your thesis so you can spot what worked and what didn’t.",
        emoji: "📸",
      },
      {
        key: "p3",
        title: "Improve with\nsmart analytics",
        subtitle:
          "Track win rate, expectancy, best setups and mistakes — and trade with a plan.",
        emoji: "📊",
      },
    ],
    []
  );

  const listRef = useRef<Animated.FlatList<Page>>(null);

  // kontinuirani scroll
  const scrollX = useRef(new Animated.Value(0)).current;

  // koristi se samo za CTA/login logiku
  const [index, setIndex] = useState(0);

  const finish = async () => {
    await AsyncStorage.setItem("hasOnboarded", "1");
    router.replace("/");
  };

  const goTo = (i: number) => {
    const clamped = Math.max(0, Math.min(i, pages.length - 1));
    listRef.current?.scrollToOffset({ offset: clamped * W, animated: true });
  };

  const onMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const nextIndex = Math.round(e.nativeEvent.contentOffset.x / W);
    setIndex(nextIndex);
  };

  const ctaText = index === pages.length - 1 ? "Sign up" : "Continue";
  const topRightText = index === pages.length - 1 ? "Later" : "Skip";

  const onCtaPress = async () => {
    if (index < pages.length - 1) {
      goTo(index + 1);
      return;
    }

    // poslednji slajd -> idi na register
    await AsyncStorage.setItem("hasOnboarded", "1");
    router.replace("/(auth)/register");
  };

  const onSkipPress = async () => {
    await AsyncStorage.setItem("hasOnboarded", "1");
    router.replace("/(auth)/login");
  };

  // ===== TOP-LEFT INDICATOR (___ . . . ) sa MORPH-om =====
  const slotW = 18;
  const gap = 6;
  const dotSize = 4;

  const barW = 18;
  const barH = 4;

  const totalSlotsW = pages.length * slotW + (pages.length - 1) * gap;

  // progress = scrollX / W (0..N-1 kontinuirano)
  const progress = Animated.divide(scrollX, W);

  // baseTranslate: pomera se po slotovima kontinuirano
  const baseTranslateX = progress.interpolate({
    inputRange: pages.map((_, i) => i),
    outputRange: pages.map((_, i) => i * (slotW + gap)),
    extrapolate: "clamp",
  });

  // frac = progress % 1  (0..1) — dobijamo preko 0..1..2.. mapiranja po segmentima
  // napravi “saw” talas: za svaki segment [i, i+1] mapiraj na [0,1]
  const frac = progress.interpolate({
    inputRange: pages.flatMap((_, i) =>
      i === pages.length - 1 ? [i] : [i, i + 1]
    ),
    outputRange: pages.flatMap((_, i) =>
      i === pages.length - 1 ? [0] : [0, 1]
    ),
    extrapolate: "clamp",
  });

  // morph: raste do sredine swipe-a pa se vraća (0->0.5->1 : 1->max->1)
  const scaleX = frac.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 2.5, 1],
    extrapolate: "clamp",
  });

  // dot opacity: dot na trenutnoj poziciji nestaje, ali se vraća čim napustiš
  const dotOpacityFor = (i: number) =>
    scrollX.interpolate({
      inputRange: [(i - 1) * W, i * W, (i + 1) * W],
      outputRange: [1, 0, 1],
      extrapolate: "clamp",
    });

  return (
    <View style={{ flex: 1, backgroundColor: "#2252B5" }}>
      <LinearGradient
        colors={["#3A6CF3", "#2252B5"]}
        style={{ position: "absolute", left: 0, top: 0, width: W, height: H }}
      />

      {/* TOP-LEFT INDICATOR */}
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

        {/* ACTIVE BAR (translate + morph scaleX) */}
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

      {/* TOP-RIGHT SKIP/LATER */}
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
          {
            useNativeDriver: true,
          }
        )}
        getItemLayout={(_, i) => ({ length: W, offset: W * i, index: i })}
        renderItem={({ item }) => (
          <View style={{ width: W, flex: 1 }}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{
                flexGrow: 1,
                justifyContent: "center",
                paddingTop: insets.top + 70,
                paddingBottom: insets.bottom + 170,
                paddingHorizontal: 28,
              }}
            >
              <Text
                style={{
                  color: "#FFFFFF",
                  fontSize: 30,
                  fontWeight: "800",
                  textAlign: "center",
                  lineHeight: 36,
                  marginBottom: 12,
                }}
              >
                {item.title}
              </Text>

              <Text
                style={{
                  color: "rgba(255,255,255,0.85)",
                  fontSize: 15,
                  textAlign: "center",
                }}
              >
                {item.subtitle}
              </Text>

              <View
                style={{
                  height: 280,
                  marginTop: 30,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <View
                  style={{
                    width: 260,
                    height: 260,
                    borderRadius: 40,
                    backgroundColor: "rgba(255,255,255,0.08)",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ fontSize: 56 }}>{item.emoji}</Text>
                </View>
              </View>
            </ScrollView>
          </View>
        )}
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
          <Text style={{ color: "#1E2A5D", fontWeight: "700", fontSize: 16 }}>
            {ctaText}
          </Text>
        </TouchableOpacity>

        {index === pages.length - 1 && (
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
