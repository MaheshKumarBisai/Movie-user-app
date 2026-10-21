import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeft, Calendar, MapPin, Clock } from 'lucide-react-native';
import * as SecureStore from 'expo-secure-store';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { endpoints } from '../config/api';
import { useTheme } from '../context/ThemeContext';

export default function MyBookingsScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { colors, isDark } = useTheme();
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchBookings();
    }, []);

    const fetchBookings = async () => {
        try {
            const token = await SecureStore.getItemAsync('token');
            if (!token) return;

            const response = await fetch(endpoints.myBookings, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setBookings(data);
            }
        } catch (error) {
            console.error("Failed to fetch bookings", error);
        } finally {
            setLoading(false);
        }
    };

    const renderItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={[
                styles.card,
                {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    borderWidth: 1,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: isDark ? 0 : 0.06,
                    shadowRadius: 4,
                    elevation: isDark ? 0 : 2,
                }
            ]}
            onPress={() => {
                const dateObj = new Date(item.show_time);
                const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                router.push({
                    pathname: `/ticket/${item.id}`,
                    params: {
                        bookingId: item.id,
                        movieTitle: item.movie_title,
                        theatreName: item.theater_name,
                        showTime: timeStr,
                        showDate: item.show_time,
                        seatLabels: item.seat_label || 'N/A',
                        screenName: item.screen_name || 'N/A'
                    }
                });
            }}
        >
            <Image
                source={{ uri: item.poster_url || 'https://via.placeholder.com/100' }}
                style={styles.poster}
            />
            <View style={styles.cardContent}>
                <Text style={[styles.movieTitle, { color: colors.text }]}>{item.movie_title}</Text>

                <View style={styles.row}>
                    <MapPin color={colors.textSecondary} size={14} />
                    <Text style={[styles.metaText, { color: colors.textSecondary }]}>{item.theater_name}</Text>
                </View>

                <View style={styles.row}>
                    <Clock color={colors.textSecondary} size={14} />
                    <Text style={[styles.metaText, { color: colors.textSecondary }]}>{item.show_time}</Text>
                </View>

                <View style={styles.statusRow}>
                    <View style={[styles.badge, item.status === 'CONFIRMED' ? styles.confirmed : styles.pending]}>
                        <Text style={[styles.badgeText, item.status === 'CONFIRMED' ? { color: '#8A2BE2' } : { color: '#FACC15' }]}>
                            {item.status}
                        </Text>
                    </View>
                    <Text style={[styles.price, { color: colors.primary }]}>₹{item.total_amount}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top + 10 }]}>
            <StatusBar style={isDark ? 'light' : 'dark'} />
            <Stack.Screen options={{ headerShown: false, animation: 'fade_from_bottom' }} />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
                    <ArrowLeft color={colors.text} size={24} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>My Bookings</Text>
                <View style={{ width: 40 }} />
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#8A2BE2" />
                </View>
            ) : (
                <FlatList
                    showsVerticalScrollIndicator={false}
                    data={bookings}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={
                        <View style={styles.center}>
                            <Text style={styles.emptyText}>No bookings found</Text>
                        </View>
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0B0B15' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 20 },
    iconBtn: { padding: 8, backgroundColor: '#1F1F2E', borderRadius: 20 },
    headerTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },

    list: { paddingHorizontal: 20, paddingBottom: 40 },

    card: { flexDirection: 'row', backgroundColor: '#13131A', borderRadius: 16, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: '#1F1F2E' },
    poster: { width: 80, height: 110, borderRadius: 12 },
    cardContent: { flex: 1, marginLeft: 16, justifyContent: 'space-between' },

    movieTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
    row: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
    metaText: { color: '#9CA3AF', fontSize: 12 },

    statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
    badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: '#1F1F2E' },
    confirmed: { backgroundColor: 'rgba(138, 43, 226, 0.1)' },
    pending: { backgroundColor: 'rgba(250, 204, 21, 0.1)' },
    badgeText: { fontSize: 10, fontWeight: 'bold' },
    price: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },

    emptyText: { color: '#6B7280', fontSize: 16 }
});
