import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import '../global.css'
import {AuthProvider} from "@/context/AuthContext";

export default function RootLayout() {
    return (
        <AuthProvider>
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
        </AuthProvider>
    );
}
