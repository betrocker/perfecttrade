import { useAuth } from "@/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
  Alert,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function RegisterScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [acceptedDisclaimer, setAcceptedDisclaimer] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { signUp } = useAuth();

  const handleRegister = async () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
      return;
    }

    if (!acceptedDisclaimer) {
      Alert.alert(
        "Disclaimer Required",
        "You must read and accept the Trading Risk Disclosure before registering."
      );
      return;
    }

    try {
      setLoading(true);
      await signUp(email, password);

      await new Promise((resolve) => setTimeout(resolve, 500));
      router.replace("/(tabs)/checklist");
    } catch (error: any) {
      Alert.alert("Registration Failed", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-bg-primary">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-6 py-8">
          <Text className="text-txt-primary text-4xl font-bold mb-2 text-center">
            Create Account
          </Text>
          <Text className="text-txt-secondary text-center mb-8">
            Start tracking your trades
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

          <View className="relative mb-4">
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

          <View className="relative mb-6">
            <TextInput
              placeholder="Confirm Password"
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

          {/* Trading Risk Disclaimer */}
          <View className="bg-bg-secondary rounded-xl p-5 mb-6 border border-accent-orange/30">
            <View className="flex-row items-center mb-3">
              <View className="w-8 h-8 bg-accent-orange/20 rounded-lg items-center justify-center mr-3">
                <Text className="text-accent-orange text-lg">⚠️</Text>
              </View>
              <Text className="text-accent-orange font-bold text-base flex-1">
                TRADING RISK DISCLOSURE
              </Text>
            </View>

            <Text className="text-txt-secondary text-sm leading-5 mb-4">
              Trading carries high risk of capital loss. This app is for
              tracking only and does not provide financial advice. You are
              solely responsible for your decisions.
            </Text>

            <TouchableOpacity
              onPress={() => router.push("/disclaimer")}
              className="bg-bg-primary rounded-lg px-4 py-3 mb-4 border border-border"
              activeOpacity={0.7}
            >
              <Text className="text-accent-cyan font-semibold text-sm text-center">
                Read Full Disclosure →
              </Text>
            </TouchableOpacity>

            <View className="h-px bg-border mb-4" />

            <View className="flex-row items-center justify-between">
              <Text className="text-txt-primary text-sm leading-5 flex-1 mr-3">
                I have read and accept the Risk Disclosure
              </Text>
              <Switch
                value={acceptedDisclaimer}
                onValueChange={setAcceptedDisclaimer}
                trackColor={{ false: "#3A4F64", true: "#00F5D4" }}
                thumbColor={acceptedDisclaimer ? "#FFFFFF" : "#f4f3f4"}
                ios_backgroundColor="#8B95A5"
              />
            </View>
          </View>

          <TouchableOpacity
            onPress={handleRegister}
            disabled={loading || !acceptedDisclaimer}
            className={`rounded-lg py-4 mb-4 ${
              loading || !acceptedDisclaimer
                ? "bg-bg-secondary"
                : "bg-accent-cyan"
            }`}
          >
            <Text className="text-bg-primary text-center font-bold text-lg">
              {loading ? "Creating Account..." : "Sign Up"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-txt-secondary text-center">
              Already have an account?{" "}
              <Text className="text-accent-cyan font-bold">Sign In</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
