import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { router } from 'expo-router';

export default function SettingsScreen() {
    const { signOut, user } = useAuth();

    const handleLogout = async () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to logout?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: async () => {
                        await signOut();
                        router.replace('/(auth)/login');
                    },
                },
            ]
        );
    };

    return (
        <View className="flex-1 bg-bg-primary p-4">
            <View className="bg-bg-secondary rounded-xl p-4 mb-4 border border-border">
                <Text className="text-txt-secondary text-sm mb-1">
                    Logged in as
                </Text>
                <Text className="text-txt-primary text-lg font-bold">
                    {user?.email}
                </Text>
            </View>

            <TouchableOpacity
                onPress={handleLogout}
                className="bg-error rounded-xl p-4 border border-error"
            >
                <Text className="text-white text-center font-bold text-lg">
                    Logout
                </Text>
            </TouchableOpacity>
        </View>
    );
}
