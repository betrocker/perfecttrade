import SaveTradeModal from "@/components/trade/SaveTradeModal";
import { getSetupCategory } from "@/lib/utils";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type ChecklistItem = {
  id: string;
  label: string;
  description: string;
  percentage: number;
  imageUrl?: any;
};

type Timeframe = "weekly" | "daily" | "4h" | "2h1h30m" | "entry";

// WEEKLY ITEMS
const WEEKLY_ITEMS: ChecklistItem[] = [
  {
    id: "w1",
    label: "Trend",
    description: "Is the weekly trend clearly identified (uptrend/downtrend)?",
    percentage: 10,
  },
  {
    id: "w2",
    label: "At AOI / Rejected",
    description: "Is price at Area of Interest or rejected from it?",
    percentage: 10,
  },
  {
    id: "w3",
    label: "Touching EMA",
    description: "Is price touching or near key EMA (50/200)?",
    percentage: 5,
  },
  {
    id: "w4",
    label: "Round Psychological Level",
    description:
      "Is price near a round psychological level (e.g., 1.0000, 1.1000)?",
    percentage: 5,
  },
  {
    id: "w5",
    label: "Rejection from Previous Structure",
    description: "Has price rejected from previous weekly structure (S/R)?",
    percentage: 10,
  },
  {
    id: "w6",
    label: "Candlestick Rejection from AOI",
    description: "Is there a strong candlestick rejection pattern from AOI?",
    percentage: 10,
  },
  {
    id: "w7",
    label: "Break & Retest / Head & Shoulders Pattern",
    description: "Is there a break & retest or H&S pattern confirmation?",
    percentage: 10,
  },
];

// DAILY ITEMS
const DAILY_ITEMS: ChecklistItem[] = [
  {
    id: "d1",
    label: "Trend",
    description:
      "Is the daily trend clearly identified and aligned with weekly?",
    percentage: 10,
  },
  {
    id: "d2",
    label: "At AOI / Rejected",
    description: "Is price at Area of Interest or rejected from it?",
    percentage: 10,
  },
  {
    id: "d3",
    label: "Touching EMA",
    description: "Is price touching or near key EMA (50/200)?",
    percentage: 5,
  },
  {
    id: "d4",
    label: "Round Psychological Level",
    description: "Is price near a round psychological level?",
    percentage: 5,
  },
  {
    id: "d5",
    label: "Rejection from Previous Structure",
    description: "Has price rejected from previous daily structure (S/R)?",
    percentage: 10,
  },
  {
    id: "d6",
    label: "Candlestick Rejection from AOI",
    description: "Is there a strong candlestick rejection pattern from AOI?",
    percentage: 10,
  },
  {
    id: "d7",
    label: "Break & Retest / Head & Shoulders Pattern",
    description: "Is there a break & retest or H&S pattern confirmation?",
    percentage: 10,
  },
];

// 4H ITEMS
const FOURHOUR_ITEMS: ChecklistItem[] = [
  {
    id: "4h1",
    label: "Trend",
    description: "Is the 4H trend clearly identified and aligned with daily?",
    percentage: 5,
  },
  {
    id: "4h2",
    label: "At AOI / Rejected",
    description: "Is price at Area of Interest or rejected from it?",
    percentage: 5,
  },
  {
    id: "4h3",
    label: "Touching EMA",
    description: "Is price touching or near key EMA (50/200)?",
    percentage: 5,
  },
  {
    id: "4h4",
    label: "Round Psychological Level",
    description: "Is price near a round psychological level?",
    percentage: 5,
  },
  {
    id: "4h5",
    label: "Rejection from Previous Structure",
    description: "Has price rejected from previous 4H structure (S/R)?",
    percentage: 10,
  },
  {
    id: "4h6",
    label: "Candlestick Rejection from AOI",
    description: "Is there a strong candlestick rejection pattern from AOI?",
    percentage: 5,
  },
  {
    id: "4h7",
    label: "Break & Retest / Head & Shoulders Pattern",
    description: "Is there a break & retest or H&S pattern confirmation?",
    percentage: 10,
  },
];

// 2H, 1H, 30m ITEMS
const TWOHOUR_ITEMS: ChecklistItem[] = [
  {
    id: "2h1",
    label: "Trend",
    description: "Is the 2H/1H/30m trend aligned with higher timeframes?",
    percentage: 5,
  },
  {
    id: "2h2",
    label: "Touching EMA",
    description: "Is price touching or near key EMA on these timeframes?",
    percentage: 5,
  },
  {
    id: "2h3",
    label: "Break & Retest / Head & Shoulders Pattern",
    description: "Is there a break & retest or H&S pattern confirmation?",
    percentage: 5,
  },
];

// ENTRY SIGNAL ITEMS
const ENTRY_ITEMS: ChecklistItem[] = [
  {
    id: "e1",
    label: "SOS",
    description:
      "Is there a clear Sign of Strength (bullish) or Sign of Weakness (bearish)?",
    percentage: 10,
  },
  {
    id: "e2",
    label: "Engulfing Candlestick (30m, 1H, 2H, 4H)",
    description:
      "Is there a strong engulfing candlestick pattern on relevant timeframes?",
    percentage: 10,
  },
];

const TIMEFRAME_DATA = {
  weekly: { items: WEEKLY_ITEMS, label: "WEEKLY" },
  daily: { items: DAILY_ITEMS, label: "DAILY" },
  "4h": { items: FOURHOUR_ITEMS, label: "4H" },
  "2h1h30m": { items: TWOHOUR_ITEMS, label: "2H, 1H, 30m" },
  entry: { items: ENTRY_ITEMS, label: "ENTRY" },
};

export default function DefaultChecklist() {
  const [selectedTimeframe, setSelectedTimeframe] =
    useState<Timeframe>("weekly");
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const [modalVisible, setModalVisible] = useState(false);
  const [confluenceItemsData, setConfluenceItemsData] = useState<any[]>([]);

  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const [showLeftArrowTabs, setShowLeftArrowTabs] = useState(false);
  const [showRightArrowTabs, setShowRightArrowTabs] = useState(true);

  const handleModalClose = () => {
    setModalVisible(false);
    // Reset checklist after save
    setCheckedItems(new Set());
    setSelectedTimeframe("weekly");
    console.log("✅ Checklist reset");
  };

  // Track checked items and convert to confluence data
  useEffect(() => {
    const items: any[] = [];

    WEEKLY_ITEMS.forEach((item) => {
      if (checkedItems.has(item.id)) {
        items.push({
          timeframe: "Weekly",
          label: item.label,
          weight: item.percentage,
          checked: true,
        });
      }
    });

    DAILY_ITEMS.forEach((item) => {
      if (checkedItems.has(item.id)) {
        items.push({
          timeframe: "Daily",
          label: item.label,
          weight: item.percentage,
          checked: true,
        });
      }
    });

    FOURHOUR_ITEMS.forEach((item) => {
      if (checkedItems.has(item.id)) {
        items.push({
          timeframe: "4H",
          label: item.label,
          weight: item.percentage,
          checked: true,
        });
      }
    });

    TWOHOUR_ITEMS.forEach((item) => {
      if (checkedItems.has(item.id)) {
        items.push({
          timeframe: "2H/1H/30m",
          label: item.label,
          weight: item.percentage,
          checked: true,
        });
      }
    });

    ENTRY_ITEMS.forEach((item) => {
      if (checkedItems.has(item.id)) {
        items.push({
          timeframe: "Entry",
          label: item.label,
          weight: item.percentage,
          checked: true,
        });
      }
    });

    setConfluenceItemsData(items);
    console.log("✅ Confluence items updated:", items.length);
  }, [checkedItems]);

  const handleTimeframeChange = (timeframe: Timeframe) => {
    if (timeframe === selectedTimeframe) return;
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      setSelectedTimeframe(timeframe);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }).start();
    });
  };

  const handleToggle = (item: ChecklistItem) => {
    if (checkedItems.has(item.id)) {
      const newChecked = new Set(checkedItems);
      newChecked.delete(item.id);
      setCheckedItems(newChecked);
    } else {
      Alert.alert(
        item.label,
        item.description + "\n\nHave you completed this step?",
        [
          { text: "No", style: "cancel" },
          {
            text: "Yes",
            onPress: () => setCheckedItems(new Set(checkedItems).add(item.id)),
          },
        ]
      );
    }
  };

  const getTimeframePercentage = (timeframe: Timeframe) => {
    return TIMEFRAME_DATA[timeframe].items.reduce((sum, item) => {
      return checkedItems.has(item.id) ? sum + item.percentage : sum;
    }, 0);
  };

  const allItems = [
    ...WEEKLY_ITEMS,
    ...DAILY_ITEMS,
    ...FOURHOUR_ITEMS,
    ...TWOHOUR_ITEMS,
    ...ENTRY_ITEMS,
  ];
  const overallPercentage = allItems.reduce((sum, item) => {
    return checkedItems.has(item.id) ? sum + item.percentage : sum;
  }, 0);

  const setupCategory = getSetupCategory(overallPercentage);
  const currentData = TIMEFRAME_DATA[selectedTimeframe];

  const handleScroll = (event: any) => {
    const scrollX = event.nativeEvent.contentOffset.x;
    const contentWidth = event.nativeEvent.contentSize.width;
    const layoutWidth = event.nativeEvent.layoutMeasurement.width;

    setShowLeftArrow(scrollX > 10);
    setShowRightArrow(scrollX < contentWidth - layoutWidth - 10);
  };

  const handleScrollTabs = (event: any) => {
    const scrollX = event.nativeEvent.contentOffset.x;
    const contentWidth = event.nativeEvent.contentSize.width;
    const layoutWidth = event.nativeEvent.layoutMeasurement.width;

    setShowLeftArrowTabs(scrollX > 10);
    setShowRightArrowTabs(scrollX < contentWidth - layoutWidth - 10);
  };

  return (
    <View className="flex-1 bg-bg-primary">
      {/* Segmented Control */}
      <View className="px-3 pt-3 pb-2">
        <View
          style={{
            borderRadius: 12,
            overflow: "hidden",
            backgroundColor: "rgba(42, 63, 84, 0.5)",
            borderWidth: 1,
            borderColor: "rgba(255, 255, 255, 0.1)",
            position: "relative",
          }}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 8, paddingVertical: 8 }}
            onScroll={handleScrollTabs}
            scrollEventThrottle={16}
          >
            {(Object.keys(TIMEFRAME_DATA) as Timeframe[]).map((timeframe) => {
              const isSelected = selectedTimeframe === timeframe;
              return (
                <TouchableOpacity
                  key={timeframe}
                  onPress={() => handleTimeframeChange(timeframe)}
                  className="mr-2"
                  activeOpacity={0.6}
                >
                  <View
                    className="py-2 px-4 rounded-lg"
                    style={{
                      backgroundColor: isSelected ? "#00F5D4" : "transparent",
                      minWidth: 75,
                    }}
                  >
                    <Text
                      className="text-center font-bold text-xs"
                      style={{
                        color: isSelected ? "#1B2838" : "#8B95A5",
                      }}
                    >
                      {TIMEFRAME_DATA[timeframe].label}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {showLeftArrowTabs && (
            <View
              style={{
                position: "absolute",
                left: 5,
                top: 0,
                bottom: 0,
                justifyContent: "center",
                zIndex: 10,
              }}
              pointerEvents="none"
            >
              <View
                style={{
                  backgroundColor: "rgba(27, 40, 56, 0.9)",
                  borderRadius: 12,
                  width: 24,
                  height: 24,
                  justifyContent: "center",
                  alignItems: "center",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.3,
                  shadowRadius: 4,
                  elevation: 5,
                }}
              >
                <Ionicons name="chevron-back" size={18} color="#00F5D4" />
              </View>
            </View>
          )}

          {showRightArrowTabs && (
            <View
              style={{
                position: "absolute",
                right: 5,
                top: 0,
                bottom: 0,
                justifyContent: "center",
                zIndex: 10,
              }}
              pointerEvents="none"
            >
              <View
                style={{
                  backgroundColor: "rgba(27, 40, 56, 0.9)",
                  borderRadius: 12,
                  width: 24,
                  height: 24,
                  justifyContent: "center",
                  alignItems: "center",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.3,
                  shadowRadius: 4,
                  elevation: 5,
                }}
              >
                <Ionicons name="chevron-forward" size={18} color="#00F5D4" />
              </View>
            </View>
          )}
        </View>
      </View>

      {/* Content Area */}
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 110 }}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          <View className="px-3 pb-3">
            {currentData.items.map((item) => {
              const isChecked = checkedItems.has(item.id);
              return (
                <View
                  key={item.id}
                  className="flex-row items-center justify-between bg-bg-secondary rounded-lg p-3 mb-2 border border-border"
                >
                  <View className="flex-1 mr-3">
                    <Text className="text-txt-primary font-semibold text-base mb-1">
                      {item.label}
                    </Text>
                  </View>

                  <View className="flex-row items-center">
                    <Text className="text-accent-cyan font-bold text-sm mr-3">
                      {item.percentage}%
                    </Text>

                    <TouchableOpacity
                      onPress={() => handleToggle(item)}
                      className={`w-12 h-7 rounded-full p-0.5 ${
                        isChecked ? "bg-accent-cyan" : "bg-bg-tertiary"
                      }`}
                      activeOpacity={0.8}
                    >
                      <View
                        className={`w-6 h-6 rounded-full bg-white shadow-lg ${
                          isChecked ? "self-end" : "self-start"
                        }`}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        </Animated.View>

        {/* Confluence Summary */}
        <View className="mx-3 mt-2 mb-2 bg-bg-secondary rounded-xl p-4 border border-border">
          <Text className="text-txt-secondary text-center text-xs font-semibold mb-3 tracking-wider">
            CONFLUENCE SUMMARY
          </Text>

          <View style={{ position: "relative" }}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                paddingHorizontal: 2,
                paddingVertical: 2,
              }}
              onScroll={handleScroll}
              scrollEventThrottle={16}
            >
              {(Object.keys(TIMEFRAME_DATA) as Timeframe[]).map((timeframe) => {
                const percentage = getTimeframePercentage(timeframe);
                return (
                  <View
                    key={timeframe}
                    className="bg-bg-tertiary rounded-lg p-3 mr-2"
                    style={{ width: 90 }}
                  >
                    <Text
                      className="text-txt-secondary font-bold text-center mb-2"
                      style={{ fontSize: 9 }}
                      numberOfLines={1}
                    >
                      {TIMEFRAME_DATA[timeframe].label}
                    </Text>
                    <Text className="text-accent-cyan text-2xl font-bold text-center">
                      {percentage}%
                    </Text>
                  </View>
                );
              })}
            </ScrollView>

            {showLeftArrow && (
              <View
                style={{
                  position: "absolute",
                  left: 5,
                  top: 0,
                  bottom: 0,
                  justifyContent: "center",
                  zIndex: 10,
                }}
                pointerEvents="none"
              >
                <View
                  style={{
                    backgroundColor: "rgba(27, 40, 56, 0.9)",
                    borderRadius: 14,
                    width: 28,
                    height: 28,
                    justifyContent: "center",
                    alignItems: "center",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.4,
                    shadowRadius: 4,
                    elevation: 5,
                  }}
                >
                  <Ionicons name="chevron-back" size={20} color="#00F5D4" />
                </View>
              </View>
            )}

            {showRightArrow && (
              <View
                style={{
                  position: "absolute",
                  right: 5,
                  top: 0,
                  bottom: 0,
                  justifyContent: "center",
                  zIndex: 10,
                }}
                pointerEvents="none"
              >
                <View
                  style={{
                    backgroundColor: "rgba(27, 40, 56, 0.9)",
                    borderRadius: 14,
                    width: 28,
                    height: 28,
                    justifyContent: "center",
                    alignItems: "center",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.4,
                    shadowRadius: 4,
                    elevation: 5,
                  }}
                >
                  <Ionicons name="chevron-forward" size={20} color="#00F5D4" />
                </View>
              </View>
            )}
          </View>

          {/* Overall Score */}
          <View
            className="rounded-xl p-3 mt-4 border"
            style={{
              backgroundColor: "rgba(30, 42, 56, 0.8)",
              borderColor: "rgba(0, 245, 212, 0.3)",
            }}
          >
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-txt-secondary text-xs font-semibold mb-1">
                  TOTAL SCORE
                </Text>
                <Text
                  className="text-4xl font-bold"
                  style={{ color: setupCategory.color }}
                >
                  {overallPercentage}%
                </Text>
              </View>
              <View className="flex-1 items-end">
                <Text className="text-white text-sm font-bold text-right">
                  {setupCategory.label}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Save Button */}
        <View className="px-3 pb-4">
          <TouchableOpacity
            onPress={() => setModalVisible(true)}
            className="bg-accent-cyan rounded-xl p-3.5"
            activeOpacity={0.8}
          >
            <Text className="text-bg-primary text-center text-base font-bold">
              Save Trade
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Save Trade Modal */}
      <SaveTradeModal
        visible={modalVisible}
        onClose={handleModalClose}
        confluenceScore={overallPercentage}
        confluenceColor={setupCategory.color}
        checkedItems={confluenceItemsData}
      />
    </View>
  );
}
