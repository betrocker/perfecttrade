import GoalsProgressCard from "@/components/GoalsProgressCard";
import { useAuth } from "@/context/AuthContext";
import { fetchWithRetry } from "@/lib/fetchUtils";
import {
  GoalsProgress,
  goalsTrackingService,
} from "@/lib/goalsTrackingService";

import {
  dashboardService,
  DashboardStats,
  MonthlyPnL,
  PerformingPair,
  TradingDay,
  WeeklySummary,
} from "@/lib/dashboardService";
import { Trade } from "@/types/trade";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { usePremium } from "@/context/PremiumContext";
import { useRouter } from "expo-router";

export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();

  const { isPremium, loading: premiumLoading } = usePremium();

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [goalsProgress, setGoalsProgress] = useState<GoalsProgress | null>(
    null
  );

  // Data states
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [tradingDays, setTradingDays] = useState<Record<string, TradingDay>>(
    {}
  );
  const [performingPairs, setPerformingPairs] = useState<{
    best: PerformingPair | null;
    worst: PerformingPair | null;
  }>({ best: null, worst: null });
  const [monthlyPnL, setMonthlyPnL] = useState<MonthlyPnL[]>([]);
  const [weeklySummary, setWeeklySummary] = useState<WeeklySummary[]>([]);

  const loadDashboardData = async () => {
    if (!user) return;

    setLoading(true);

    try {
      // FAZA 1: Učitaj osnovne stats (FREE) prvo
      const statsData = await fetchWithRetry(
        () => dashboardService.getDashboardStats(user.id),
        3,
        10000
      );

      const goalsData = await fetchWithRetry(
        () => goalsTrackingService.getGoalsProgress(user.id),
        3,
        10000
      );

      setStats(statsData);
      setGoalsProgress(goalsData);
      setLoading(false); // Odmah prikaži osnovne podatke

      // FAZA 2: Učitaj premium podatke postepeno (ako je premium)
      if (isPremium) {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();

        // Postepeno učitavanje bez blokiranja UI-a
        Promise.allSettled([
          fetchWithRetry(() =>
            dashboardService.getTradingDays(user.id, year, month)
          ),
          fetchWithRetry(() => dashboardService.getPerformingPairs(user.id)),
          fetchWithRetry(() => dashboardService.getMonthlyPnL(user.id, 6)),
          fetchWithRetry(() =>
            dashboardService.getWeeklySummary(user.id, year, month)
          ),
        ]).then((results) => {
          if (results[0].status === "fulfilled")
            setTradingDays(results[0].value);
          if (results[1].status === "fulfilled")
            setPerformingPairs(results[1].value);
          if (results[2].status === "fulfilled")
            setMonthlyPnL(results[2].value);
          if (results[3].status === "fulfilled")
            setWeeklySummary(results[3].value);
        });
      }
    } catch (error) {
      if (__DEV__) {
        console.error("Error loading dashboard data:", error);
      }
      // Prikaži prazne stats umesto beskonačnog loading-a
      setStats(null);
      setLoading(false);
    }
  };

  // Reload when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadDashboardData();
    }, [user, currentMonth, isPremium])
  );

  // Safe helper function za formatiranje datuma
  const safeFormatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return "N/A";
    }
  };

  // Helper function to get currency flag emoji
  const getCurrencyFlag = (currency: string): string => {
    if (!currency || typeof currency !== "string") {
      return "🏳️";
    }

    const flagMap: Record<string, string> = {
      USD: "🇺🇸",
      EUR: "🇪🇺",
      GBP: "🇬🇧",
      JPY: "🇯🇵",
      CHF: "🇨🇭",
      AUD: "🇦🇺",
      CAD: "🇨🇦",
      NZD: "🇳🇿",
      CNY: "🇨🇳",
      HKD: "🇭🇰",
      SGD: "🇸🇬",
      SEK: "🇸🇪",
      NOK: "🇳🇴",
      DKK: "🇩🇰",
      ZAR: "🇿🇦",
      MXN: "🇲🇽",
      TRY: "🇹🇷",
      BRL: "🇧🇷",
      INR: "🇮🇳",
      RUB: "🇷🇺",
    };

    return flagMap[currency.toUpperCase()] || "🏳️";
  };

  // Safe helper za currency pair split
  const safeSplitCurrencyPair = (
    currencyPair: string | undefined
  ): [string, string] => {
    if (!currencyPair || typeof currencyPair !== "string") {
      return ["USD", "EUR"];
    }
    const parts = currencyPair.split("/");
    return [parts[0] || "USD", parts[1] || "EUR"];
  };

  // Calendar helper functions
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek };
  };

  const formatDateKey = (year: number, month: number, day: number) => {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(
      day
    ).padStart(2, "0")}`;
  };

  const formatDateDisplay = (dateKey: string) => {
    const date = new Date(dateKey + "T00:00:00");
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const isToday = (year: number, month: number, day: number) => {
    const today = new Date();
    return (
      today.getFullYear() === year &&
      today.getMonth() === month &&
      today.getDate() === day
    );
  };

  const handleDayPress = (dateKey: string) => {
    if (!isPremium) {
      router.push("/paywall");
      return;
    }

    const dayData = tradingDays[dateKey];
    if (dayData && dayData.trades.length > 0) {
      setSelectedDate(dateKey);
      setModalVisible(true);
    }
  };

  const renderCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentMonth);

    const days = [];

    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(
        <View key={`empty-${i}`} className="w-[14%] aspect-square p-1" />
      );
    }

    // Add days of month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = formatDateKey(year, month, day);
      const dayData = tradingDays[dateKey];
      const today = isToday(year, month, day);

      let bgColor = "bg-bg-secondary"; // default - no trades
      if (dayData) {
        bgColor =
          dayData.profit > 0
            ? "bg-accent-cyan/20"
            : dayData.profit < 0
              ? "bg-error/20"
              : "bg-warning/20";
      }

      days.push(
        <TouchableOpacity
          key={day}
          className="w-[14%] aspect-square p-1"
          onPress={() => handleDayPress(dateKey)}
          disabled={!isPremium ? false : !dayData}
          activeOpacity={0.85}
        >
          <View
            className={`${bgColor} rounded-xl flex-1 justify-center items-center ${
              today ? "border-2 border-txt-primary" : ""
            } ${!isPremium ? "opacity-60" : ""}`}
          >
            <Text className="text-txt-primary text-base font-bold">{day}</Text>
          </View>
        </TouchableOpacity>
      );
    }

    return days;
  };

  const changeMonth = (direction: number) => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentMonth(newDate);
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
  };

  const renderDayModal = () => {
    if (!isPremium) return null;
    if (!selectedDate) return null;

    const dayData = tradingDays[selectedDate];
    if (!dayData) return null;

    const totalProfit = dayData.profit;
    const tradesCount = dayData.trades.length;

    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-bg-primary rounded-t-3xl p-6">
            {/* Header */}
            <View className="flex-row justify-between items-center mb-6">
              <View>
                <Text className="text-txt-primary text-2xl font-bold mb-1">
                  {formatDateDisplay(selectedDate)}
                </Text>
                <View className="flex-row items-center">
                  <Text className="text-txt-secondary text-sm mr-4">
                    {tradesCount} trade{tradesCount > 1 ? "s" : ""}
                  </Text>
                  <Text className="text-txt-secondary text-sm mr-1">•</Text>
                  <Text className="text-txt-secondary text-sm mr-4">
                    {dayData.winRate}% win rate
                  </Text>
                  <Text className="text-txt-secondary text-sm mr-1">•</Text>
                  <Text
                    className={`text-sm font-bold ${
                      totalProfit > 0
                        ? "text-accent-cyan"
                        : totalProfit < 0
                          ? "text-error"
                          : "text-warning"
                    }`}
                  >
                    ${totalProfit.toLocaleString()}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                className="bg-bg-secondary rounded-full p-2"
              >
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Trades List */}
            <ScrollView className="max-h-96">
              {dayData.trades.map((trade: Trade) => {
                const profitLoss = trade.profit_loss || 0;
                const isWin = profitLoss > 0;
                const isLoss = profitLoss < 0;
                const isBreakeven = profitLoss === 0;

                let result = "BE";
                let bgColor = "bg-warning/20";
                let textColor = "text-warning";
                let iconColor = "#F59E0B";

                if (isWin) {
                  result = "WIN";
                  bgColor = "bg-success/20";
                  textColor = "text-success";
                  iconColor = "#10B981";
                } else if (isLoss) {
                  result = "LOSS";
                  bgColor = "bg-error/20";
                  textColor = "text-error";
                  iconColor = "#EF4444";
                }

                const [baseCurrency, quoteCurrency] = safeSplitCurrencyPair(
                  trade.currency_pair
                );

                return (
                  <View
                    key={trade.id}
                    className="bg-bg-secondary rounded-2xl p-4 mb-3"
                  >
                    <View className="flex-row justify-between items-start mb-3">
                      <View className="flex-row items-center">
                        <View className={`${bgColor} rounded-xl p-3 mr-3`}>
                          <Ionicons
                            name={
                              trade.direction === "LONG"
                                ? "trending-up"
                                : "trending-down"
                            }
                            size={24}
                            color={iconColor}
                          />
                        </View>
                        <View>
                          <Text className="text-txt-secondary text-xs mb-1">
                            {baseCurrency} / {quoteCurrency}
                          </Text>
                          <Text className="text-txt-primary text-xl font-bold">
                            {trade.currency_pair || "N/A"}
                          </Text>
                          <Text className="text-txt-secondary text-sm">
                            {trade.direction}
                          </Text>
                        </View>
                      </View>
                      <View className={`px-4 py-2 rounded-full ${bgColor}`}>
                        <Text className={`text-sm font-bold ${textColor}`}>
                          {result}
                        </Text>
                      </View>
                    </View>

                    <View className="border-t border-bg-primary pt-3">
                      <View className="flex-row justify-between items-center mb-2">
                        <Text className="text-txt-secondary text-sm">
                          Confluence:
                        </Text>
                        <Text className="text-txt-primary text-base font-bold">
                          {trade.confluence_score}%
                        </Text>
                      </View>
                      <View className="flex-row justify-between items-center">
                        <Text className="text-txt-secondary text-sm">
                          TOTAL:
                        </Text>
                        <Text className={`text-2xl font-bold ${textColor}`}>
                          {isBreakeven
                            ? "$0"
                            : `${isWin ? "+" : "-"}$${Math.abs(
                                profitLoss
                              ).toLocaleString()}`}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  if (loading || premiumLoading || !stats) {
    return (
      <View className="flex-1 bg-bg-primary items-center justify-center">
        <ActivityIndicator size="large" color="#00F5D4" />
        <Text className="text-txt-secondary mt-4">Loading dashboard...</Text>
      </View>
    );
  }

  // Get recent trades (last 5 closed trades) - SAFE VERSION
  const recentTrades =
    isPremium && Object.keys(tradingDays).length > 0
      ? Object.values(tradingDays)
          .flatMap((day) => day.trades)
          .filter((trade) => trade && trade.created_at) // Filter invalid trades
          .sort(
            (a, b) =>
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime()
          )
          .slice(0, 5)
      : [];

  return (
    <ScrollView className="flex-1 bg-bg-primary">
      <View className="p-4 pb-28">
        {/* Header */}
        <Text className="text-txt-primary text-3xl font-bold mb-1">
          Trading Dashboard
        </Text>
        <Text className="text-txt-secondary text-base mb-6">
          Your trading performance at a glance
        </Text>

        {/* Goals Progress Card */}
        {goalsProgress && <GoalsProgressCard progress={goalsProgress} />}

        {/* Net Profit & Loss Card (FREE) */}
        <View className="bg-dashboard-card-green rounded-2xl p-6 mb-4">
          <View className="flex-row justify-between items-start mb-4">
            <View>
              <Text className="text-txt-secondary text-sm mb-2">
                Net Profit & Loss
              </Text>
              <Text className="text-accent-cyan text-5xl font-bold mb-2">
                ${stats.netProfitLoss.toLocaleString()}
              </Text>
              <Text className="text-accent-cyan text-base">
                + {stats.totalTrades} trades completed
              </Text>
            </View>
            <View className="bg-accent-cyan/20 rounded-2xl p-4">
              <Feather name="dollar-sign" size={32} color="#00F5D4" />
            </View>
          </View>

          <View className="flex-row justify-between">
            <View className="bg-dashboard-card-blue rounded-xl p-3 flex-1 mr-2">
              <Text className="text-txt-secondary text-xs mb-1">Win Rate</Text>
              <Text className="text-txt-primary text-2xl font-bold">
                {stats.winRate}%
              </Text>
            </View>
            <View className="bg-dashboard-card-blue rounded-xl p-3 flex-1 mx-2">
              <Text className="text-txt-secondary text-xs mb-1">
                Profit Factor
              </Text>
              <Text className="text-txt-primary text-2xl font-bold">
                {stats.profitFactor}
              </Text>
            </View>
            <View className="bg-dashboard-card-blue rounded-xl p-3 flex-1 ml-2">
              <Text className="text-txt-secondary text-xs mb-1">
                Avg.Confluence
              </Text>
              <Text className="text-txt-primary text-2xl font-bold">
                {stats.avgConfluence}%
              </Text>
            </View>
          </View>
        </View>

        {/* Profit/Loss Cards Row (FREE) */}
        <View className="flex-row mb-4">
          <View className="bg-dashboard-card-green rounded-2xl p-4 flex-1 mr-2">
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-txt-secondary text-sm">Total Profit</Text>
              <Ionicons name="trending-up" size={20} color="#00F5D4" />
            </View>
            <Text className="text-accent-cyan text-3xl font-bold mb-1">
              ${stats.totalProfit.toLocaleString()}
            </Text>
            <Text className="text-accent-cyan text-sm">
              {stats.winningTrades} winning trades
            </Text>
          </View>

          <View className="bg-dashboard-card-red rounded-2xl p-4 flex-1 ml-2">
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-txt-secondary text-sm">Total Loss</Text>
              <Ionicons name="trending-down" size={20} color="#EF4444" />
            </View>
            <Text className="text-error text-3xl font-bold mb-1">
              ${stats.totalLoss.toLocaleString()}
            </Text>
            <Text className="text-error text-sm">
              {stats.losingTrades} losing trades
            </Text>
          </View>
        </View>

        {/* Stats Cards Grid (FREE) */}
        <View className="flex-row flex-wrap justify-between mb-4">
          <View className="bg-dashboard-card-blue rounded-2xl p-4 w-[48%] mb-3">
            <View className="flex-row items-center">
              <View className="bg-accent-cyan/20 rounded-xl p-3 mr-3">
                <Ionicons name="ribbon" size={24} color="#00F5D4" />
              </View>
              <View className="flex-1">
                <Text className="text-txt-secondary text-xs mb-1">
                  Largest Win
                </Text>
                <Text className="text-txt-primary text-xl font-bold">
                  ${stats.largestWin.toLocaleString()}
                </Text>
              </View>
            </View>
          </View>

          <View className="bg-dashboard-card-blue rounded-2xl p-4 w-[48%] mb-3">
            <View className="flex-row items-center">
              <View className="bg-error/20 rounded-xl p-3 mr-3">
                <Ionicons name="radio-button-on" size={24} color="#EF4444" />
              </View>
              <View className="flex-1">
                <Text className="text-txt-secondary text-xs mb-1">
                  Largest Loss
                </Text>
                <Text className="text-txt-primary text-xl font-bold">
                  ${stats.largestLoss.toLocaleString()}
                </Text>
              </View>
            </View>
          </View>

          <View className="bg-dashboard-card-blue rounded-2xl p-4 w-[48%]">
            <View className="flex-row items-center">
              <View className="bg-error/20 rounded-xl p-3 mr-3">
                <Ionicons name="flame" size={24} color="#EF4444" />
              </View>
              <View className="flex-1">
                <Text className="text-txt-secondary text-xs mb-1">
                  Best Streak
                </Text>
                <Text className="text-txt-primary text-xl font-bold">
                  {stats.bestStreak}
                </Text>
              </View>
            </View>
          </View>

          <View className="bg-dashboard-card-blue rounded-2xl p-4 w-[48%]">
            <View className="flex-row items-center">
              <View className="bg-info/20 rounded-xl p-3 mr-3">
                <Ionicons name="pulse" size={24} color="#3B82F6" />
              </View>
              <View className="flex-1">
                <Text className="text-txt-secondary text-xs mb-1">
                  Total Trades
                </Text>
                <Text className="text-txt-primary text-xl font-bold">
                  {stats.totalTrades}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Advanced stats lock card (PREMIUM upsell) */}
        {!isPremium && (
          <TouchableOpacity
            className="bg-bg-secondary rounded-2xl p-4 mb-4 border border-border"
            activeOpacity={0.85}
            onPress={() => router.push("/paywall")}
          >
            <Text className="text-txt-primary text-lg font-bold">
              Advanced Stats (Premium)
            </Text>
            <Text className="text-txt-secondary text-sm mt-1">
              Unlock performing pairs, monthly P&L, trading calendar and daily
              breakdown.
            </Text>
          </TouchableOpacity>
        )}

        {/* Best/Worst Performing Pairs (PREMIUM) */}
        {isPremium && (performingPairs.best || performingPairs.worst) && (
          <View className="flex-row mb-4">
            {performingPairs.best && (
              <View className="bg-dashboard-card-green rounded-2xl p-4 flex-1 mr-2">
                <View className="flex-row items-center mb-3">
                  <View className="bg-accent-cyan/20 rounded-full p-2 mr-2">
                    <Ionicons name="trending-up" size={16} color="#00F5D4" />
                  </View>
                  <Text className="text-txt-secondary text-sm">
                    Best Performing Pair
                  </Text>
                </View>

                <View className="flex-row items-center mb-4">
                  <Text className="text-base">
                    {getCurrencyFlag(
                      safeSplitCurrencyPair(performingPairs.best.pair)[0]
                    )}
                  </Text>
                  <Text className="text-base text-txt-secondary mr-1">/</Text>
                  <Text className="text-base mr-2">
                    {getCurrencyFlag(
                      safeSplitCurrencyPair(performingPairs.best.pair)[1]
                    )}
                  </Text>
                  <Text className="text-txt-primary text-2xl font-bold">
                    {performingPairs.best.pair}
                  </Text>
                </View>

                <View className="flex-row justify-between">
                  <View>
                    <Text className="text-accent-cyan text-xl font-bold">
                      +${performingPairs.best.profit.toLocaleString()}
                    </Text>
                    <Text className="text-txt-secondary text-xs">
                      Total P&L
                    </Text>
                  </View>
                  <View>
                    <Text className="text-txt-primary text-xl font-bold">
                      {performingPairs.best.trades}
                    </Text>
                    <Text className="text-txt-secondary text-xs">Trades</Text>
                  </View>
                  <View>
                    <Text className="text-txt-primary text-xl font-bold">
                      {performingPairs.best.wins}/{performingPairs.best.losses}
                    </Text>
                    <Text className="text-txt-secondary text-xs">W/L</Text>
                  </View>
                </View>
              </View>
            )}

            {performingPairs.worst && (
              <View className="bg-dashboard-card-red rounded-2xl p-4 flex-1 ml-2">
                <View className="flex-row items-center mb-3">
                  <View className="bg-error/20 rounded-full p-2 mr-2">
                    <Ionicons name="trending-down" size={16} color="#EF4444" />
                  </View>
                  <Text className="text-txt-secondary text-sm">
                    Worst Performing Pair
                  </Text>
                </View>

                <View className="flex-row items-center mb-4">
                  <Text className="text-base">
                    {getCurrencyFlag(
                      safeSplitCurrencyPair(performingPairs.worst.pair)[0]
                    )}
                  </Text>
                  <Text className="text-base text-txt-secondary mr-1">/</Text>
                  <Text className="text-base mr-2">
                    {getCurrencyFlag(
                      safeSplitCurrencyPair(performingPairs.worst.pair)[1]
                    )}
                  </Text>
                  <Text className="text-txt-primary text-2xl font-bold">
                    {performingPairs.worst.pair}
                  </Text>
                </View>

                <View className="flex-row justify-between">
                  <View>
                    <Text className="text-error text-xl font-bold">
                      -$
                      {Math.abs(performingPairs.worst.profit).toLocaleString()}
                    </Text>
                    <Text className="text-txt-secondary text-xs">
                      Total P&L
                    </Text>
                  </View>
                  <View>
                    <Text className="text-txt-primary text-xl font-bold">
                      {performingPairs.worst.trades}
                    </Text>
                    <Text className="text-txt-secondary text-xs">Trades</Text>
                  </View>
                  <View>
                    <Text className="text-txt-primary text-xl font-bold">
                      {performingPairs.worst.wins}/
                      {performingPairs.worst.losses}
                    </Text>
                    <Text className="text-txt-secondary text-xs">W/L</Text>
                  </View>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Performance Breakdown (FREE) */}
        <View className="bg-bg-secondary rounded-2xl p-4 mb-4">
          <View className="flex-row items-center mb-4">
            <Ionicons name="bar-chart" size={20} color="#8B95A5" />
            <Text className="text-txt-primary text-lg font-bold ml-2">
              Performance Breakdown
            </Text>
          </View>

          <View className="mb-4">
            <View className="flex-row justify-between mb-2">
              <Text className="text-txt-secondary text-sm">Win Rate</Text>
              <Text className="text-txt-primary text-sm font-bold">
                {stats.winRate}%
              </Text>
            </View>
            <View className="bg-bg-primary rounded-full h-2">
              <View
                className="bg-accent-cyan rounded-full h-2"
                style={{ width: `${stats.winRate}%` }}
              />
            </View>
          </View>

          <View className="flex-row justify-between mb-4">
            <View className="bg-accent-cyan/10 rounded-xl p-3 flex-1 mr-2">
              <Text className="text-txt-secondary text-xs mb-1">
                Long Trades
              </Text>
              <Text className="text-accent-cyan text-2xl font-bold mb-1">
                {stats.longTradesWinRate}%
              </Text>
              <Text className="text-txt-secondary text-xs">Win Rate</Text>
            </View>
            <View className="bg-error/10 rounded-xl p-3 flex-1 ml-2">
              <Text className="text-txt-secondary text-xs mb-1">
                Short Trades
              </Text>
              <Text className="text-error text-2xl font-bold mb-1">
                {stats.shortTradesWinRate}%
              </Text>
              <Text className="text-txt-secondary text-xs">Win Rate</Text>
            </View>
          </View>

          <View className="flex-row justify-around">
            <View className="items-center">
              <Text className="text-success text-3xl font-bold">
                {stats.winningTrades}
              </Text>
              <Text className="text-txt-secondary text-xs">Wins</Text>
            </View>
            <View className="items-center">
              <Text className="text-error text-3xl font-bold">
                {stats.losingTrades}
              </Text>
              <Text className="text-txt-secondary text-xs">Losses</Text>
            </View>
            <View className="items-center">
              <Text className="text-warning text-3xl font-bold">
                {stats.breakEvenTrades}
              </Text>
              <Text className="text-txt-secondary text-xs">Break Even</Text>
            </View>
          </View>
        </View>

        {/* Recent Trades (PREMIUM) */}
        {recentTrades.length > 0 && (
          <View className="bg-bg-secondary rounded-2xl p-4 mb-4">
            <View className="flex-row items-center mb-4">
              <Ionicons name="time" size={20} color="#8B95A5" />
              <Text className="text-txt-primary text-lg font-bold ml-2">
                Recent Trades
              </Text>
            </View>

            {recentTrades.map((trade) => {
              const profitLoss = trade.profit_loss || 0;
              const isWin = profitLoss > 0;
              const isLoss = profitLoss < 0;

              let result = "BE";
              let bgColor = "bg-warning/20";
              let textColor = "text-warning";
              let iconColor = "#F59E0B";

              if (isWin) {
                result = "WIN";
                bgColor = "bg-success/20";
                textColor = "text-success";
                iconColor = "#10B981";
              } else if (isLoss) {
                result = "LOSS";
                bgColor = "bg-error/20";
                textColor = "text-error";
                iconColor = "#EF4444";
              }

              const [baseCurrency, quoteCurrency] = safeSplitCurrencyPair(
                trade.currency_pair
              );

              return (
                <View
                  key={trade.id}
                  className="flex-row items-center justify-between bg-bg-primary rounded-xl p-4 mb-2"
                >
                  <View className="flex-row items-center flex-1">
                    <View className={`${bgColor} rounded-full p-2 mr-3`}>
                      <Ionicons
                        name={
                          trade.direction === "LONG"
                            ? "trending-up"
                            : "trending-down"
                        }
                        size={16}
                        color={iconColor}
                      />
                    </View>
                    <View className="flex-1">
                      <View className="flex-row items-center mb-1">
                        <Text className="text-base mr-1">
                          {getCurrencyFlag(baseCurrency)}
                        </Text>
                        <Text className="text-base text-txt-secondary mr-1">
                          /
                        </Text>
                        <Text className="text-base mr-2">
                          {getCurrencyFlag(quoteCurrency)}
                        </Text>
                        <Text className="text-txt-primary text-base font-bold">
                          {trade.currency_pair || "N/A"}
                        </Text>
                      </View>
                      <Text className="text-txt-secondary text-xs">
                        {safeFormatDate(trade.created_at)}
                      </Text>
                    </View>
                  </View>
                  <View className={`px-4 py-1 rounded-full ${bgColor}`}>
                    <Text className={`text-xs font-bold ${textColor}`}>
                      {result}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Monthly P&L Chart (PREMIUM) */}
        {isPremium && monthlyPnL && monthlyPnL.length > 0 && (
          <View className="bg-bg-secondary rounded-2xl p-4 mb-4">
            <Text className="text-txt-primary text-lg font-bold mb-2">
              Monthly P&L
            </Text>
            <Text className="text-txt-secondary text-sm mb-4">
              Last 6 months performance
            </Text>

            <View className="flex-row items-end justify-around h-48">
              {monthlyPnL.slice(-6).map((item, index) => {
                const isPositive = item.profit > 0;
                const maxProfit = Math.max(
                  ...monthlyPnL.slice(-6).map((m) => Math.abs(m.profit))
                );
                const height =
                  maxProfit > 0
                    ? Math.min((Math.abs(item.profit) / maxProfit) * 100, 100)
                    : 10;

                return (
                  <View key={index} className="items-center flex-1 mx-1">
                    <View className="flex-1 justify-end w-full">
                      <View
                        className={`${
                          isPositive ? "bg-accent-cyan" : "bg-error"
                        } rounded-t-lg w-full`}
                        style={{ height: `${height}%` }}
                      />
                    </View>
                    <Text
                      className={`text-xs font-bold mt-2 ${
                        isPositive ? "text-accent-cyan" : "text-error"
                      }`}
                    >
                      ${Math.abs(item.profit).toFixed(0)}
                    </Text>
                    <Text className="text-txt-secondary text-xs mt-1">
                      {item.month}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Trading Calendar (PREMIUM) */}
        {isPremium && (
          <View className="bg-bg-secondary rounded-2xl p-4 mb-4">
            <View className="flex-row items-center mb-4">
              <Ionicons name="calendar" size={24} color="#fff" />
              <Text className="text-txt-primary text-xl font-bold ml-2">
                Trading Calendar
              </Text>
            </View>

            <View className="flex-row items-center justify-between mb-4">
              <TouchableOpacity
                onPress={goToToday}
                className="bg-info/60 px-4 py-2 rounded-lg"
              >
                <Text className="text-bg-primary font-bold">TODAY</Text>
              </TouchableOpacity>

              <View className="flex-row items-center">
                <TouchableOpacity
                  onPress={() => changeMonth(-1)}
                  className="p-2"
                >
                  <Ionicons name="chevron-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text className="text-txt-primary text-lg font-bold mx-4">
                  {currentMonth.toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  })}
                </Text>
                <TouchableOpacity
                  onPress={() => changeMonth(1)}
                  className="p-2"
                >
                  <Ionicons name="chevron-forward" size={24} color="#fff" />
                </TouchableOpacity>
              </View>

              <View className="w-20" />
            </View>

            <View className="flex-row mb-2">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <View key={day} className="w-[14%] items-center">
                  <Text className="text-txt-secondary text-xs font-bold">
                    {day}
                  </Text>
                </View>
              ))}
            </View>

            <View className="flex-row flex-wrap">{renderCalendar()}</View>

            {weeklySummary.length > 0 && (
              <View className="mt-4 pt-4 border-t border-bg-primary">
                <Text className="text-txt-primary text-sm font-bold mb-2">
                  Weekly Summary
                </Text>
                <View className="flex-row justify-between">
                  {weeklySummary.map((week) => (
                    <View
                      key={week.week}
                      className={`items-center flex-1 mx-1 py-2 px-1 rounded-lg ${
                        week.profit > 0
                          ? "bg-accent-cyan/10 border border-accent-cyan/30"
                          : week.profit < 0
                            ? "bg-error/10 border border-error/30"
                            : "bg-bg-primary border border-border"
                      }`}
                    >
                      <Text className="text-txt-secondary text-xs mb-1">
                        W{week.week}
                      </Text>
                      <Text
                        className={`text-sm font-bold ${
                          week.profit > 0
                            ? "text-accent-cyan"
                            : week.profit < 0
                              ? "text-error"
                              : "text-txt-secondary"
                        }`}
                      >
                        {week.profit !== 0
                          ? `$${
                              Math.abs(week.profit) >= 1000
                                ? (Math.abs(week.profit) / 1000).toFixed(1) +
                                  "K"
                                : Math.abs(week.profit).toFixed(0)
                            }`
                          : "$0"}
                      </Text>
                      {week.days > 0 && (
                        <Ionicons
                          name={
                            week.profit > 0
                              ? "trending-up"
                              : week.profit < 0
                                ? "trending-down"
                                : "remove"
                          }
                          size={12}
                          color={
                            week.profit > 0
                              ? "#00F5D4"
                              : week.profit < 0
                                ? "#EF4444"
                                : "#8B95A5"
                          }
                        />
                      )}
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Day Details Modal (PREMIUM) */}
      {renderDayModal()}
    </ScrollView>
  );
}
