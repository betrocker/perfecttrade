import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Modal, ScrollView, Text, TouchableOpacity, View } from "react-native";

export default function HomeScreen() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Mock data - kasnije ćeš povezati sa pravim podacima
  const stats = {
    netProfitLoss: 2100.0,
    totalTrades: 2,
    winRate: 50,
    profitFactor: 46.42,
    avgConfluence: 125,
    totalProfit: 2100.0,
    winningTrades: 1,
    totalLoss: 45.24,
    losingTrades: 1,
    largestWin: 2100.0,
    largestLoss: 45.24,
    bestStreak: 1,
  };

  // Mock trading days data
  const tradingDays: Record<string, any> = {
    "2025-12-04": {
      profit: 2100,
      trades: [
        {
          pair: "GBP/CHF",
          code: "GB / CH",
          direction: "LONG",
          confluence: 135,
          total: 2100.0,
          result: "WIN",
        },
      ],
      winRate: 100,
    },
  };

  const monthlyPnL = [
    { month: "Nov 2025", profit: -45.24 },
    { month: "Dec 2025", profit: 2100.0 },
  ];

  const performingPairs = {
    best: { pair: "GBP/CHF", profit: 2100.0, trades: 1, winLoss: "1/0" },
    worst: { pair: "AUD/CAD", loss: 45.24, trades: 1, winLoss: "0/1" },
  };

  const recentTrades = [
    { pair: "GBP/CHF", date: "12/3/2025", result: "WIN", code: "GB / CH" },
    { pair: "AUD/CAD", date: "11/26/2025", result: "LOSS", code: "AU / CA" },
  ];

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
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
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
    const dayData = tradingDays[dateKey];
    if (dayData) {
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

      let bgColor = "bg-[#2A3F54]"; // default - no trades
      if (dayData) {
        bgColor =
          dayData.profit > 0
            ? "bg-[#00F5D4]"
            : dayData.profit < 0
              ? "bg-[#FF6B9D]"
              : "bg-[#2A3F54]";
      }

      days.push(
        <TouchableOpacity
          key={day}
          className="w-[14%] aspect-square p-1"
          onPress={() => handleDayPress(dateKey)}
          disabled={!dayData}
        >
          <View
            className={`${bgColor} rounded-xl flex-1 justify-center items-center ${today ? "border-2 border-white" : ""}`}
          >
            <Text className="text-white text-base font-bold">{day}</Text>
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

  const getWeeklySummary = () => {
    // Calculate weekly summaries (mock data for now)
    const weeks = [
      { week: 1, profit: 2100, days: 1 },
      { week: 2, profit: 0, days: 0 },
      { week: 3, profit: 0, days: 0 },
    ];

    return weeks;
  };

  const renderDayModal = () => {
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
          <View className="bg-[#1B2838] rounded-t-3xl p-6">
            {/* Header */}
            <View className="flex-row justify-between items-center mb-6">
              <View>
                <Text className="text-white text-2xl font-bold mb-1">
                  {formatDateDisplay(selectedDate)}
                </Text>
                <View className="flex-row items-center">
                  <Text className="text-gray-400 text-sm mr-4">
                    {tradesCount} trade{tradesCount > 1 ? "s" : ""}
                  </Text>
                  <Text className="text-gray-400 text-sm mr-1">•</Text>
                  <Text className="text-gray-400 text-sm mr-4">
                    {dayData.winRate}% win rate
                  </Text>
                  <Text className="text-gray-400 text-sm mr-1">•</Text>
                  <Text
                    className={`text-sm font-bold ${totalProfit > 0 ? "text-[#00F5D4]" : "text-[#FF6B9D]"}`}
                  >
                    ${totalProfit.toLocaleString()}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                className="bg-[#2A3F54] rounded-full p-2"
              >
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Trades List */}
            <ScrollView className="max-h-96">
              {dayData.trades.map((trade: any, index: number) => (
                <View key={index} className="bg-[#2A3F54] rounded-2xl p-4 mb-3">
                  <View className="flex-row justify-between items-start mb-3">
                    <View className="flex-row items-center">
                      <View
                        className={`${trade.result === "WIN" ? "bg-[#00F5D4]/20" : "bg-[#FF6B9D]/20"} rounded-xl p-3 mr-3`}
                      >
                        <Ionicons
                          name={
                            trade.direction === "LONG"
                              ? "trending-up"
                              : "trending-down"
                          }
                          size={24}
                          color={trade.result === "WIN" ? "#00F5D4" : "#FF6B9D"}
                        />
                      </View>
                      <View>
                        <Text className="text-gray-400 text-xs mb-1">
                          {trade.code}
                        </Text>
                        <Text className="text-white text-xl font-bold">
                          {trade.pair}
                        </Text>
                        <Text className="text-gray-400 text-sm">
                          {trade.direction}
                        </Text>
                      </View>
                    </View>
                    <View
                      className={`px-4 py-2 rounded-full ${
                        trade.result === "WIN"
                          ? "bg-[#00F5D4]/20"
                          : "bg-[#FF6B9D]/20"
                      }`}
                    >
                      <Text
                        className={`text-sm font-bold ${
                          trade.result === "WIN"
                            ? "text-[#00F5D4]"
                            : "text-[#FF6B9D]"
                        }`}
                      >
                        {trade.result}
                      </Text>
                    </View>
                  </View>

                  <View className="border-t border-[#1B2838] pt-3">
                    <View className="flex-row justify-between items-center mb-2">
                      <Text className="text-gray-400 text-sm">Confluence:</Text>
                      <Text className="text-white text-base font-bold">
                        {trade.confluence}%
                      </Text>
                    </View>
                    <View className="flex-row justify-between items-center">
                      <Text className="text-gray-400 text-sm">TOTAL:</Text>
                      <Text
                        className={`text-2xl font-bold ${
                          trade.result === "WIN"
                            ? "text-[#00F5D4]"
                            : "text-[#FF6B9D]"
                        }`}
                      >
                        ${trade.total.toLocaleString()}
                      </Text>
                    </View>
                  </View>

                  {/* View Details Button */}
                  <TouchableOpacity className="bg-[#3B5A7D] rounded-xl p-3 mt-3 flex-row items-center justify-center">
                    <Ionicons name="eye-outline" size={20} color="#7BA5D6" />
                    <Text className="text-[#7BA5D6] font-bold ml-2">
                      View Details
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <ScrollView className="flex-1 bg-[#1B2838]">
      <View className="p-4">
        {/* Trading Calendar */}
        <View className="bg-[#2A3F54] rounded-2xl p-4 mb-4">
          <View className="flex-row items-center mb-4">
            <Ionicons name="calendar" size={24} color="#fff" />
            <Text className="text-white text-xl font-bold ml-2">
              Trading Calendar
            </Text>
          </View>

          {/* Calendar Header */}
          <View className="flex-row items-center justify-between mb-4">
            <TouchableOpacity
              onPress={goToToday}
              className="bg-[#1B2838] px-4 py-2 rounded-lg"
            >
              <Text className="text-white font-bold">TODAY</Text>
            </TouchableOpacity>

            <View className="flex-row items-center">
              <TouchableOpacity onPress={() => changeMonth(-1)} className="p-2">
                <Ionicons name="chevron-back" size={24} color="#fff" />
              </TouchableOpacity>
              <Text className="text-white text-lg font-bold mx-4">
                {currentMonth.toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })}
              </Text>
              <TouchableOpacity onPress={() => changeMonth(1)} className="p-2">
                <Ionicons name="chevron-forward" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <View className="w-20" />
          </View>

          {/* Day Names */}
          <View className="flex-row mb-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <View key={day} className="w-[14%] items-center">
                <Text className="text-gray-400 text-xs font-bold">{day}</Text>
              </View>
            ))}
          </View>

          {/* Calendar Grid */}
          <View className="flex-row flex-wrap">{renderCalendar()}</View>

          {/* Weekly Summary */}
          <View className="mt-4 pt-4 border-t border-[#1B2838]">
            <Text className="text-white text-base font-bold mb-3">
              Weekly Summary
            </Text>
            {getWeeklySummary().map((week) => (
              <View
                key={week.week}
                className="bg-[#1B2838] rounded-xl p-3 mb-2"
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <Text className="text-white font-bold mr-2">
                      Week {week.week}
                    </Text>
                    {week.profit > 0 && (
                      <Ionicons name="trending-up" size={16} color="#00F5D4" />
                    )}
                  </View>
                  <View className="items-end">
                    <Text
                      className={`text-xl font-bold ${week.profit > 0 ? "text-[#00F5D4]" : "text-gray-400"}`}
                    >
                      {week.profit > 0
                        ? `$${week.profit.toLocaleString()}`
                        : "$0"}
                    </Text>
                    <Text className="text-gray-400 text-xs">
                      {week.days} day{week.days !== 1 ? "s" : ""}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Monthly P&L Chart */}
        <View className="bg-[#2A3F54] rounded-2xl p-4 mb-4">
          <Text className="text-white text-lg font-bold mb-2">Monthly P&L</Text>
          <Text className="text-gray-400 text-sm mb-4">
            Last 6 months performance
          </Text>

          <View className="flex-row items-end justify-around h-48">
            {monthlyPnL.map((item, index) => {
              const isPositive = item.profit > 0;
              const height = Math.min(Math.abs(item.profit) / 30, 100);

              return (
                <View key={index} className="items-center flex-1 mx-1">
                  <View className="flex-1 justify-end w-full">
                    <View
                      className={`${isPositive ? "bg-[#00F5D4]" : "bg-[#FF6B9D]"} rounded-t-lg w-full`}
                      style={{ height: `${height}%` }}
                    />
                  </View>
                  <Text
                    className={`text-xs font-bold mt-2 ${isPositive ? "text-[#00F5D4]" : "text-[#FF6B9D]"}`}
                  >
                    ${Math.abs(item.profit).toFixed(2)}
                  </Text>
                  <Text className="text-gray-400 text-xs mt-1">
                    {item.month}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Header */}
        <Text className="text-white text-3xl font-bold mb-1">
          Trading Dashboard
        </Text>
        <Text className="text-gray-400 text-base mb-6">
          Your trading performance at a glance
        </Text>

        {/* Net Profit & Loss Card */}
        <View className="bg-[#1E3A3A] rounded-2xl p-6 mb-4">
          <View className="flex-row justify-between items-start mb-4">
            <View>
              <Text className="text-gray-400 text-sm mb-2">
                Net Profit & Loss
              </Text>
              <Text className="text-[#00F5D4] text-5xl font-bold mb-2">
                ${stats.netProfitLoss.toLocaleString()}
              </Text>
              <Text className="text-[#00F5D4] text-base">
                + {stats.totalTrades} trades completed
              </Text>
            </View>
            <View className="bg-[#00F5D4]/20 rounded-2xl p-4">
              <Ionicons name="cash" size={32} color="#00F5D4" />
            </View>
          </View>

          <View className="flex-row justify-between">
            <View className="bg-[#2A3F54] rounded-xl p-4 flex-1 mr-2">
              <Text className="text-gray-400 text-xs mb-1">Win Rate</Text>
              <Text className="text-white text-2xl font-bold">
                {stats.winRate}%
              </Text>
            </View>
            <View className="bg-[#2A3F54] rounded-xl p-4 flex-1 mx-2">
              <Text className="text-gray-400 text-xs mb-1">Profit Factor</Text>
              <Text className="text-white text-2xl font-bold">
                {stats.profitFactor}
              </Text>
            </View>
            <View className="bg-[#2A3F54] rounded-xl p-4 flex-1 ml-2">
              <Text className="text-gray-400 text-xs mb-1">Avg Confluence</Text>
              <Text className="text-white text-2xl font-bold">
                {stats.avgConfluence}%
              </Text>
            </View>
          </View>
        </View>

        {/* Profit/Loss Cards Row */}
        <View className="flex-row mb-4">
          <View className="bg-[#1E3A3A] rounded-2xl p-4 flex-1 mr-2">
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-gray-400 text-sm">Total Profit</Text>
              <Ionicons name="trending-up" size={20} color="#00F5D4" />
            </View>
            <Text className="text-[#00F5D4] text-3xl font-bold mb-1">
              ${stats.totalProfit.toLocaleString()}
            </Text>
            <Text className="text-[#00F5D4] text-sm">
              {stats.winningTrades} winning trades
            </Text>
          </View>

          <View className="bg-[#3A2838] rounded-2xl p-4 flex-1 ml-2">
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-gray-400 text-sm">Total Loss</Text>
              <Ionicons name="trending-down" size={20} color="#FF6B9D" />
            </View>
            <Text className="text-[#FF6B9D] text-3xl font-bold mb-1">
              ${stats.totalLoss}
            </Text>
            <Text className="text-[#FF6B9D] text-sm">
              {stats.losingTrades} losing trades
            </Text>
          </View>
        </View>

        {/* Stats Cards Grid */}
        <View className="flex-row flex-wrap justify-between mb-4">
          <View className="bg-[#2A3F54] rounded-2xl p-4 w-[48%] mb-3">
            <View className="bg-[#00F5D4]/20 rounded-xl p-3 w-12 h-12 items-center justify-center mb-3">
              <Ionicons name="ribbon" size={24} color="#00F5D4" />
            </View>
            <Text className="text-gray-400 text-sm mb-1">Largest Win</Text>
            <Text className="text-white text-2xl font-bold">
              ${stats.largestWin.toLocaleString()}
            </Text>
          </View>

          <View className="bg-[#2A3F54] rounded-2xl p-4 w-[48%] mb-3">
            <View className="bg-[#FF6B9D]/20 rounded-xl p-3 w-12 h-12 items-center justify-center mb-3">
              <Ionicons name="radio-button-on" size={24} color="#FF6B9D" />
            </View>
            <Text className="text-gray-400 text-sm mb-1">Largest Loss</Text>
            <Text className="text-white text-2xl font-bold">
              ${stats.largestLoss}
            </Text>
          </View>

          <View className="bg-[#2A3F54] rounded-2xl p-4 w-[48%]">
            <View className="bg-[#FF6B9D]/20 rounded-xl p-3 w-12 h-12 items-center justify-center mb-3">
              <Ionicons name="flame" size={24} color="#FF6B9D" />
            </View>
            <Text className="text-gray-400 text-sm mb-1">Best Streak</Text>
            <Text className="text-white text-2xl font-bold">
              {stats.bestStreak}
            </Text>
          </View>

          <View className="bg-[#2A3F54] rounded-2xl p-4 w-[48%]">
            <View className="bg-[#8B95A5]/20 rounded-xl p-3 w-12 h-12 items-center justify-center mb-3">
              <Ionicons name="pulse" size={24} color="#8B95A5" />
            </View>
            <Text className="text-gray-400 text-sm mb-1">Total Trades</Text>
            <Text className="text-white text-2xl font-bold">
              {stats.totalTrades}
            </Text>
          </View>
        </View>

        {/* Best/Worst Performing Pairs */}
        <View className="flex-row mb-4">
          <View className="bg-[#1E3A3A] rounded-2xl p-4 flex-1 mr-2">
            <View className="flex-row items-center mb-3">
              <View className="bg-[#00F5D4]/20 rounded-full p-2 mr-2">
                <Ionicons name="trending-up" size={16} color="#00F5D4" />
              </View>
              <Text className="text-gray-400 text-sm">
                Best Performing Pair
              </Text>
            </View>
            <Text className="text-gray-400 text-xs mb-1">
              {performingPairs.best.pair.split("/")[0]} /{" "}
              {performingPairs.best.pair.split("/")[1]}
            </Text>
            <Text className="text-white text-2xl font-bold mb-4">
              {performingPairs.best.pair}
            </Text>
            <View className="flex-row justify-between">
              <View>
                <Text className="text-[#00F5D4] text-xl font-bold">
                  +${performingPairs.best.profit.toLocaleString()}
                </Text>
                <Text className="text-gray-400 text-xs">Total P&L</Text>
              </View>
              <View>
                <Text className="text-white text-xl font-bold">
                  {performingPairs.best.trades}
                </Text>
                <Text className="text-gray-400 text-xs">Trades</Text>
              </View>
              <View>
                <Text className="text-white text-xl font-bold">
                  {performingPairs.best.winLoss}
                </Text>
                <Text className="text-gray-400 text-xs">W/L</Text>
              </View>
            </View>
          </View>

          <View className="bg-[#3A2838] rounded-2xl p-4 flex-1 ml-2">
            <View className="flex-row items-center mb-3">
              <View className="bg-[#FF6B9D]/20 rounded-full p-2 mr-2">
                <Ionicons name="trending-down" size={16} color="#FF6B9D" />
              </View>
              <Text className="text-gray-400 text-sm">
                Worst Performing Pair
              </Text>
            </View>
            <Text className="text-gray-400 text-xs mb-1">
              {performingPairs.worst.pair.split("/")[0]} /{" "}
              {performingPairs.worst.pair.split("/")[1]}
            </Text>
            <Text className="text-white text-2xl font-bold mb-4">
              {performingPairs.worst.pair}
            </Text>
            <View className="flex-row justify-between">
              <View>
                <Text className="text-[#FF6B9D] text-xl font-bold">
                  -${performingPairs.worst.loss}
                </Text>
                <Text className="text-gray-400 text-xs">Total P&L</Text>
              </View>
              <View>
                <Text className="text-white text-xl font-bold">
                  {performingPairs.worst.trades}
                </Text>
                <Text className="text-gray-400 text-xs">Trades</Text>
              </View>
              <View>
                <Text className="text-white text-xl font-bold">
                  {performingPairs.worst.winLoss}
                </Text>
                <Text className="text-gray-400 text-xs">W/L</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Performance Breakdown */}
        <View className="bg-[#2A3F54] rounded-2xl p-4 mb-4">
          <View className="flex-row items-center mb-4">
            <Ionicons name="bar-chart" size={20} color="#8B95A5" />
            <Text className="text-white text-lg font-bold ml-2">
              Performance Breakdown
            </Text>
          </View>

          <View className="mb-4">
            <View className="flex-row justify-between mb-2">
              <Text className="text-gray-400 text-sm">Win Rate</Text>
              <Text className="text-white text-sm font-bold">
                {stats.winRate}%
              </Text>
            </View>
            <View className="bg-[#1B2838] rounded-full h-2">
              <View
                className="bg-[#00F5D4] rounded-full h-2"
                style={{ width: `${stats.winRate}%` }}
              />
            </View>
          </View>

          <View className="flex-row justify-between mb-4">
            <View className="bg-[#1E3A3A] rounded-xl p-3 flex-1 mr-2">
              <Text className="text-gray-400 text-xs mb-1">Long Trades</Text>
              <Text className="text-[#00F5D4] text-2xl font-bold mb-1">
                {stats.winRate}%
              </Text>
              <Text className="text-gray-400 text-xs">Win Rate</Text>
            </View>
            <View className="bg-[#3A2838] rounded-xl p-3 flex-1 ml-2">
              <Text className="text-gray-400 text-xs mb-1">Short Trades</Text>
              <Text className="text-[#FF6B9D] text-2xl font-bold mb-1">0%</Text>
              <Text className="text-gray-400 text-xs">Win Rate</Text>
            </View>
          </View>

          <View className="flex-row justify-around">
            <View className="items-center">
              <Text className="text-[#00F5D4] text-3xl font-bold">1</Text>
              <Text className="text-gray-400 text-xs">Wins</Text>
            </View>
            <View className="items-center">
              <Text className="text-[#FF6B9D] text-3xl font-bold">1</Text>
              <Text className="text-gray-400 text-xs">Losses</Text>
            </View>
            <View className="items-center">
              <Text className="text-gray-400 text-3xl font-bold">0</Text>
              <Text className="text-gray-400 text-xs">Pending</Text>
            </View>
          </View>
        </View>

        {/* Recent Trades */}
        <View className="bg-[#2A3F54] rounded-2xl p-4 mb-6">
          <View className="flex-row items-center mb-4">
            <Ionicons name="calendar" size={20} color="#8B95A5" />
            <Text className="text-white text-lg font-bold ml-2">
              Recent Trades
            </Text>
          </View>

          {recentTrades.map((trade, index) => (
            <View
              key={index}
              className="flex-row items-center justify-between bg-[#1B2838] rounded-xl p-4 mb-2"
            >
              <View className="flex-row items-center flex-1">
                <View className="bg-[#00F5D4]/20 rounded-full p-2 mr-3">
                  <Ionicons name="trending-up" size={16} color="#00F5D4" />
                </View>
                <View>
                  <Text className="text-gray-400 text-xs">{trade.code}</Text>
                  <Text className="text-white text-base font-bold">
                    {trade.pair}
                  </Text>
                  <Text className="text-gray-400 text-xs">{trade.date}</Text>
                </View>
              </View>
              <View
                className={`px-4 py-1 rounded-full ${
                  trade.result === "WIN" ? "bg-[#00F5D4]/20" : "bg-[#FF6B9D]/20"
                }`}
              >
                <Text
                  className={`text-xs font-bold ${
                    trade.result === "WIN" ? "text-[#00F5D4]" : "text-[#FF6B9D]"
                  }`}
                >
                  {trade.result}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Day Details Modal */}
      {renderDayModal()}
    </ScrollView>
  );
}
