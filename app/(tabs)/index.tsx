import {View, Text, ScrollView, TouchableOpacity} from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { router } from 'expo-router';

export default function HomeScreen() {
    const { signOut, user } = useAuth();

    const handleLogout = async () => {
        await signOut();
        router.replace('/(auth)/login');
    };


    return (
        <ScrollView className="flex-1 bg-bg-primary">
            <View className="p-4">
                <Text className="text-txt-primary text-3xl font-bold mb-2">
                    Dashboard
                </Text>
                <Text className="text-txt-secondary text-base mb-6">
                    Welcome to your Trading Journal
                </Text>

                {/* Stats Card */}
                <View className="bg-bg-secondary rounded-xl p-4 mb-4 border border-border">
                    <Text className="text-txt-secondary text-sm mb-1">
                        Overall Win Rate
                    </Text>
                    <Text className="text-accent-cyan text-5xl font-bold">
                        0%
                    </Text>
                </View>

                {/* Quick Stats */}
                <View className="flex-row justify-between mb-4">
                    <View className="bg-bg-secondary rounded-xl p-4 flex-1 mr-2 border border-border">
                        <Text className="text-txt-secondary text-xs mb-1">
                            Total Trades
                        </Text>
                        <Text className="text-txt-primary text-2xl font-bold">
                            0
                        </Text>
                    </View>

                    <View className="bg-bg-secondary rounded-xl p-4 flex-1 ml-2 border border-border">
                        <Text className="text-txt-secondary text-xs mb-1">
                            Profit/Loss
                        </Text>
                        <Text className="text-success text-2xl font-bold">
                            $0.00
                        </Text>
                    </View>
                </View>
            </View>
        </ScrollView>
    );
}
