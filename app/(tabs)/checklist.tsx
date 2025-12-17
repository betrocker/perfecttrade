import CustomChecklist from "@/components/checklist/CustomChecklist";
import DefaultChecklist from "@/components/checklist/DefaultChecklist";
import { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";

import { usePremium } from "@/context/PremiumContext"; // prilagodi putanju
import { useRouter } from "expo-router";

type ChecklistTab = "default" | "custom";

export default function ChecklistScreen() {
  const [activeTab, setActiveTab] = useState<ChecklistTab>("default");

  const { loading, isPremium } = usePremium();
  const router = useRouter();

  const openDefault = () => setActiveTab("default");

  const openCustom = () => {
    if (loading) return; // opcionalno: ignoriši klik dok učitava status
    if (!isPremium) {
      router.push("/paywall");
      return;
    }
    setActiveTab("custom");
  };

  return (
    <View className="flex-1 bg-bg-primary">
      <View className="px-4 pt-3 pb-2 bg-bg-primary">
        <View
          style={{
            borderRadius: 10,
            backgroundColor: "rgba(118, 118, 128, 0.24)",
            padding: 2,
            flexDirection: "row",
          }}
        >
          <TouchableOpacity
            onPress={openDefault}
            activeOpacity={0.8}
            style={{ flex: 1, marginRight: 2 }}
          >
            <View
              style={{
                paddingVertical: 8,
                borderRadius: 7,
                backgroundColor:
                  activeTab === "default"
                    ? "rgba(0, 245, 212, 0.15)"
                    : "transparent",
                borderWidth: activeTab === "default" ? 1 : 0,
                borderColor:
                  activeTab === "default"
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
                    activeTab === "default"
                      ? "#00F5D4"
                      : "rgba(139, 149, 165, 0.8)",
                }}
              >
                Default Checklist
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={openCustom}
            activeOpacity={0.8}
            style={{ flex: 1, marginLeft: 2 }}
          >
            <View
              style={{
                paddingVertical: 8,
                borderRadius: 7,
                backgroundColor:
                  activeTab === "custom"
                    ? "rgba(0, 245, 212, 0.15)"
                    : "transparent",
                borderWidth: activeTab === "custom" ? 1 : 0,
                borderColor:
                  activeTab === "custom"
                    ? "rgba(0, 245, 212, 0.4)"
                    : "transparent",
                opacity: !isPremium ? 0.55 : 1, // vizuelni hint da je zaključano
              }}
            >
              <Text
                style={{
                  textAlign: "center",
                  fontWeight: "600",
                  fontSize: 14,
                  color:
                    activeTab === "custom"
                      ? "#00F5D4"
                      : "rgba(139, 149, 165, 0.8)",
                }}
              >
                My Checklist {!isPremium ? "(Premium)" : ""}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <View className="flex-1">
        {activeTab === "default" ? <DefaultChecklist /> : <CustomChecklist />}
      </View>
    </View>
  );
}
