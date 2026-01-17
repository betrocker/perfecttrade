import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { Alert, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { signIn } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    try {
      setLoading(true);
      await signIn(email, password);

      await new Promise((resolve) => setTimeout(resolve, 300));
      router.replace("/(tabs)/checklist");
    } catch (error: any) {
      console.error("Login error:", error);

      let errorMessage = "An error occurred";

      if (error.message?.toLowerCase().includes("network")) {
        errorMessage =
          "Connection issue. Please check your internet and try again.";
      } else if (error.message?.includes("Invalid login credentials")) {
        errorMessage = "Invalid email or password";
      } else if (error.message?.includes("Email not confirmed")) {
        errorMessage = "Please confirm your email address first";
      } else if (error.message) {
        errorMessage = error.message;
      }

      Alert.alert("Login Failed", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    Alert.prompt(
      "Reset Password",
      "Enter your email address to receive a password reset link",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Send Link",
          onPress: async (inputEmail?: string) => {
            const emailToReset = inputEmail?.trim() || email.trim();

            if (!emailToReset) {
              Alert.alert("Error", "Please enter your email address");
              return;
            }

            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(emailToReset)) {
              Alert.alert("Error", "Please enter a valid email address");
              return;
            }

            try {
              const { error } = await supabase.auth.resetPasswordForEmail(
                emailToReset,
                {
                  redirectTo: "perfecttrade://reset-password", // Deep link za tvoj app
                }
              );

              if (error) {
                Alert.alert("Error", error.message);
              } else {
                Alert.alert(
                  "Check Your Email",
                  `We've sent a password reset link to ${emailToReset}. Please check your inbox and follow the instructions.`,
                  [{ text: "OK" }]
                );
              }
            } catch (error: any) {
              Alert.alert(
                "Error",
                "Failed to send reset email. Please try again."
              );
            }
          },
        },
      ],
      "plain-text",
      email || "" // Pre-popuni sa email-om ako je već unet
    );
  };

  return (
    <View className="flex-1 bg-bg-primary justify-center px-6">
      <Text className="text-txt-primary text-4xl font-bold mb-2 text-center">
        Perfect Trade
      </Text>
      <Text className="text-txt-secondary text-center mb-8">
        Sign in to your account
      </Text>

      <TextInput
        placeholder="Email"
        placeholderTextColor="#8B95A5"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        className="bg-bg-secondary text-txt-primary rounded-lg px-4 py-4 mb-4 border border-border"
      />

      <View className="relative mb-2">
        <TextInput
          placeholder="Password"
          placeholderTextColor="#8B95A5"
          value={password}
          onChangeText={setPassword}
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

      {/* Forgot Password Link */}
      <TouchableOpacity
        onPress={handleForgotPassword}
        className="mb-6"
        activeOpacity={0.7}
      >
        <Text className="text-accent-cyan text-right text-sm">
          Forgot Password?
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={handleLogin}
        disabled={loading}
        className={`rounded-lg py-4 mb-4 ${loading ? "bg-bg-secondary" : "bg-accent-cyan"}`}
      >
        <Text className="text-bg-primary text-center font-bold text-lg">
          {loading ? "Signing in..." : "Sign In"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push("/(auth)/register")}>
        <Text className="text-txt-secondary text-center">
          Don't have an account?{" "}
          <Text className="text-accent-cyan font-bold">Sign Up</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
}
