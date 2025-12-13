import { router } from "expo-router";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

export default function DisclaimerScreen() {
  return (
    <ScrollView className="flex-1 bg-bg-primary">
      <View className="px-6 py-12">
        {/* Back Button */}
        <TouchableOpacity onPress={() => router.back()} className="mb-8">
          <Text className="text-accent-cyan text-lg font-bold">← Back</Text>
        </TouchableOpacity>

        {/* Title */}
        <Text className="text-txt-primary text-3xl font-bold mb-4">
          Risk Disclosure
        </Text>
        <Text className="text-txt-secondary text-base mb-8">
          Important information about trading risks
        </Text>

        {/* Content */}
        <View className="mb-6">
          <Text className="text-accent-orange text-xl font-bold mb-3">
            High Risk of Loss
          </Text>
          <Text className="text-txt-primary text-base leading-6 mb-6">
            Trading financial instruments (including stocks, forex,
            cryptocurrencies, and derivatives) carries a high level of risk and
            may not be suitable for all investors. You may lose some or all of
            your invested capital. You should never invest money that you cannot
            afford to lose.
          </Text>
        </View>

        <View className="mb-6">
          <Text className="text-accent-orange text-xl font-bold mb-3">
            No Financial Advice
          </Text>
          <Text className="text-txt-primary text-base leading-6 mb-6">
            This application is provided for trade tracking and record-keeping
            purposes only. It does not provide financial, investment, or trading
            advice. No information on this app constitutes a recommendation to
            buy, sell, or hold any financial instrument.
          </Text>
        </View>

        <View className="mb-6">
          <Text className="text-accent-orange text-xl font-bold mb-3">
            Past Performance
          </Text>
          <Text className="text-txt-primary text-base leading-6 mb-6">
            Past performance is not indicative of future results. Market
            conditions change rapidly and historical data does not guarantee
            future outcomes. Your actual trading results may differ.
          </Text>
        </View>

        <View className="mb-6">
          <Text className="text-accent-orange text-xl font-bold mb-3">
            Your Responsibility
          </Text>
          <Text className="text-txt-primary text-base leading-6 mb-6">
            You are solely responsible for your own trading decisions, risk
            management, and any losses incurred. Always consult qualified
            financial professionals before making investment decisions.
          </Text>
        </View>

        <View className="mb-6">
          <Text className="text-accent-orange text-xl font-bold mb-3">
            Market Risks
          </Text>
          <Text className="text-txt-primary text-base leading-6 mb-6">
            Financial markets are volatile and influenced by unpredictable
            factors including economic data, geopolitical events, and regulatory
            changes. Leverage trading can amplify both gains and losses.
          </Text>
        </View>

        <View className="mb-6">
          <Text className="text-accent-orange text-xl font-bold mb-3">
            No Warranty
          </Text>
          <Text className="text-txt-primary text-base leading-6 mb-6">
            This app is provided "AS IS" without warranties of any kind. We do
            not guarantee the accuracy, completeness, or timeliness of any data.
            Technical issues and interruptions may occur.
          </Text>
        </View>

        <View className="mb-8">
          <Text className="text-accent-orange text-xl font-bold mb-3">
            Regulatory Notice
          </Text>
          <Text className="text-txt-primary text-base leading-6">
            This application does not provide brokerage or trading services.
            Users must comply with all applicable local regulations. For EU
            users: Trading activities are subject to MiFID II regulations.
          </Text>
        </View>

        {/* Bottom Warning */}
        <View className="bg-accent-orange/10 rounded-lg p-4 border border-accent-orange mb-8">
          <Text className="text-accent-orange font-bold text-center text-base">
            ⚠️ By using this app, you acknowledge that you have read,
            understood, and accepted these risks.
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => router.back()}
          className="bg-accent-cyan rounded-lg py-4"
        >
          <Text className="text-bg-primary text-center font-bold text-lg">
            Close
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
