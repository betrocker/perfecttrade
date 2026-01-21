import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function ResetPasswordScreen() {
  const params = useLocalSearchParams();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [verifying, setVerifying] = useState(true);

  useEffect(() => {
    // Proveri da li je token prisutan u URL-u
    const verifyToken = async () => {
      try {
        // URL format: perfecttrade://reset-password?access_token=xxx&refresh_token=xxx&type=recovery
        const accessToken = params.access_token as string;
        const refreshToken = params.refresh_token as string;
        const type = params.type as string;

        console.log("=== RESET PASSWORD PARAMS ===");
        console.log("Access token exists:", !!accessToken);
        console.log("Refresh token exists:", !!refreshToken);
        console.log("Type:", type);

        if (!accessToken || type !== "recovery") {
          Alert.alert(
            "Invalid Link",
            "This password reset link is invalid or has expired. Please request a new one.",
            [{ text: "OK", onPress: () => router.replace("/(auth)/login") }],
          );
          return;
        }

        // Postavi session sa recovery token-om
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (error) {
          console.error("Session error:", error);
          Alert.alert(
            "Error",
            "Failed to verify reset link. Please try again.",
            [{ text: "OK", onPress: () => router.replace("/(auth)/login") }],
          );
          return;
        }

        console.log("✅ Recovery session verified");
        setVerifying(false);
      } catch (error) {
        console.error("Verification error:", error);
        Alert.alert("Error", "Something went wrong. Please try again.", [
          { text: "OK", onPress: () => router.replace("/(auth)/login") },
        ]);
      }
    };

    verifyToken();
  }, [params]);

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters long");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        console.error("Update password error:", error);
        Alert.alert("Error", error.message);
        return;
      }

      Alert.alert("Success", "Your password has been reset successfully!", [
        {
          text: "OK",
          onPress: () => router.replace("/(auth)/login"),
        },
      ]);
    } catch (error: any) {
      console.error("Reset password error:", error);
      Alert.alert("Error", "Failed to reset password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <View className="flex-1 bg-bg-primary justify-center items-center px-6">
        <ActivityIndicator size="large" color="#00D9FF" />
        <Text className="text-txt-secondary mt-4">Verifying reset link...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-bg-primary justify-center px-6">
      <Text className="text-txt-primary text-4xl font-bold mb-2 text-center">
        Reset Password
      </Text>
      <Text className="text-txt-secondary text-center mb-8">
        Enter your new password
      </Text>

      {/* New Password */}
      <View className="relative mb-4">
        <TextInput
          placeholder="New Password"
          placeholderTextColor="#8B95A5"
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry={!showPassword}
          className="bg-bg-secondary text-txt-primary rounded-lg px-4 py-4 pr-12 border border-border"
        />
        <TouchableOpacity
          onPress={() => setShowPassword(!showPassword)}
          className="absolute right-4 top-4"
          activeOpacity={0.7}
        >
          <Ionicons
            name={showPassword ? "eye-off" : "eye"}
            size={24}
            color="#8B95A5"
          />
        </TouchableOpacity>
      </View>

      {/* Confirm Password */}
      <View className="relative mb-6">
        <TextInput
          placeholder="Confirm New Password"
          placeholderTextColor="#8B95A5"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry={!showConfirmPassword}
          className="bg-bg-secondary text-txt-primary rounded-lg px-4 py-4 pr-12 border border-border"
        />
        <TouchableOpacity
          onPress={() => setShowConfirmPassword(!showConfirmPassword)}
          className="absolute right-4 top-4"
          activeOpacity={0.7}
        >
          <Ionicons
            name={showConfirmPassword ? "eye-off" : "eye"}
            size={24}
            color="#8B95A5"
          />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        onPress={handleResetPassword}
        disabled={loading}
        className={`rounded-lg py-4 mb-4 ${loading ? "bg-bg-secondary" : "bg-accent-cyan"}`}
      >
        <Text className="text-bg-primary text-center font-bold text-lg">
          {loading ? "Resetting..." : "Reset Password"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.replace("/(auth)/login")}>
        <Text className="text-txt-secondary text-center">
          Back to <Text className="text-accent-cyan font-bold">Sign In</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
}
