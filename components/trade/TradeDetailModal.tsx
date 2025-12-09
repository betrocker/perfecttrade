import { supabase } from "@/lib/supabase";
import { getSetupCategory } from "@/lib/utils";
import { Trade } from "@/types/trade";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface TradeDetailModalProps {
  visible: boolean;
  trade: Trade;
  onClose: () => void;
  onDelete: (tradeId: string) => void;
  onUpdate: () => void;
}

type TabType = "update" | "summary";

// Currency flag helper
const getCurrencyFlag = (currency: string): string => {
  const flags: { [key: string]: string } = {
    EUR: "🇪🇺",
    USD: "🇺🇸",
    GBP: "🇬🇧",
    JPY: "🇯🇵",
    AUD: "🇦🇺",
    CAD: "🇨🇦",
    CHF: "🇨🇭",
    NZD: "🇳🇿",
    TRY: "🇹🇷",
    ZAR: "🇿🇦",
    MXN: "🇲🇽",
  };
  return flags[currency] || "🏳️";
};

export default function TradeDetailModal({
  visible,
  trade,
  onClose,
  onDelete,
  onUpdate,
}: TradeDetailModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>("update");
  const [tradeOutcome, setTradeOutcome] = useState<
    "Win" | "Loss" | "Break-Even"
  >("Win");
  const [profitAmount, setProfitAmount] = useState("");
  const [saving, setSaving] = useState(false);
  const [afterTradeImage, setAfterTradeImage] = useState<string | null>(null);
  const [uploadingAfter, setUploadingAfter] = useState(false);

  const setupCategory = getSetupCategory(trade.confluence_score);

  const isClosed = trade.status === "CLOSED";

  useEffect(() => {
    console.log(
      "🔍 Trade confluence_data:",
      JSON.stringify(trade.confluence_data, null, 2)
    );
  }, [trade.confluence_data]);

  const handleSaveChanges = async () => {
    if (!profitAmount) {
      Alert.alert("Error", "Please enter profit amount");
      return;
    }

    if (!afterTradeImage) {
      Alert.alert("Error", "Please upload after trade chart image");
      return;
    }

    setSaving(true);
    try {
      setUploadingAfter(true);
      const afterImageUrl = await uploadAfterImage(afterTradeImage);
      setUploadingAfter(false);

      if (!afterImageUrl) {
        Alert.alert("Error", "Failed to upload after trade image");
        setSaving(false);
        return;
      }

      const profitValue = parseFloat(profitAmount);
      const finalProfit =
        tradeOutcome === "Loss"
          ? -Math.abs(profitValue)
          : tradeOutcome === "Break-Even"
            ? 0
            : profitValue;

      const updates = {
        status: "CLOSED",
        profit_loss: finalProfit,
        after_trade_image_url: afterImageUrl,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("trades")
        .update(updates)
        .eq("id", trade.id);

      if (error) throw error;

      Alert.alert("Success", "Trade updated successfully");
      onUpdate();
      onClose();
    } catch (error: any) {
      console.error("Error updating trade:", error);
      Alert.alert("Error", "Failed to update trade");
    } finally {
      setSaving(false);
    }
  };

  const OutcomeButton = ({
    outcome,
    label,
  }: {
    outcome: string;
    label: string;
  }) => {
    const isSelected = tradeOutcome === outcome;

    let bgClass = "bg-transparent border-border";
    let textClass = "text-txt-secondary";

    if (isSelected) {
      if (outcome === "Win") {
        bgClass = "bg-success/20 border-success";
        textClass = "text-success";
      } else if (outcome === "Loss") {
        bgClass = "bg-error/20 border-error";
        textClass = "text-error";
      } else {
        bgClass = "bg-warning/20 border-warning";
        textClass = "text-warning";
      }
    }

    return (
      <TouchableOpacity
        onPress={() => setTradeOutcome(outcome as any)}
        className={`flex-1 py-3 rounded-lg border ${bgClass}`}
      >
        <Text className={`font-semibold text-center ${textClass}`}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  const pickAfterImage = async (useCamera: boolean = false) => {
    if (isClosed) return;

    let result;

    if (useCamera) {
      const permissionResult =
        await ImagePicker.requestCameraPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert("Permission Required", "Please allow camera access");
        return;
      }
      result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });
    } else {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert("Permission Required", "Please allow access to photos");
        return;
      }
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });
    }

    if (!result.canceled) {
      setAfterTradeImage(result.assets[0].uri);
    }
  };

  const uploadAfterImage = async (imageUri: string) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return null;

      const fileExt = imageUri.split(".").pop()?.toLowerCase() || "jpg";
      const fileName = `after-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      console.log("📤 Uploading after trade image to:", filePath);

      const response = await fetch(imageUri);
      if (!response.ok) return null;

      const arrayBuffer = await response.arrayBuffer();
      console.log("📦 After image size:", arrayBuffer.byteLength);

      if (arrayBuffer.byteLength === 0) return null;

      const { data, error } = await supabase.storage
        .from("trade-charts")
        .upload(filePath, arrayBuffer, {
          contentType: "image/jpeg",
          cacheControl: "3600",
          upsert: false,
        });

      if (error) {
        console.error("❌ After image upload error:", error);
        return null;
      }

      const { data: urlData } = supabase.storage
        .from("trade-charts")
        .getPublicUrl(filePath);

      console.log("✅ After image URL:", urlData.publicUrl);
      return urlData.publicUrl;
    } catch (error: any) {
      console.error("💥 After image upload error:", error);
      return null;
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Trade",
      "Are you sure you want to delete this trade? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            onDelete(trade.id);
            onClose();
          },
        },
      ]
    );
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/70">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1 justify-end"
        >
          <View
            className="bg-bg-primary rounded-t-3xl border-t border-border"
            style={{ height: "95%" }}
          >
            {/* Header */}
            <View className="flex-row justify-between items-center p-5 border-b border-border">
              <Text className="text-txt-primary text-2xl font-bold">
                Trade Details
              </Text>
              <View className="flex-row items-center" style={{ gap: 12 }}>
                {/* Delete Icon */}
                <TouchableOpacity
                  onPress={handleDelete}
                  className="w-10 h-10 bg-error/20 rounded-full items-center justify-center"
                >
                  <Ionicons name="trash-outline" size={20} color="#EF4444" />
                </TouchableOpacity>
                {/* Close Icon */}
                <TouchableOpacity
                  onPress={onClose}
                  className="w-10 h-10 bg-bg-tertiary rounded-full items-center justify-center"
                >
                  <Text className="text-txt-primary text-xl font-bold">×</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Segmented Control - iOS Style like Checklist */}
            <View className="px-4 pt-3 pb-2">
              <View
                style={{
                  borderRadius: 10,
                  backgroundColor: "rgba(118, 118, 128, 0.24)",
                  padding: 2,
                  flexDirection: "row",
                }}
              >
                <TouchableOpacity
                  onPress={() => setActiveTab("update")}
                  activeOpacity={0.8}
                  style={{ flex: 1, marginRight: 2 }}
                >
                  <View
                    style={{
                      paddingVertical: 8,
                      borderRadius: 7,
                      backgroundColor:
                        activeTab === "update"
                          ? "rgba(0, 245, 212, 0.15)"
                          : "transparent",
                      borderWidth: activeTab === "update" ? 1 : 0,
                      borderColor:
                        activeTab === "update"
                          ? "rgba(0, 245, 212, 0.4)"
                          : "transparent",
                    }}
                  >
                    <Text
                      style={{
                        textAlign: "center",
                        fontWeight: "600",
                        fontSize: 14,
                        color:
                          activeTab === "update"
                            ? "#00F5D4"
                            : "rgba(139, 149, 165, 0.8)",
                      }}
                    >
                      Update Trade
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setActiveTab("summary")}
                  activeOpacity={0.8}
                  style={{ flex: 1, marginLeft: 2 }}
                >
                  <View
                    style={{
                      paddingVertical: 8,
                      borderRadius: 7,
                      backgroundColor:
                        activeTab === "summary"
                          ? "rgba(0, 245, 212, 0.15)"
                          : "transparent",
                      borderWidth: activeTab === "summary" ? 1 : 0,
                      borderColor:
                        activeTab === "summary"
                          ? "rgba(0, 245, 212, 0.4)"
                          : "transparent",
                    }}
                  >
                    <Text
                      style={{
                        textAlign: "center",
                        fontWeight: "600",
                        fontSize: 14,
                        color:
                          activeTab === "summary"
                            ? "#00F5D4"
                            : "rgba(139, 149, 165, 0.8)",
                      }}
                    >
                      Confluence Summary
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView
              className="flex-1"
              contentContainerStyle={{
                paddingHorizontal: 20,
                paddingBottom: 20,
              }}
              showsVerticalScrollIndicator={true}
              keyboardShouldPersistTaps="handled"
            >
              {activeTab === "update" ? (
                /* UPDATE TAB */
                <View style={{ gap: 20 }}>
                  {/* Confluence Score */}
                  <View
                    className="mt-4 rounded-xl p-4 border"
                    style={{
                      backgroundColor: "rgba(0, 245, 212, 0.1)",
                      borderColor: "rgba(0, 245, 212, 0.3)",
                    }}
                  >
                    <Text className="text-accent-cyan text-sm font-semibold">
                      Confluence Score: {trade.confluence_score}%
                    </Text>
                  </View>

                  {/* Currency Pair & Direction - Combined */}
                  <View>
                    <Text className="text-txt-primary text-base font-semibold mb-3">
                      Trade Setup
                    </Text>
                    <View className="flex-row" style={{ gap: 12 }}>
                      {/* Currency Pair */}
                      <View className="flex-1">
                        <View className="flex-row items-center mb-2">
                          <Ionicons
                            name="swap-horizontal"
                            size={14}
                            color="#8B95A5"
                          />
                          <Text className="text-txt-secondary text-xs ml-1">
                            Currency Pair
                          </Text>
                        </View>
                        <View className="bg-bg-secondary rounded-lg p-4 border border-border">
                          <View className="flex-row items-center">
                            <View
                              className="flex-row items-center"
                              style={{ gap: 3 }}
                            >
                              <Text className="text-md text-white">
                                {getCurrencyFlag(
                                  trade.currency_pair.split("/")[0]
                                )}
                                /
                              </Text>
                              <Text className="text-md pr-4">
                                {getCurrencyFlag(
                                  trade.currency_pair.split("/")[1]
                                )}
                              </Text>
                            </View>
                            <Text className="text-txt-primary text-xl font-bold">
                              {trade.currency_pair}
                            </Text>
                          </View>
                        </View>
                      </View>

                      {/* Direction */}
                      <View className="flex-1">
                        <View className="flex-row items-center mb-2">
                          <Ionicons
                            name={
                              trade.direction === "LONG"
                                ? "trending-up"
                                : "trending-down"
                            }
                            size={14}
                            color={
                              trade.direction === "LONG" ? "#10B981" : "#EF4444"
                            }
                          />
                          <Text className="text-txt-secondary text-xs ml-1">
                            Direction
                          </Text>
                        </View>
                        <View
                          className={`rounded-lg p-4 justify-center items-center ${
                            trade.direction === "LONG"
                              ? "bg-success/20 border border-success"
                              : "bg-error/20 border border-error"
                          }`}
                        >
                          <Text
                            className={`text-xl font-bold ${
                              trade.direction === "LONG"
                                ? "text-success"
                                : "text-error"
                            }`}
                          >
                            {trade.direction}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  {/* Account & Risk */}
                  <View>
                    <Text className="text-txt-primary text-base font-semibold mb-2">
                      Account & Risk
                    </Text>
                    <View className="flex-row" style={{ gap: 12 }}>
                      <View className="flex-1 bg-bg-secondary border border-border rounded-lg p-3">
                        <Text className="text-txt-secondary text-xs mb-1">
                          Account Balance
                        </Text>
                        <Text className="text-txt-primary font-semibold">
                          {trade.account_balance
                            ? `$${trade.account_balance.toFixed(0)}`
                            : "Not set"}
                        </Text>
                      </View>
                      <View className="flex-1 bg-bg-secondary border border-border rounded-lg p-3">
                        <Text className="text-txt-secondary text-xs mb-1">
                          Risk Percentage
                        </Text>
                        <Text className="text-txt-primary font-semibold">
                          {trade.risk_percentage
                            ? `${trade.risk_percentage}%`
                            : "Not set"}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Trade Parameters */}
                  <View>
                    <Text className="text-txt-primary text-base font-semibold mb-2">
                      Trade Parameters
                    </Text>
                    <View
                      className="bg-bg-secondary border border-border rounded-lg p-4"
                      style={{ gap: 12 }}
                    >
                      <View className="flex-row justify-between">
                        <Text className="text-txt-secondary">Entry Price</Text>
                        <Text className="text-txt-primary font-bold">
                          {trade.entry_price?.toFixed(5) || "N/A"}
                        </Text>
                      </View>
                      <View className="flex-row justify-between">
                        <Text className="text-txt-secondary">Stop Loss</Text>
                        <Text className="text-error font-bold">
                          {trade.stop_loss_price?.toFixed(5) || "N/A"}
                        </Text>
                      </View>
                      <View className="flex-row justify-between">
                        <Text className="text-txt-secondary">Take Profit</Text>
                        <Text className="text-success font-bold">
                          {trade.take_profit_price?.toFixed(5) || "N/A"}
                        </Text>
                      </View>
                      <View className="flex-row justify-between">
                        <Text className="text-txt-secondary">Lot Size</Text>
                        <Text className="text-txt-primary font-semibold">
                          {typeof trade.calculated_lot_size === "number"
                            ? `${trade.calculated_lot_size.toFixed(2)}`
                            : trade.calculated_lot_size || "N/A"}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Notes */}
                  {trade.notes && (
                    <View>
                      <Text className="text-txt-primary text-base font-semibold mb-2">
                        Notes
                      </Text>
                      <View className="bg-bg-secondary border border-border rounded-lg p-4">
                        <Text className="text-txt-primary leading-6">
                          {trade.notes}
                        </Text>
                      </View>
                    </View>
                  )}

                  {/* Chart Images */}
                  <View>
                    <Text className="text-txt-primary text-base font-semibold mb-3">
                      Chart Images
                    </Text>
                    <View className="flex-row" style={{ gap: 12 }}>
                      {/* ACTIVE Trade */}
                      <View className="flex-1">
                        <Text className="text-txt-secondary text-sm mb-2">
                          ACTIVE Trade
                        </Text>
                        {trade.chart_image_url ? (
                          <Image
                            source={{
                              uri: `${trade.chart_image_url}?t=${Date.now()}`,
                            }}
                            style={{
                              width: "100%",
                              height: 160,
                              borderRadius: 8,
                            }}
                            resizeMode="cover"
                          />
                        ) : (
                          <View className="w-full h-40 rounded-lg bg-bg-tertiary items-center justify-center border border-border">
                            <Ionicons
                              name="image-outline"
                              size={32}
                              color="#6B7280"
                            />
                            <Text className="text-txt-tertiary text-xs mt-2">
                              No image
                            </Text>
                          </View>
                        )}
                      </View>

                      {/* After Trade */}
                      <View className="flex-1">
                        <View
                          className="flex-row items-center mb-2"
                          style={{ gap: 4 }}
                        >
                          <Text className="text-txt-secondary text-sm">
                            After Trade
                          </Text>
                          {!isClosed && (
                            <Text className="text-error text-xs">*</Text>
                          )}
                        </View>

                        {afterTradeImage ? (
                          <View className="relative">
                            <Image
                              source={{ uri: afterTradeImage }}
                              style={{
                                width: "100%",
                                height: 160,
                                borderRadius: 8,
                              }}
                              resizeMode="cover"
                            />
                            {!isClosed && (
                              <TouchableOpacity
                                onPress={() => setAfterTradeImage(null)}
                                className="absolute top-2 right-2 bg-error rounded-full p-1"
                              >
                                <Ionicons name="close" size={16} color="#FFF" />
                              </TouchableOpacity>
                            )}
                          </View>
                        ) : trade.after_trade_image_url ? (
                          <Image
                            source={{
                              uri: `${trade.after_trade_image_url}?t=${Date.now()}`,
                            }}
                            style={{
                              width: "100%",
                              height: 160,
                              borderRadius: 8,
                            }}
                            resizeMode="cover"
                          />
                        ) : isClosed ? (
                          <View className="w-full h-40 rounded-lg bg-bg-tertiary items-center justify-center border border-border">
                            <Ionicons
                              name="image-outline"
                              size={32}
                              color="#6B7280"
                            />
                            <Text className="text-txt-tertiary text-xs mt-2">
                              No after image
                            </Text>
                          </View>
                        ) : (
                          <TouchableOpacity
                            onPress={() => pickAfterImage(false)}
                            className="w-full h-40 rounded-lg bg-info/20 border border-info items-center justify-center"
                          >
                            <Ionicons
                              name="cloud-upload"
                              size={32}
                              color="#3B82F6"
                            />
                            <Text className="text-info text-xs mt-2">
                              Upload
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  </View>

                  {/* Trade Outcome - Only if not closed */}
                  {!isClosed && (
                    <View>
                      <Text className="text-txt-primary text-base font-semibold mb-3">
                        Trade Outcome
                      </Text>
                      <View className="flex-row mb-4" style={{ gap: 12 }}>
                        <OutcomeButton outcome="Win" label="Win" />
                        <OutcomeButton outcome="Loss" label="Loss" />
                        <OutcomeButton
                          outcome="Break-Even"
                          label="Break-Even"
                        />
                      </View>

                      <View>
                        <Text className="text-txt-primary text-sm font-semibold mb-2">
                          Profit/Loss Amount ($){" "}
                          <Text className="text-red-500">*</Text>
                        </Text>
                        <TextInput
                          value={profitAmount}
                          onChangeText={setProfitAmount}
                          placeholder="Enter amount"
                          placeholderTextColor="#6B7280"
                          keyboardType="numeric"
                          className="bg-bg-secondary border border-border rounded-lg px-4 py-4 text-txt-primary text-lg"
                        />
                      </View>
                    </View>
                  )}

                  {/* Locked Message */}
                  {isClosed && (
                    <View className="bg-warning/10 border border-warning rounded-lg p-4">
                      <View
                        className="flex-row items-center"
                        style={{ gap: 10 }}
                      >
                        <Ionicons
                          name="lock-closed"
                          size={24}
                          color="#F59E0B"
                        />
                        <View className="flex-1">
                          <Text className="text-warning font-bold text-base mb-1">
                            Trade Locked
                          </Text>
                          <Text className="text-txt-secondary text-sm">
                            This trade is closed and cannot be edited
                          </Text>
                        </View>
                      </View>
                    </View>
                  )}
                </View>
              ) : (
                /* CONFLUENCE SUMMARY TAB */
                <View className="py-4">
                  {/* Confluence Score Box */}
                  <View className="bg-accent-cyan/10 border border-accent-cyan rounded-xl p-4 mb-4">
                    <View className="items-center">
                      <Text className="text-accent-cyan text-5xl font-bold">
                        {trade.confluence_score}%
                      </Text>
                      <Text className="text-txt-secondary text-sm mt-2">
                        Total Confluence Score
                      </Text>
                      {trade.confluence_data?.timestamp && (
                        <Text className="text-txt-tertiary text-xs mt-1">
                          {new Date(
                            trade.confluence_data.timestamp
                          ).toLocaleString()}
                        </Text>
                      )}
                    </View>
                  </View>

                  {/* Category Badge */}
                  <View className="flex-row justify-center mb-4">
                    <View
                      className="px-4 py-2 rounded-full"
                      style={{ backgroundColor: `${setupCategory.color}20` }} // Dynamic color
                    >
                      <Text
                        className="font-bold"
                        style={{ color: setupCategory.color }} // Dynamic color
                      >
                        {setupCategory.label === "Weak Setup" && "❌"}
                        {setupCategory.label === "Below Standard" && "⚠️"}
                        {setupCategory.label === "Moderate" && "⚠️"}
                        {setupCategory.label === "Acceptable" && "📊"}
                        {setupCategory.label === "Good" && "✅"}
                        {setupCategory.label === "Strong" && "💪"}
                        {setupCategory.label === "Very Strong" && "✨"}
                        {setupCategory.label === "Outstanding" && "🌟"}
                        {setupCategory.label === "Excellent" && "🔥"}
                        {setupCategory.label === "Perfect Trade" && "🎯"}{" "}
                        {setupCategory.label}
                      </Text>
                    </View>
                  </View>

                  {/* Items Breakdown */}
                  {trade.confluence_data?.items &&
                  trade.confluence_data.items.length > 0 ? (
                    <View className="bg-bg-secondary rounded-lg p-4">
                      <Text className="text-txt-primary font-bold mb-3">
                        Checked Confluence Factors
                      </Text>
                      {trade.confluence_data.items.map(
                        (item: any, index: number) => (
                          <View
                            key={index}
                            className="flex-row items-center py-3 border-b border-border"
                          >
                            <Ionicons
                              name="checkmark-circle"
                              size={22}
                              color="#10B981"
                            />
                            <View className="flex-1 ml-3">
                              <Text className="text-txt-primary">
                                {item.label}
                              </Text>
                              {item.timeframe && (
                                <Text className="text-txt-tertiary text-xs mt-1">
                                  {item.timeframe}
                                </Text>
                              )}
                            </View>
                            <Text className="text-accent-cyan">
                              +{item.weight || 0}%
                            </Text>
                          </View>
                        )
                      )}
                    </View>
                  ) : (
                    <View className="bg-bg-secondary rounded-lg p-6">
                      <View className="items-center">
                        <Ionicons
                          name="analytics-outline"
                          size={48}
                          color="#6B7280"
                        />
                        <Text className="text-txt-secondary text-center mt-3">
                          No detailed confluence data available
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              )}
            </ScrollView>

            {/* Footer Buttons */}
            {activeTab === "update" && (
              <View className="p-5 border-t border-border flex-row bg-bg-primary">
                <TouchableOpacity
                  onPress={onClose}
                  className="flex-1 bg-bg-tertiary rounded-xl py-4 mr-2"
                >
                  <Text className="text-txt-primary text-center font-bold text-base">
                    Close
                  </Text>
                </TouchableOpacity>

                {!isClosed && (
                  <TouchableOpacity
                    onPress={handleSaveChanges}
                    disabled={saving}
                    className="flex-1 bg-accent-cyan rounded-xl py-4 ml-2 flex-row items-center justify-center"
                    style={{ opacity: saving ? 0.5 : 1 }}
                  >
                    <Ionicons
                      name="checkmark-circle-outline"
                      size={20}
                      color="#1B2838"
                    />
                    <Text className="text-bg-primary font-bold text-base ml-2">
                      {saving ? "Saving..." : "Save Changes"}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
