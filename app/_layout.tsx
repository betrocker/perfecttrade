import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import '../global.css'
import {AuthProvider} from "@/context/AuthContext";
import { ChecklistProvider } from '@/context/ChecklistContext';

export default function RootLayout() {
    return (
        <AuthProvider>
            <ChecklistProvider>
            <StatusBar style="light" backgroundColor="#1B2838" />
            <Stack
                screenOptions={{
                    headerShown: false,
                    contentStyle: {
                        backgroundColor: '#1B2838',
                    },
                }}
            >
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            </Stack>
            </ChecklistProvider>
        </AuthProvider>
    );
}
