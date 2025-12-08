import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { signIn } = useAuth();

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        try {
            setLoading(true);
            await signIn(email, password);

            // Wait a bit for auth state to propagate
            await new Promise(resolve => setTimeout(resolve, 300));
            router.replace('/(tabs)/checklist');

        } catch (error: any) {
            console.error('Login error:', error);

            let errorMessage = 'An error occurred';

            if (error.message?.toLowerCase().includes('network')) {
                errorMessage = 'Connection issue. Please check your internet and try again.';
            } else if (error.message?.includes('Invalid login credentials')) {
                errorMessage = 'Invalid email or password';
            } else if (error.message?.includes('Email not confirmed')) {
                errorMessage = 'Please confirm your email address first';
            } else if (error.message) {
                errorMessage = error.message;
            }

            Alert.alert('Login Failed', errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const testConnection = async () => {
        try {
            const { data, error } = await supabase.auth.getSession();
            Alert.alert('Test Result',
                error ? `Error: ${error.message}` : `Success! Session: ${data.session ? 'Active' : 'None'}`
            );
        } catch (err: any) {
            Alert.alert('Test Failed', err.message);
        }
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

            <TextInput
                placeholder="Password"
                placeholderTextColor="#8B95A5"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                className="bg-bg-secondary text-txt-primary rounded-lg px-4 py-4 mb-6 border border-border"
            />

            <TouchableOpacity
                onPress={handleLogin}
                disabled={loading}
                className={`rounded-lg py-4 mb-4 ${loading ? 'bg-bg-secondary' : 'bg-accent-cyan'}`}
            >
                <Text className="text-bg-primary text-center font-bold text-lg">
                    {loading ? 'Signing in...' : 'Sign In'}
                </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
                <Text className="text-txt-secondary text-center">
                    Don't have an account?{' '}
                    <Text className="text-accent-cyan font-bold">Sign Up</Text>
                </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={testConnection} className="mt-2">
                <Text className="text-txt-tertiary text-center text-sm">
                    [TEST] Check Connection
                </Text>
            </TouchableOpacity>
        </View>
    );
}
