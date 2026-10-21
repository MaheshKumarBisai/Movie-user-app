import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Image, TouchableOpacity, RefreshControl, Dimensions } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ticket, Calendar, Clock, MapPin, ChevronRight, Armchair } from 'lucide-react-native';
import * as SecureStore from 'expo-secure-store';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { endpoints } from '../../config/api';
import { useTheme } from '../../context/ThemeContext';

const { width } = Dimensions.get('window');

export default function TicketsScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { colors, isDark } = useTheme();
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useFocusEffect(
        useCallback(() => {
            fetchBookings();
        }, [])
    );

    const fetchBookings = async () => {
        try {
            const token = await SecureStore.getItemAsync('token');
            const response = await fetch(endpoints.myBookings, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (Array.isArray(data)) setBookings(data);
        } catch (error) {
            console.error("Failed to fetch tickets", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchBookings();
    };

    const handleTicketPress = (item: any) => {
        const dateObj = new Date(item.show_time);
        const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        router.push({
            pathname: `/ticket/${item.id}`,
            params: {
                bookingId: item.id,
                movieId: item.movie_id,
                movieTitle: item.movie_title,
                theatreName: item.theater_name,
                showTime: timeStr,
                showDate: item.show_time,
                seatLabels: item.seat_label || 'N/A',
                screenName: item.screen_name || 'N/A'
            }
        });
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar style={isDark ? 'light' : 'dark'} />

            {/* Fixed Header without outline - stays fixed at top while content scrolls */}
            <View style={[styles.fixedHeader, { paddingTop: insets.top + 8, backgroundColor: colors.background }]}>
                <Text style={[styles.headerTitle, { color: colors.text }]}>My Tickets</Text>
            </View>

            {loading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#8A2BE2" />
                </View>
            ) : bookings.length === 0 ? (
                <View style={styles.emptyState}>
                    <View style={[styles.emptyIconCircle, { backgroundColor: isDark ? 'rgba(138, 43, 226, 0.15)' : '#F3E8FF' }]}>
                        <Ticket size={48} color="#8A2BE2" />
                    </View>
                    <Text style={[styles.emptyTitle, { color: colors.text }]}>No Tickets Booked Yet</Text>
                    <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                        Explore movies now showing in theatres and book your seats!
                    </Text>
                    <TouchableOpacity
                        style={styles.exploreBtn}
                        onPress={() => router.push('/(tabs)/home')}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.exploreBtnText}>Browse Movies</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    showsVerticalScrollIndicator={false}
                    data={bookings}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={[styles.listContent, { paddingBottom: 110 }]}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8A2BE2" />
                    }
                    renderItem={({ item }) => {
                        const dateObj = new Date(item.show_time);
                        const dateFormatted = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                        const timeFormatted = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                        const isConfirmed = item.status === 'CONFIRMED';
                        const isCancelled = item.status === 'CANCELLED';

                        return (
                            <TouchableOpacity
                                style={[
                                    styles.ticketCard,
                                    {
                                        backgroundColor: colors.surface,
                                        borderColor: colors.border,
                                        shadowColor: '#000',
                                        shadowOffset: { width: 0, height: 3 },
                                        shadowOpacity: isDark ? 0.25 : 0.08,
                                        shadowRadius: 8,
                                        elevation: isDark ? 0 : 3,
                                    }
                                ]}
                                onPress={() => handleTicketPress(item)}
                                activeOpacity={0.85}
                            >
                                <View style={styles.cardMain}>
                                    {/* Left: Poster */}
                                    <View style={styles.posterContainer}>
                                        {item.poster_url ? (
                                            <Image source={{ uri: item.poster_url }} style={styles.poster} />
                                        ) : (
                                            <View style={[styles.posterFallback, { backgroundColor: isDark ? '#272738' : '#EDE9FE' }]}>
                                                <Ticket size={28} color="#8A2BE2" />
                                            </View>
                                        )}
                                    </View>

                                    {/* Right: Info */}
                                    <View style={styles.cardInfo}>
                                        <View style={styles.cardHeaderRow}>
                                            <Text style={[styles.movieTitle, { color: colors.text }]} numberOfLines={1}>
                                                {item.movie_title || 'Movie'}
                                            </Text>
                                            <View style={[
                                                styles.statusBadge,
                                                {
                                                    backgroundColor: isConfirmed 
                                                        ? (isDark ? 'rgba(16, 185, 129, 0.2)' : '#D1FAE5')
                                                        : isCancelled 
                                                        ? (isDark ? 'rgba(239, 68, 68, 0.2)' : '#FEE2E2')
                                                        : (isDark ? 'rgba(245, 158, 11, 0.2)' : '#FEF3C7')
                                                }
                                            ]}>
                                                <View style={[
                                                    styles.statusDot,
                                                    { backgroundColor: isConfirmed ? '#10B981' : isCancelled ? '#EF4444' : '#F59E0B' }
                                                ]} />
                                                <Text style={[
                                                    styles.statusText,
                                                    { color: isConfirmed ? '#10B981' : isCancelled ? '#EF4444' : '#D97706' }
                                                ]}>
                                                    {item.status || 'CONFIRMED'}
                                                </Text>
                                            </View>
                                        </View>

                                        {/* Theater & Hall */}
                                        <View style={styles.theaterRow}>
                                            <MapPin size={13} color="#8A2BE2" style={{ marginRight: 4 }} />
                                            <Text style={[styles.theaterText, { color: colors.textSecondary }]} numberOfLines={1}>
                                                {item.theater_name} {item.screen_name ? `• ${item.screen_name}` : ''}
                                            </Text>
                                        </View>

                                        {/* Show Date & Time */}
                                        <View style={styles.dateTimeRow}>
                                            <Calendar size={13} color={colors.textSecondary} style={{ marginRight: 4 }} />
                                            <Text style={[styles.dateTimeText, { color: colors.textSecondary }]}>
                                                {dateFormatted}
                                            </Text>
                                            <Clock size={13} color={colors.textSecondary} style={{ marginLeft: 10, marginRight: 4 }} />
                                            <Text style={[styles.dateTimeText, { color: colors.textSecondary }]}>
                                                {timeFormatted}
                                            </Text>
                                        </View>

                                        {/* Seats & Price */}
                                        <View style={styles.cardFooterRow}>
                                            <View style={[styles.seatsPill, { backgroundColor: isDark ? '#272738' : '#F3F4F6' }]}>
                                                <Armchair size={12} color="#8A2BE2" style={{ marginRight: 4 }} />
                                                <Text style={[styles.seatsText, { color: colors.text }]}>
                                                    {item.seat_label || 'Seat Reserved'}
                                                </Text>
                                            </View>
                                            <Text style={styles.amountText}>₹{item.total_amount}</Text>
                                        </View>
                                    </View>
                                </View>

                                {/* Notch Separator */}
                                <View style={styles.notchContainer}>
                                    <View style={[styles.notch, styles.notchLeft, { backgroundColor: colors.background }]} />
                                    <View style={[styles.dashedDivider, { borderColor: colors.border }]} />
                                    <View style={[styles.notch, styles.notchRight, { backgroundColor: colors.background }]} />
                                </View>

                                {/* View E-Ticket Action */}
                                <View style={styles.cardActionRow}>
                                    <Text style={styles.viewTicketText}>View E-Ticket & QR Code</Text>
                                    <ChevronRight size={16} color="#8A2BE2" />
                                </View>
                            </TouchableOpacity>
                        );
                    }}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        backgroundColor: '#0B0B15' 
    },
    // Fixed Header - pinned outside scroll area with NO outline / border
    fixedHeader: {
        paddingHorizontal: 20,
        paddingBottom: 14,
        borderBottomWidth: 0, // No outline
    },
    headerTitle: { 
        fontSize: 26, 
        fontWeight: 'bold', 
        letterSpacing: 0.3 
    },
    centerContainer: { 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center' 
    },
    listContent: { 
        paddingHorizontal: 20, 
        paddingTop: 8 
    },

    // Empty State
    emptyState: { 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        paddingHorizontal: 32 
    },
    emptyIconCircle: { 
        width: 90, 
        height: 90, 
        borderRadius: 45, 
        justifyContent: 'center', 
        alignItems: 'center', 
        marginBottom: 20 
    },
    emptyTitle: { 
        fontSize: 20, 
        fontWeight: 'bold', 
        marginBottom: 8, 
        textAlign: 'center' 
    },
    emptySubtitle: { 
        fontSize: 14, 
        textAlign: 'center', 
        lineHeight: 20, 
        marginBottom: 24 
    },
    exploreBtn: { 
        backgroundColor: '#8A2BE2', 
        paddingVertical: 14, 
        paddingHorizontal: 28, 
        borderRadius: 14 
    },
    exploreBtnText: { 
        color: '#FFF', 
        fontSize: 15, 
        fontWeight: 'bold' 
    },

    // Ticket Card
    ticketCard: { 
        borderRadius: 20, 
        marginBottom: 18, 
        borderWidth: 1, 
        overflow: 'hidden' 
    },
    cardMain: { 
        flexDirection: 'row', 
        padding: 16 
    },
    posterContainer: { 
        marginRight: 14 
    },
    poster: { 
        width: 78, 
        height: 110, 
        borderRadius: 12, 
        backgroundColor: '#272738' 
    },
    posterFallback: { 
        width: 78, 
        height: 110, 
        borderRadius: 12, 
        justifyContent: 'center', 
        alignItems: 'center' 
    },
    cardInfo: { 
        flex: 1, 
        justifyContent: 'space-between' 
    },
    cardHeaderRow: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: 6 
    },
    movieTitle: { 
        fontSize: 17, 
        fontWeight: 'bold', 
        flex: 1, 
        marginRight: 8 
    },
    statusBadge: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        paddingHorizontal: 8, 
        paddingVertical: 3, 
        borderRadius: 12 
    },
    statusDot: { 
        width: 6, 
        height: 6, 
        borderRadius: 3, 
        marginRight: 5 
    },
    statusText: { 
        fontSize: 10, 
        fontWeight: '700', 
        letterSpacing: 0.5 
    },
    theaterRow: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        marginBottom: 6 
    },
    theaterText: { 
        fontSize: 13, 
        fontWeight: '500', 
        flex: 1 
    },
    dateTimeRow: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        marginBottom: 8 
    },
    dateTimeText: { 
        fontSize: 12, 
        fontWeight: '500' 
    },
    cardFooterRow: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center' 
    },
    seatsPill: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        paddingHorizontal: 8, 
        paddingVertical: 4, 
        borderRadius: 8 
    },
    seatsText: { 
        fontSize: 11, 
        fontWeight: '600' 
    },
    amountText: { 
        fontSize: 17, 
        fontWeight: '800', 
        color: '#8A2BE2' 
    },

    // Notches & Perforation
    notchContainer: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        position: 'relative', 
        height: 16, 
        marginHorizontal: -1 
    },
    notch: { 
        width: 18, 
        height: 18, 
        borderRadius: 9, 
        position: 'absolute' 
    },
    notchLeft: { 
        left: -9 
    },
    notchRight: { 
        right: -9 
    },
    dashedDivider: { 
        flex: 1, 
        borderWidth: 1, 
        borderStyle: 'dashed', 
        marginHorizontal: 16 
    },

    // Card Action Row
    cardActionRow: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        paddingHorizontal: 16, 
        paddingVertical: 12 
    },
    viewTicketText: { 
        fontSize: 12, 
        fontWeight: '700', 
        color: '#8A2BE2' 
    }
});
