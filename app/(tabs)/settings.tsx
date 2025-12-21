import { useAuth } from "@/context/AuthContext";
import { useNotifications } from "@/context/NotificationContext";
import { supabase } from "@/lib/supabase";
import { userSettingsService } from "@/lib/userSettingsService";
import { UserSettings } from "@/types/userSettings";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import { useCallback, useState } from "react";

import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function SettingsScreen() {
  const { user, signOut } = useAuth();

  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const {
    scheduleDailyReminder,
    cancelDailyReminder,
    hasPermission,
    requestPermission,
  } = useNotifications();

  const loadSettings = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const userSettings = await userSettingsService.getUserSettings(user.id);
      setSettings(userSettings);
    } catch (error) {
      console.error("Error loading settings:", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadSettings();
    }, [user])
  );

  const editMonthlyTarget = () => {
    if (!user || !settings) return;

    Alert.prompt(
      "Monthly Profit Target",
      "Enter your monthly profit goal ($)",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Save",
          onPress: async (value?: string) => {
            const numValue = parseFloat(value || "0");
            if (isNaN(numValue) || numValue < 0) {
              Alert.alert(
                "Invalid Input",
                "Please enter a valid positive number"
              );
              return;
            }

            const success = await userSettingsService.updateMonthlyTarget(
              user.id,
              numValue
            );
            if (success) {
              setSettings({ ...settings, monthly_target: numValue });
            } else {
              Alert.alert("Error", "Failed to update monthly target");
            }
          },
        },
      ],
      "plain-text",
      settings.monthly_target.toString()
    );
  };

  const editMaxDailyLoss = () => {
    if (!user || !settings) return;

    Alert.prompt(
      "Max Daily Loss Limit",
      "Enter maximum loss allowed per day ($)",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Save",
          onPress: async (value?: string) => {
            const numValue = parseFloat(value || "0");
            if (isNaN(numValue) || numValue < 0) {
              Alert.alert(
                "Invalid Input",
                "Please enter a valid positive number"
              );
              return;
            }

            const success = await userSettingsService.updateMaxDailyLoss(
              user.id,
              numValue
            );
            if (success) {
              setSettings({ ...settings, max_daily_loss: numValue });
            } else {
              Alert.alert("Error", "Failed to update max daily loss");
            }
          },
        },
      ],
      "plain-text",
      settings.max_daily_loss.toString()
    );
  };

  const editWinRateGoal = () => {
    if (!user || !settings) return;

    Alert.prompt(
      "Win Rate Goal",
      "Enter target win rate percentage (%)",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Save",
          onPress: async (value?: string) => {
            const numValue = parseFloat(value || "0");
            if (isNaN(numValue) || numValue < 0 || numValue > 100) {
              Alert.alert(
                "Invalid Input",
                "Please enter a percentage between 0-100"
              );
              return;
            }

            const success = await userSettingsService.updateWinRateGoal(
              user.id,
              numValue
            );
            if (success) {
              setSettings({ ...settings, win_rate_goal: numValue });
            } else {
              Alert.alert("Error", "Failed to update win rate goal");
            }
          },
        },
      ],
      "plain-text",
      settings.win_rate_goal.toString()
    );
  };

  const editMaxTradesPerDay = () => {
    if (!user || !settings) return;

    Alert.prompt(
      "Max Trades Per Day",
      "Enter maximum number of trades per day",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Save",
          onPress: async (value?: string) => {
            const numValue = parseInt(value || "0");
            if (isNaN(numValue) || numValue < 0) {
              Alert.alert(
                "Invalid Input",
                "Please enter a valid positive number"
              );
              return;
            }

            const success = await userSettingsService.updateMaxTradesPerDay(
              user.id,
              numValue
            );
            if (success) {
              setSettings({ ...settings, max_trades_per_day: numValue });
            } else {
              Alert.alert("Error", "Failed to update max trades per day");
            }
          },
        },
      ],
      "plain-text",
      settings.max_trades_per_day.toString()
    );
  };

  const toggleDailyReminder = async (enabled: boolean) => {
    if (!user || !settings) return;

    if (enabled && !hasPermission) {
      const granted = await requestPermission();
      if (!granted) {
        Alert.alert(
          "Permission Required",
          "Please enable notifications in settings to use reminders."
        );
        return;
      }
    }

    const success = await userSettingsService.updateDailyReminder(
      user.id,
      enabled
    );

    if (success) {
      if (enabled) {
        await scheduleDailyReminder(settings.daily_reminder_time);
      } else {
        await cancelDailyReminder();
      }
      setSettings({ ...settings, daily_reminder_enabled: enabled });
    }
  };

  const toggleInactivityReminder = async (enabled: boolean) => {
    if (!user || !settings) return;

    const success = await userSettingsService.updateInactivityReminder(
      user.id,
      enabled
    );
    if (success) {
      setSettings({ ...settings, inactivity_reminder_enabled: enabled });
    }
  };

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await signOut();
          router.replace("/login");
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "This action cannot be undone. All your data will be permanently deleted.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            // Ask for confirmation again
            Alert.prompt(
              "Confirm Deletion",
              "Type 'DELETE' to confirm account deletion",
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Confirm",
                  style: "destructive",
                  onPress: async (value?: string) => {
                    if (value !== "DELETE") {
                      Alert.alert("Cancelled", "Account deletion cancelled");
                      return;
                    }

                    if (!user) return;

                    try {
                      // Delete all user data first
                      await supabase
                        .from("trades")
                        .delete()
                        .eq("user_id", user.id);
                      await supabase
                        .from("user_settings")
                        .delete()
                        .eq("user_id", user.id);

                      // Delete user from auth
                      const { error } = await supabase.auth.admin.deleteUser(
                        user.id
                      );

                      if (error) {
                        Alert.alert(
                          "Error",
                          "Failed to delete account. Please contact support."
                        );
                        console.error("Delete account error:", error);
                      } else {
                        await signOut();
                        router.replace("/login");
                      }
                    } catch (error) {
                      console.error("Delete account error:", error);
                      Alert.alert(
                        "Error",
                        "An error occurred. Please try again."
                      );
                    }
                  },
                },
              ],
              "plain-text"
            );
          },
        },
      ]
    );
  };

  const handleDeleteAllTrades = () => {
    if (!user) return;

    Alert.alert(
      "Delete All Trades",
      "This will permanently delete all your trades. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete All",
          style: "destructive",
          onPress: async () => {
            try {
              const { error } = await supabase
                .from("trades")
                .delete()
                .eq("user_id", user.id);

              if (error) {
                Alert.alert(
                  "Error",
                  "Failed to delete trades. Please try again."
                );
                console.error("Delete all trades error:", error);
              } else {
                Alert.alert(
                  "Success",
                  "All trades have been deleted successfully."
                );
              }
            } catch (error) {
              console.error("Delete all trades error:", error);
              Alert.alert("Error", "An error occurred. Please try again.");
            }
          },
        },
      ]
    );
  };

  const handleChangePassword = () => {
    Alert.prompt(
      "Change Password",
      "Enter your new password",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Change",
          onPress: async (newPassword?: string) => {
            if (!newPassword || newPassword.length < 6) {
              Alert.alert(
                "Invalid Password",
                "Password must be at least 6 characters long"
              );
              return;
            }

            const { error } = await supabase.auth.updateUser({
              password: newPassword,
            });

            if (error) {
              Alert.alert("Error", error.message);
            } else {
              Alert.alert(
                "Success",
                "Your password has been changed successfully"
              );
            }
          },
        },
      ],
      "secure-text"
    );
  };

  const handleContactSupport = () => {
    const email = "support@tradingjournal.app"; // Promeni na svoj email
    const subject = "Support Request";
    const body = `Hi,\n\nI need help with...\n\n---\nUser ID: ${user?.id}\nApp Version: 1.0.0`;

    const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    Linking.openURL(mailtoUrl).catch(() => {
      Alert.alert(
        "Error",
        "Could not open email app. Please email us at: " + email
      );
    });
  };

  const handlePrivacyPolicy = () => {
    try {
      router.push("/privacy"); // putanja do PrivacyPolicyScreen
    } catch {
      Alert.alert("Error", "Could not open privacy policy screen.");
    }
  };

  const handleTermsOfService = () => {
    try {
      router.push("/terms"); // putanja do TermsOfServiceScreen
    } catch {
      Alert.alert("Error", "Could not open terms of service screen.");
    }
  };

  if (loading || !settings) {
    return (
      <View className="flex-1 bg-bg-primary items-center justify-center">
        <ActivityIndicator size="large" color="#00F5D4" />
        <Text className="text-txt-secondary mt-4">Loading settings...</Text>
      </View>
    );
  }

  const onReset = async () => {
    await AsyncStorage.removeItem("hasOnboarded");
    router.replace("/");
  };

  return (
    <ScrollView className="flex-1 bg-[#0A0F1A]">
      <View className="p-4 pb-28">
        {/* Header */}
        <Text className="text-txt-primary text-3xl font-bold mb-2 mt-2">
          Settings
        </Text>

        {/* Account Section */}
        <View className="mt-6">
          <Text className="text-txt-secondary text-md font-semibold uppercase mb-2 px-4">
            Account
          </Text>
          <View className="bg-bg-secondary rounded-2xl overflow-hidden">
            {/* User Email */}
            <View className="px-4 py-3 border-b border-bg-primary">
              <Text className="text-txt-secondary text-xs mb-1">Email</Text>
              <Text className="text-txt-primary text-base">{user?.email}</Text>
            </View>

            {/* Change Password */}
            <TouchableOpacity
              onPress={handleChangePassword}
              className="px-4 py-3.5 flex-row items-center justify-between border-b border-bg-primary"
            >
              <View className="flex-row items-center flex-1">
                <View className="bg-accent-cyan/20 rounded-full p-2 mr-3">
                  <Ionicons name="lock-closed" size={18} color="#00F5D4" />
                </View>
                <Text className="text-txt-primary text-base">
                  Change Password
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#8B95A5" />
            </TouchableOpacity>

            {/* Logout */}
            <TouchableOpacity
              onPress={handleLogout}
              className="px-4 py-3.5 flex-row items-center justify-between"
            >
              <View className="flex-row items-center flex-1">
                <View className="bg-accent-cyan/20 rounded-full p-2 mr-3">
                  <Ionicons name="log-out" size={18} color="#00F5D4" />
                </View>
                <Text className="text-accent-cyan text-base">Logout</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#00F5D4" />
            </TouchableOpacity>
          </View>

          <View className="flex-1 bg-bg-primary p-6">
            <TouchableOpacity
              onPress={onReset}
              className="bg-red-500 rounded-2xl p-4"
            >
              <Text className="text-white font-semibold text-center">
                Reset onboarding
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Goals & Targets Section */}
        <View className="mt-6">
          <Text className="text-txt-secondary text-md font-semibold uppercase mb-2 px-4">
            Goals & Targets
          </Text>
          <View className="bg-bg-secondary rounded-2xl overflow-hidden">
            {/* Monthly Target */}
            <TouchableOpacity
              onPress={editMonthlyTarget}
              className="px-4 py-3.5 flex-row items-center justify-between border-b border-bg-primary"
            >
              <View className="flex-1">
                <Text className="text-txt-primary text-base mb-0.5">
                  Monthly Profit Target
                </Text>
                <Text className="text-txt-tertiary text-xs">
                  Your monthly goal
                </Text>
              </View>
              <View className="flex-row items-center">
                <Text className="text-accent-cyan text-base font-semibold mr-2">
                  ${settings.monthly_target.toLocaleString()}
                </Text>
                <Ionicons name="chevron-forward" size={20} color="#8B95A5" />
              </View>
            </TouchableOpacity>

            {/* Max Daily Loss */}
            <TouchableOpacity
              onPress={editMaxDailyLoss}
              className="px-4 py-3.5 flex-row items-center justify-between border-b border-bg-primary"
            >
              <View className="flex-1">
                <Text className="text-txt-primary text-base mb-0.5">
                  Max Daily Loss
                </Text>
                <Text className="text-txt-tertiary text-xs">
                  Maximum loss per day
                </Text>
              </View>
              <View className="flex-row items-center">
                <Text className="text-error text-base font-semibold mr-2">
                  ${settings.max_daily_loss.toLocaleString()}
                </Text>
                <Ionicons name="chevron-forward" size={20} color="#8B95A5" />
              </View>
            </TouchableOpacity>

            {/* Win Rate Goal */}
            <TouchableOpacity
              onPress={editWinRateGoal}
              className="px-4 py-3.5 flex-row items-center justify-between border-b border-bg-primary"
            >
              <View className="flex-1">
                <Text className="text-txt-primary text-base mb-0.5">
                  Win Rate Goal
                </Text>
                <Text className="text-txt-tertiary text-xs">
                  Target percentage
                </Text>
              </View>
              <View className="flex-row items-center">
                <Text className="text-accent-cyan text-base font-semibold mr-2">
                  {settings.win_rate_goal}%
                </Text>
                <Ionicons name="chevron-forward" size={20} color="#8B95A5" />
              </View>
            </TouchableOpacity>

            {/* Max Trades Per Day */}
            <TouchableOpacity
              onPress={editMaxTradesPerDay}
              className="px-4 py-3.5 flex-row items-center justify-between"
            >
              <View className="flex-1">
                <Text className="text-txt-primary text-base mb-0.5">
                  Max Trades Per Day
                </Text>
                <Text className="text-txt-tertiary text-xs">Daily limit</Text>
              </View>
              <View className="flex-row items-center">
                <Text className="text-txt-primary text-base font-semibold mr-2">
                  {settings.max_trades_per_day}
                </Text>
                <Ionicons name="chevron-forward" size={20} color="#8B95A5" />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Notifications Section */}
        <View className="mt-6">
          <Text className="text-txt-secondary text-md font-semibold uppercase mb-2 px-4">
            Notifications
          </Text>
          <View className="bg-bg-secondary rounded-2xl overflow-hidden">
            {/* Daily Reminder */}
            <View className="px-4 py-3.5 flex-row items-center justify-between border-b border-bg-primary">
              <View className="flex-1 mr-3">
                <Text className="text-txt-primary text-base mb-0.5">
                  Daily Reminder
                </Text>
                <Text className="text-txt-tertiary text-xs">
                  Log trades at {settings.daily_reminder_time}
                </Text>
              </View>
              <Switch
                value={settings.daily_reminder_enabled}
                onValueChange={toggleDailyReminder}
                trackColor={{ false: "#3A4F64", true: "#00F5D4" }}
                thumbColor="#fff"
                ios_backgroundColor="#3A4F64"
              />
            </View>

            {/* Inactivity Reminder */}
            <View className="px-4 py-3.5 flex-row items-center justify-between">
              <View className="flex-1 mr-3">
                <Text className="text-txt-primary text-base mb-0.5">
                  Inactivity Alert
                </Text>
                <Text className="text-txt-tertiary text-xs">
                  After {settings.inactivity_days} days inactive
                </Text>
              </View>
              <Switch
                value={settings.inactivity_reminder_enabled}
                onValueChange={toggleInactivityReminder}
                trackColor={{ false: "#3A4F64", true: "#00F5D4" }}
                thumbColor="#fff"
                ios_backgroundColor="#3A4F64"
              />
            </View>
          </View>
        </View>

        {/* Data Management Section */}
        <View className="mt-6">
          <Text className="text-txt-secondary text-md font-semibold uppercase mb-2 px-4">
            Data & Privacy
          </Text>
          <View className="bg-bg-secondary rounded-2xl overflow-hidden">
            {/* Delete All Trades */}
            <TouchableOpacity
              onPress={handleDeleteAllTrades}
              className="px-4 py-3.5 flex-row items-center justify-between"
            >
              <View className="flex-row items-center flex-1">
                <View className="bg-error/20 rounded-full p-2 mr-3">
                  <Ionicons name="trash" size={18} color="#EF4444" />
                </View>
                <Text className="text-error text-base">Delete All Trades</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Support & About Section */}
        <View className="mt-6">
          <Text className="text-txt-secondary text-md font-semibold uppercase mb-2 px-4">
            Support & Legal
          </Text>
          <View className="bg-bg-secondary rounded-2xl overflow-hidden">
            {/* Contact Support */}
            <TouchableOpacity
              onPress={handleContactSupport}
              className="px-4 py-3.5 flex-row items-center justify-between border-b border-bg-primary"
            >
              <View className="flex-row items-center flex-1">
                <View className="bg-info/20 rounded-full p-2 mr-3">
                  <Ionicons name="mail" size={18} color="#3B82F6" />
                </View>
                <Text className="text-txt-primary text-base">
                  Contact Support
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#8B95A5" />
            </TouchableOpacity>

            {/* Privacy Policy */}
            <TouchableOpacity
              onPress={handlePrivacyPolicy}
              className="px-4 py-3.5 flex-row items-center justify-between border-b border-bg-primary"
            >
              <View className="flex-row items-center flex-1">
                <View className="bg-info/20 rounded-full p-2 mr-3">
                  <Ionicons name="shield-checkmark" size={18} color="#3B82F6" />
                </View>
                <Text className="text-txt-primary text-base">
                  Privacy Policy
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#8B95A5" />
            </TouchableOpacity>

            {/* Terms of Service */}
            <TouchableOpacity
              onPress={handleTermsOfService}
              className="px-4 py-3.5 flex-row items-center justify-between border-b border-bg-primary"
            >
              <View className="flex-row items-center flex-1">
                <View className="bg-info/20 rounded-full p-2 mr-3">
                  <Ionicons name="document-text" size={18} color="#3B82F6" />
                </View>
                <Text className="text-txt-primary text-base">
                  Terms of Service
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#8B95A5" />
            </TouchableOpacity>

            {/* App Version */}
            <View className="px-4 py-3.5 flex-row items-center justify-between">
              <Text className="text-txt-secondary text-base">App Version</Text>
              <Text className="text-txt-tertiary text-base">1.0.0</Text>
            </View>
          </View>
        </View>

        {/* Danger Zone */}
        <View className="mt-6">
          <Text className="text-txt-secondary text-md font-semibold uppercase mb-2 px-4">
            Danger Zone
          </Text>
          <View className="bg-bg-secondary rounded-2xl overflow-hidden">
            <TouchableOpacity
              onPress={handleDeleteAccount}
              className="px-4 py-3.5 flex-row items-center justify-between"
            >
              <View className="flex-row items-center flex-1">
                <View className="bg-error/20 rounded-full p-2 mr-3">
                  <Ionicons name="warning" size={18} color="#EF4444" />
                </View>
                <Text className="text-error text-base">Delete Account</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
