import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { router } from 'expo-router';
import { View, ActivityIndicator, Text } from 'react-native';

export default function Index() {
    const { user, loading } = useAuth();
    const [redirecting, setRedirecting] = useState(false);

    useEffect(() => {
        if (!loading && !redirecting) {
            setRedirecting(true);

            // Small delay to ensure auth state is settled
            setTimeout(() => {
                if (user) {
                    router.replace('/(tabs)');
                } else {
                    router.replace('/(auth)/login');
                }
            }, 100);
        }
    }, [user, loading, redirecting]);

    return (
        <View className="flex-1 bg-bg-primary items-center justify-center">
            <ActivityIndicator size="large" color="#00F5D4" />
            <Text className="text-txt-secondary mt-4">
                {loading ? 'Loading...' : 'Redirecting...'}
            </Text>
        </View>
    );
}
