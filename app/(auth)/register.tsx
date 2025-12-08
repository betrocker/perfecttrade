import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { router } from 'expo-router';

export default function RegisterScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { signUp } = useAuth();

    const handleRegister = async () => {
        if (!email || !password || !confirmPassword) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
            return;
        }

        if (password.length < 6) {
            Alert.alert('Error', 'Password must be at least 6 characters');
            return;
        }

        try {
            setLoading(true);
            await signUp(email, password);

            // Sačekaj malo da se session seti
            await new Promise(resolve => setTimeout(resolve, 500));

            // Redirect direktno na checklist
            router.replace('/(tabs)/checklist');

        } catch (error: any) {
            Alert.alert('Registration Failed', error.message);
        } finally {
            setLoading(false);
        }

    };


    return (
        <View className="flex-1 bg-bg-primary justify-center px-6">
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

            <TextInput
                placeholder="Password"
                placeholderTextColor="#8B95A5"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                className="bg-bg-secondary text-txt-primary rounded-lg px-4 py-4 mb-4 border border-border"
            />

            <TextInput
                placeholder="Confirm Password"
                placeholderTextColor="#8B95A5"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                className="bg-bg-secondary text-txt-primary rounded-lg px-4 py-4 mb-6 border border-border"
            />

            <TouchableOpacity
                onPress={handleRegister}
                disabled={loading}
                className={`rounded-lg py-4 mb-4 ${loading ? 'bg-bg-secondary' : 'bg-accent-cyan'}`}
            >
                <Text className="text-bg-primary text-center font-bold text-lg">
                    {loading ? 'Creating Account...' : 'Sign Up'}
                </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.back()}>
                <Text className="text-txt-secondary text-center">
                    Already have an account?{' '}
                    <Text className="text-accent-cyan font-bold">Sign In</Text>
                </Text>
            </TouchableOpacity>
        </View>
    );
}
