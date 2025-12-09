import { Trade } from "@/types/trade";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

type TradeCardProps = {
  trade: Trade; // ← Koristi importovani tip umesto lokalnog
  onPress: () => void;
};

export default function TradeCard({ trade, onPress }: TradeCardProps) {
  const getStatusBadge = () => {
    if (trade.status === "CLOSED") {
      if (trade.profit_loss === null || trade.profit_loss === undefined) {
        return {
          label: "CLOSED",
          bgClass: "bg-txt-tertiary/20",
          textClass: "text-txt-secondary",
        };
      }
      if (trade.profit_loss > 0) {
        return {
          label: "WIN",
          bgClass: "bg-success/20",
          textClass: "text-success",
        };
      } else if (trade.profit_loss < 0) {
        return {
          label: "LOSS",
          bgClass: "bg-error/20",
          textClass: "text-error",
        };
      } else {
        return {
          label: "BREAKEVEN",
          bgClass: "bg-warning/20",
          textClass: "text-warning",
        };
      }
    }
    return {
      label: "ACTIVE",
      bgClass: "bg-info/20",
      textClass: "text-info",
    };
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "numeric",
      day: "numeric",
      year: "numeric",
    });
  };

  const statusBadge = getStatusBadge();

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className="bg-bg-secondary rounded-2xl p-5 border border-border"
    >
      {/* Header */}
      <View className="flex-row items-start justify-between mb-4">
        <View className="flex-row items-center" style={{ gap: 12 }}>
          {/* Icon */}
          <View
            className={`rounded-xl p-3 ${
              trade.direction === "LONG" ? "bg-success/15" : "bg-error/15"
            }`}
          >
            <Ionicons
              name={
                trade.direction === "LONG" ? "trending-up" : "trending-down"
              }
              size={24}
              color={trade.direction === "LONG" ? "#10B981" : "#EF4444"}
            />
          </View>

          {/* Pair & Direction */}
          <View>
            <View className="flex-row items-center" style={{ gap: 6 }}>
              <Text className="text-txt-primary text-xl font-bold">
                {trade.currency_pair.split("/")[0]} /{" "}
                {trade.currency_pair.split("/")[1] || "CHF"}
              </Text>
            </View>
            <Text
              className={`text-base font-bold ${
                trade.direction === "LONG" ? "text-success" : "text-error"
              }`}
            >
              {trade.direction}
            </Text>
          </View>
        </View>

        {/* Status Badge */}
        <View className={`${statusBadge.bgClass} px-3 py-1.5 rounded-lg`}>
          <Text className={`${statusBadge.textClass} text-xs font-bold`}>
            {statusBadge.label}
          </Text>
        </View>
      </View>

      {/* Stats - levo label, desno vrednost */}
      <View style={{ gap: 12, marginBottom: 16 }}>
        <View className="flex-row items-center justify-between">
          <Text className="text-txt-tertiary text-sm">Confluence:</Text>
          <Text className="text-accent-cyan text-base font-bold">
            {trade.confluence_score}%
          </Text>
        </View>

        <View className="flex-row items-center justify-between">
          <Text className="text-txt-tertiary text-sm">Date:</Text>
          <Text className="text-txt-primary text-base">
            {formatDate(trade.created_at)}
          </Text>
        </View>

        {trade.status === "CLOSED" && trade.profit_loss !== null && (
          <View className="flex-row items-center justify-between">
            <Text className="text-txt-tertiary text-sm">TOTAL:</Text>
            <Text
              className={`text-xl font-bold ${
                trade.profit_loss >= 0 ? "text-success" : "text-error"
              }`}
            >
              {trade.profit_loss >= 0 ? "+" : ""}${trade.profit_loss.toFixed(2)}
            </Text>
          </View>
        )}
      </View>

      {/* Notes */}
      {trade.notes && (
        <Text className="text-txt-secondary text-sm mb-4" numberOfLines={2}>
          {trade.notes}
        </Text>
      )}
    </TouchableOpacity>
  );
}
