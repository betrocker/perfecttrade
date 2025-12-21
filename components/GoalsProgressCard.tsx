import { GoalsProgress } from "@/lib/goalsTrackingService";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, View } from "react-native";

interface GoalsProgressCardProps {
  progress: GoalsProgress;
}

export default function GoalsProgressCard({
  progress,
}: GoalsProgressCardProps) {
  return (
    <View className="bg-bg-secondary rounded-2xl p-4 mb-4">
      <View className="flex-row items-center mb-4">
        <Ionicons name="trophy" size={20} color="#F59E0B" />
        <Text className="text-txt-primary text-lg font-bold ml-2">
          Goals Progress
        </Text>
      </View>

      {/* Monthly Target Progress */}
      <View className="mb-4">
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-txt-secondary text-sm">Monthly Target</Text>
          <View className="flex-row items-center">
            <Text
              className={`text-sm font-bold mr-1 ${
                progress.onTrackForMonthly ? "text-accent-cyan" : "text-warning"
              }`}
            >
              ${progress.monthlyProgress.toLocaleString()} / $
              {progress.monthlyTarget.toLocaleString()}
            </Text>
            <Ionicons
              name={
                progress.onTrackForMonthly ? "checkmark-circle" : "alert-circle"
              }
              size={16}
              color={progress.onTrackForMonthly ? "#00F5D4" : "#F59E0B"}
            />
          </View>
        </View>
        <View className="bg-bg-primary rounded-full h-3 overflow-hidden">
          <View
            className={`h-3 rounded-full ${
              progress.monthlyProgressPercent >= 100
                ? "bg-accent-cyan"
                : progress.monthlyProgressPercent >= 75
                  ? "bg-success"
                  : progress.monthlyProgressPercent >= 50
                    ? "bg-warning"
                    : "bg-error"
            }`}
            style={{
              width: `${Math.min(progress.monthlyProgressPercent, 100)}%`,
            }}
          />
        </View>
        <View className="flex-row justify-between mt-1">
          <Text className="text-txt-tertiary text-xs">
            {progress.daysLeftInMonth} days left
          </Text>
          <Text className="text-txt-tertiary text-xs">
            {progress.monthlyProgressPercent}%
          </Text>
        </View>
        {!progress.onTrackForMonthly && (
          <View className="bg-warning/10 rounded-lg p-2 mt-2">
            <Text className="text-warning text-xs">
              Need ${progress.dailyTargetRemaining.toFixed(0)}/day to reach
              monthly target
            </Text>
          </View>
        )}
      </View>

      {/* Daily Loss Tracker */}
      <View className="mb-4">
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-txt-secondary text-sm">Today's Loss Limit</Text>
          <View className="flex-row items-center">
            <Text
              className={`text-sm font-bold mr-1 ${
                progress.dailyLossExceeded
                  ? "text-error"
                  : progress.dailyLossWarning
                    ? "text-warning"
                    : "text-success"
              }`}
            >
              ${progress.todayLoss.toLocaleString()} / $
              {progress.maxDailyLoss.toLocaleString()}
            </Text>
            <Ionicons
              name={
                progress.dailyLossExceeded
                  ? "close-circle"
                  : progress.dailyLossWarning
                    ? "warning"
                    : "checkmark-circle"
              }
              size={16}
              color={
                progress.dailyLossExceeded
                  ? "#EF4444"
                  : progress.dailyLossWarning
                    ? "#F59E0B"
                    : "#10B981"
              }
            />
          </View>
        </View>
        <View className="bg-bg-primary rounded-full h-3 overflow-hidden">
          <View
            className={`h-3 rounded-full ${
              progress.dailyLossExceeded
                ? "bg-error"
                : progress.dailyLossWarning
                  ? "bg-warning"
                  : "bg-success"
            }`}
            style={{
              width: `${Math.min(progress.dailyLossPercent, 100)}%`,
            }}
          />
        </View>
        {progress.dailyLossExceeded && (
          <View className="bg-error/10 rounded-lg p-2 mt-2">
            <Text className="text-error text-xs font-bold">
              ⚠️ STOP TRADING - Daily loss limit exceeded!
            </Text>
          </View>
        )}
        {progress.dailyLossWarning && !progress.dailyLossExceeded && (
          <View className="bg-warning/10 rounded-lg p-2 mt-2">
            <Text className="text-warning text-xs">
              ⚠️ Approaching daily loss limit - Trade carefully!
            </Text>
          </View>
        )}
      </View>

      {/* Win Rate Progress */}
      <View className="mb-4">
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-txt-secondary text-sm">Win Rate Goal</Text>
          <View className="flex-row items-center">
            <Text
              className={`text-sm font-bold mr-1 ${
                progress.onTrackForWinRate ? "text-accent-cyan" : "text-error"
              }`}
            >
              {progress.currentWinRate}% / {progress.winRateGoal}%
            </Text>
            <Ionicons
              name={
                progress.onTrackForWinRate ? "checkmark-circle" : "close-circle"
              }
              size={16}
              color={progress.onTrackForWinRate ? "#00F5D4" : "#EF4444"}
            />
          </View>
        </View>
        <View className="bg-bg-primary rounded-full h-3 overflow-hidden">
          <View
            className={`h-3 rounded-full ${
              progress.onTrackForWinRate ? "bg-accent-cyan" : "bg-error"
            }`}
            style={{
              width: `${Math.min((progress.currentWinRate / progress.winRateGoal) * 100, 100)}%`,
            }}
          />
        </View>
        {!progress.onTrackForWinRate && (
          <View className="bg-error/10 rounded-lg p-2 mt-2">
            <Text className="text-error text-xs">
              {Math.abs(progress.winRateGap)}% below target - Review your
              strategy
            </Text>
          </View>
        )}
      </View>

      {/* Trades Count Today */}
      <View>
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-txt-secondary text-sm">Today's Trades</Text>
          <View className="flex-row items-center">
            <Text
              className={`text-sm font-bold mr-1 ${
                progress.maxTradesReached ? "text-error" : "text-txt-primary"
              }`}
            >
              {progress.todayTradesCount} / {progress.maxTradesPerDay}
            </Text>
            <Ionicons
              name={progress.maxTradesReached ? "close-circle" : "time"}
              size={16}
              color={progress.maxTradesReached ? "#EF4444" : "#8B95A5"}
            />
          </View>
        </View>
        <View className="bg-bg-primary rounded-full h-3 overflow-hidden">
          <View
            className={`h-3 rounded-full ${
              progress.maxTradesReached ? "bg-error" : "bg-info"
            }`}
            style={{
              width: `${Math.min((progress.todayTradesCount / progress.maxTradesPerDay) * 100, 100)}%`,
            }}
          />
        </View>
        {progress.maxTradesReached && (
          <View className="bg-error/10 rounded-lg p-2 mt-2">
            <Text className="text-error text-xs font-bold">
              ⚠️ Maximum trades for today reached!
            </Text>
          </View>
        )}
        {!progress.maxTradesReached && progress.tradesRemainingToday <= 2 && (
          <View className="bg-warning/10 rounded-lg p-2 mt-2">
            <Text className="text-warning text-xs">
              Only {progress.tradesRemainingToday} trade(s) remaining today
            </Text>
          </View>
        )}
      </View>

      {/* Projection */}
      <View className="bg-bg-primary rounded-lg p-3 mt-4">
        <Text className="text-txt-secondary text-xs mb-1">
          Monthly Projection
        </Text>
        <Text
          className={`text-xl font-bold ${
            progress.projectedMonthlyProfit >= progress.monthlyTarget
              ? "text-accent-cyan"
              : "text-warning"
          }`}
        >
          ${progress.projectedMonthlyProfit.toFixed(0)}
        </Text>
        <Text className="text-txt-tertiary text-xs mt-1">
          Based on ${progress.avgDailyProfit.toFixed(0)}/day average
        </Text>
      </View>
    </View>
  );
}
