import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';

export default function TabsLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: true,
                tabBarStyle: {
                    position: 'absolute',
                    backgroundColor: 'rgba(42, 63, 84, 0.9)',
                    borderTopWidth: 0,
                    borderRadius: 24,
                    marginHorizontal: 16,
                    marginBottom: Platform.OS === 'ios' ? 20 : 16,
                    height: 70,
                    paddingBottom: 10,
                    paddingTop: 10,
                    elevation: 0,
                    shadowColor: '#000',
                    shadowOffset: {
                        width: 0,
                        height: 4,
                    },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                },
                tabBarActiveTintColor: '#00F5D4',
                tabBarInactiveTintColor: '#8B95A5',
                headerStyle: {
                    backgroundColor: '#1B2838',
                },
                headerTintColor: '#FFFFFF',
                headerTitleStyle: {
                    fontWeight: 'bold',
                },
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: '600',
                },
                tabBarItemStyle: {
                    borderRadius: 16,
                },
            }}
        >
            <Tabs.Screen
                name="checklist"
                options={{
                    title: 'Checklist',
                    tabBarLabel: 'Checklist',
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons
                            name={focused ? "checkmark-done" : "checkmark-done-outline"}
                            size={24}
                            color={color}
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name="journal"
                options={{
                    title: 'Journal',
                    tabBarLabel: 'Journal',
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons
                            name={focused ? "book" : "book-outline"}
                            size={24}
                            color={color}
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name="analytics"
                options={{
                    title: 'Analytics',
                    tabBarLabel: 'Stats',
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons
                            name={focused ? "bar-chart" : "bar-chart-outline"}
                            size={24}
                            color={color}
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Dashboard',
                    tabBarLabel: 'Home',
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons
                            name={focused ? "home" : "home-outline"}
                            size={24}
                            color={color}
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name="settings"
                options={{
                    title: 'Settings',
                    tabBarLabel: 'Settings',
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons
                            name={focused ? "settings" : "settings-outline"}
                            size={24}
                            color={color}
                        />
                    ),
                }}
            />
        </Tabs>
    );
}
