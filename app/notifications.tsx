import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Alert, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ChevronLeft, Bell, CheckCircle2, Ticket, Trash2 } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import { endpoints } from '../config/api';
import { useTheme } from '../context/ThemeContext';

interface Notification {
    id: number;
    title: string;
    message: string;
    is_read: boolean;
    created_at: string;
}

const { width } = Dimensions.get('window');

export default function NotificationsScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { colors, isDark } = useTheme();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(() => {
            fetchNotifications();
        }, 10000);
        return () => clearInterval(interval);
    }, []);

    const fetchNotifications = async () => {
        try {
            const token = await SecureStore.getItemAsync('token');
            const response = await fetch(endpoints.notifications, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            if (Array.isArray(data)) {
                setNotifications(data);
            }
        } catch (error) {
            console.error('Failed to fetch notifications', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const markAllRead = async () => {
        try {
            const token = await SecureStore.getItemAsync('token');
            await fetch(`${endpoints.notifications}/read-all`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            fetchNotifications();
        } catch (error) {
            console.error('Failed to mark all read', error);
        }
    };

    const clearAllNotifications = async () => {
        const token = await SecureStore.getItemAsync('token');
        if (!token) return;

        Alert.alert(
            "Clear Notifications",
            "Are you sure you want to delete all notifications?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Clear All",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            const response = await fetch(endpoints.notifications, {
                                method: 'DELETE',
                                headers: {
                                    'Authorization': `Bearer ${token}`
                                }
                            });
                            if (response.ok) {
                                setNotifications([]);
                            }
                        } catch (error) {
                            console.error('Failed to clear notifications', error);
                        }
                    }
                }
            ]
        );
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchNotifications();
    };

    const renderItem = ({ item }: { item: Notification }) => (
        <View style={[
            styles.notificationCard, 
            !item.is_read && styles.unreadCard,
            {
                backgroundColor: colors.surface,
                borderColor: !item.is_read ? colors.primary : colors.border,
                borderWidth: 1,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: isDark ? 0 : 0.05,
                shadowRadius: 3,
                elevation: isDark ? 0 : 1,
            }
        ]}>
            <View style={[styles.iconContainer, { backgroundColor: item.title.includes('Confirm') ? 'rgba(34, 197, 94, 0.1)' : (isDark ? 'rgba(138, 43, 226, 0.15)' : '#F3E8FF') }]}>
                {item.title.includes('Confirm') ? (
                    <Ticket color="#22C55E" size={24} />
                ) : (
                    <CheckCircle2 color="#8A2BE2" size={24} />
                )}
            </View>
            <View style={styles.content}>
                <View style={styles.headerRow}>
                    <Text style={[styles.title, { color: colors.text }]}>{item.title}</Text>
                    {!item.is_read && <View style={styles.unreadDot} />}
                </View>
                <Text style={[styles.message, { color: colors.textSecondary }]}>{item.message}</Text>
                <Text style={[styles.time, { color: colors.textMuted }]}>{new Date(item.created_at).toLocaleString()}</Text>
            </View>
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top + 8 }]}>
            <StatusBar style={isDark ? 'light' : 'dark'} />
            {/* Header without outline or action buttons */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ChevronLeft color={colors.text} size={28} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Notifications</Text>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator color="#8A2BE2" size="large" />
                </View>
            ) : notifications.length > 0 ? (
                <FlatList
                    showsVerticalScrollIndicator={false}
                    data={notifications}
                    renderItem={renderItem}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={styles.list}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8A2BE2" />
                    }
                    ListFooterComponent={
                        notifications.length > 0 ? (
                            <View style={styles.footerContainer}>
                                <TouchableOpacity 
                                    onPress={clearAllNotifications}
                                    activeOpacity={0.6}
                                    style={styles.clearAllBtn}
                                >
                                    <Text style={styles.clearAllText}>Clear All</Text>
                                </TouchableOpacity>
                            </View>
                        ) : null
                    }
                />
            ) : (
                <View style={styles.center}>
                    <View style={[styles.emptyIcon, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}>
                        <Bell color={isDark ? "#3F3F46" : "#A78BFA"} size={64} />
                    </View>
                    <Text style={[styles.emptyTitle, { color: colors.text }]}>No Notifications Yet</Text>
                    <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>We'll notify you when something important happens.</Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0B0B15' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: width * 0.04,
        paddingBottom: 14,
        borderBottomWidth: 0, // No outline
    },
    backButton: { width: 40, height: 40, justifyContent: 'center' },
    headerTitle: { fontSize: 24, fontWeight: 'bold', marginLeft: 4 },
    list: { paddingHorizontal: width * 0.04, paddingBottom: 40, paddingTop: 4 },
    footerContainer: {
        paddingTop: 14,
        paddingBottom: 40,
        alignItems: 'flex-end', // Right side
        paddingHorizontal: 4,
    },
    clearAllBtn: {
        paddingVertical: 6,
        paddingHorizontal: 8,
    },
    clearAllText: {
        color: '#EF4444',
        fontSize: 13,
        fontWeight: '600',
    },
    notificationCard: {
        flexDirection: 'row',
        backgroundColor: '#1F1F2E',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    unreadCard: {
        borderColor: '#8A2BE2',
        backgroundColor: '#161625',
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    content: { flex: 1 },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    title: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
    unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#8A2BE2' },
    message: { color: '#9CA3AF', fontSize: 14, lineHeight: 20, marginBottom: 8 },
    time: { color: '#6B7280', fontSize: 12 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
    emptyIcon: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#1F1F2E',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
    },
    emptyTitle: { color: '#FFF', fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
    emptySubtitle: { color: '#9CA3AF', fontSize: 14, textAlign: 'center' },
});
