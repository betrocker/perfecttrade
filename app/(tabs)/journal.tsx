import TradeCard from "@/components/trade/TradeCard";
import TradeDetailModal from "@/components/trade/TradeDetailModal";
import { supabase } from "@/lib/supabase";
import { Trade } from "@/types/trade";
import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type TradeStatus = "ALL" | "ACTIVE" | "WIN" | "LOSS" | "BREAKEVEN";

export default function JournalScreen() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [filteredTrades, setFilteredTrades] = useState<Trade[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<TradeStatus>("ALL");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);

  const loadTrades = useCallback(async () => {
    console.log("📊 Loading trades...");
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      console.log("👤 User:", user?.id);

      if (authError) {
        console.error("❌ Auth error:", authError);
        setLoading(false);
        return;
      }

      if (!user) {
        console.log("⚠️ No user found");
        setTrades([]);
        setLoading(false);
        return;
      }

      console.log("🔍 Fetching trades for user:", user.id);

      const { data, error } = await supabase
        .from("trades")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error(
          "❌ Supabase error:",
          error.message,
          error.details,
          error.hint
        );
        setTrades([]);
      } else {
        console.log("✅ Trades loaded:", data?.length || 0);
        setTrades(data || []);
      }
    } catch (error: any) {
      console.error("💥 Caught error:", error.message || error);
      setTrades([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadTrades();
  }, [loadTrades]);

  useEffect(() => {
    if (selectedStatus === "ALL") {
      setFilteredTrades(trades);
    } else if (selectedStatus === "ACTIVE") {
      // PLANNED ili OPEN
      setFilteredTrades(
        trades.filter((t) => t.status === "PLANNED" || t.status === "OPEN")
      );
    } else if (selectedStatus === "WIN") {
      setFilteredTrades(
        trades.filter((t) => t.status === "CLOSED" && (t.profit_loss || 0) > 0)
      );
    } else if (selectedStatus === "LOSS") {
      setFilteredTrades(
        trades.filter((t) => t.status === "CLOSED" && (t.profit_loss || 0) < 0)
      );
    } else if (selectedStatus === "BREAKEVEN") {
      setFilteredTrades(
        trades.filter((t) => t.status === "CLOSED" && t.profit_loss === 0)
      );
    }
  }, [selectedStatus, trades]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void loadTrades();
  }, [loadTrades]);

  const handleDeleteTrade = async (tradeId: string) => {
    Alert.alert("Delete Trade", "Are you sure you want to delete this trade?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const { error } = await supabase
              .from("trades")
              .delete()
              .eq("id", tradeId);

            if (error) throw error;

            setTrades(trades.filter((t) => t.id !== tradeId));
            setSelectedTrade(null);
            Alert.alert("Success", "Trade deleted successfully");
          } catch (error: any) {
            console.error("Error deleting trade:", error);
            Alert.alert("Error", "Failed to delete trade");
          }
        },
      },
    ]);
  };

  const FilterButton = ({
    status,
    label,
  }: {
    status: TradeStatus;
    label: string;
  }) => {
    const isSelected = selectedStatus === status;
    return (
      <TouchableOpacity
        onPress={() => setSelectedStatus(status)}
        style={{
          paddingHorizontal: 10,
          paddingVertical: 6,
          borderRadius: 20,
          backgroundColor: isSelected
            ? "rgba(0, 245, 212, 0.15)"
            : "transparent",
          borderWidth: 1,
          borderColor: isSelected ? "#00F5D4" : "#374B5F",
        }}
      >
        <Text
          style={{
            fontWeight: "600",
            fontSize: 12,
            color: isSelected ? "#00F5D4" : "#9CA3AF",
          }}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View className="flex-1 bg-bg-primary items-center justify-center">
        <ActivityIndicator size="large" color="#00F5D4" />
        <Text className="text-txt-secondary mt-4">Loading trades...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-bg-primary">
      {/* Header */}
      <View className="px-4 pt-14 pb-6">
        <Text className="text-txt-primary text-3xl font-bold">
          Trading History
        </Text>
        <Text className="text-txt-secondary text-md mt-1">
          View and manage your trading journal
        </Text>
      </View>

      {/* Filters */}
      <View className="px-4 pb-4">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 10 }}
        >
          <FilterButton status="ALL" label="ALL" />
          <FilterButton status="ACTIVE" label="ACTIVE" />
          <FilterButton status="WIN" label="WIN" />
          <FilterButton status="LOSS" label="LOSS" />
          <FilterButton status="BREAKEVEN" label="BREAKEVEN" />
        </ScrollView>
      </View>

      {/* Trade List */}
      <ScrollView
        className="flex-1 px-4"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#00F5D4"
          />
        }
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {filteredTrades.length === 0 ? (
          <View className="items-center justify-center py-20">
            <Ionicons name="document-text-outline" size={64} color="#6B7280" />
            <Text className="text-txt-secondary text-lg mt-4">
              No trades found
            </Text>
            <Text className="text-txt-tertiary text-sm text-center px-8 mt-2">
              {selectedStatus === "ALL"
                ? "Start by creating your first trade from the Checklist tab"
                : `No ${selectedStatus.toLowerCase()} trades yet`}
            </Text>
          </View>
        ) : (
          <View style={{ gap: 16 }}>
            {filteredTrades.map((trade) => (
              <TradeCard
                key={trade.id}
                trade={trade}
                onPress={() => setSelectedTrade(trade)}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Trade Detail Modal */}
      {selectedTrade && (
        <TradeDetailModal
          visible={!!selectedTrade}
          trade={selectedTrade}
          onClose={() => setSelectedTrade(null)}
          onDelete={handleDeleteTrade}
          onUpdate={loadTrades}
        />
      )}
    </View>
  );
}
