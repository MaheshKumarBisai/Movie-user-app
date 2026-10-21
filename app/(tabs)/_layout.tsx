import React from 'react';
import { Tabs } from 'expo-router';
import { StyleSheet, Easing } from 'react-native';
import { Home, Search, Ticket, User } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';

export default function TabLayout() {
    const insets = useSafeAreaInsets();
    const { colors, isDark } = useTheme();

    return (
        <Tabs screenOptions={{
            headerShown: false,
            animation: 'shift',
            sceneStyle: { backgroundColor: colors.background },
            tabBarStyle: {
                backgroundColor: colors.tabBarBg,
                borderTopColor: 'transparent',
                borderTopWidth: 0,
                height: 60 + insets.bottom,
                paddingBottom: insets.bottom,
                paddingTop: 10,
                elevation: 0,
                shadowOpacity: 0,
            },
            tabBarActiveTintColor: colors.primary,
            tabBarInactiveTintColor: colors.textMuted,
            tabBarShowLabel: true,
            tabBarLabelStyle: { fontSize: 10, fontWeight: '600', marginBottom: 5 },
        }}>
            <Tabs.Screen
                name="home"
                options={{
                    title: "Home",
                    tabBarIcon: ({ color, size }) => <Home color={color} size={24} />
                }}
            />
            <Tabs.Screen
                name="search"
                options={{
                    title: "Search",
                    tabBarIcon: ({ color, size }) => <Search color={color} size={24} />
                }}
            />
            <Tabs.Screen
                name="tickets"
                options={{
                    title: "Tickets",
                    tabBarIcon: ({ color, size }) => <Ticket color={color} size={24} />
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: "Profile",
                    tabBarIcon: ({ color, size }) => <User color={color} size={24} />
                }}
            />
        </Tabs>
    );
}
