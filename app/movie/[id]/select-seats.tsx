import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Dimensions, RefreshControl, ActivityIndicator, PanResponder, Animated } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeft, ArrowRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { endpoints } from '../../../config/api';
import { useTheme } from '../../../context/ThemeContext';
import * as SecureStore from 'expo-secure-store';

const { width } = Dimensions.get('window');

export default function SelectSeatsScreen() {
    const { colors, isDark } = useTheme();
    const insets = useSafeAreaInsets();
    const params = useLocalSearchParams();
    const { id, showId, theatreName, screenName, movieTitle, showTime, language, technology } = params;
    const router = useRouter();

    // Convert params to string if they are arrays (defensive coding)
    const title = Array.isArray(movieTitle) ? movieTitle[0] : movieTitle;
    const cinema = Array.isArray(theatreName) ? theatreName[0] : theatreName;
    const time = Array.isArray(showTime) ? showTime[0] : showTime;
    const screen = Array.isArray(screenName) ? screenName[0] : screenName || 'SCREEN';

    const [seats, setSeats] = useState<any[]>([]);
    const [selectedSeats, setSelectedSeats] = useState<Set<number>>(new Set());
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Strict default & minimum zoom at 100% (1.0). Never shrinks below 100%.
    const MIN_SCALE = 1.0;
    const MAX_SCALE = 1.8;

    const zoomAnim = useRef(new Animated.Value(1.0)).current;
    const currentScale = useRef(1.0);
    const initialDistanceRef = useRef<number | null>(null);
    const initialScaleRef = useRef(1.0);

    // Smooth GPU-accelerated 2-finger pinch gesture handler
    const panResponder = useMemo(() => PanResponder.create({
        onStartShouldSetPanResponder: (evt) => evt.nativeEvent.touches.length === 2,
        onMoveShouldSetPanResponder: (evt) => evt.nativeEvent.touches.length === 2,
        onPanResponderGrant: (evt) => {
            if (evt.nativeEvent.touches.length === 2) {
                const [t1, t2] = evt.nativeEvent.touches;
                const distance = Math.hypot(t1.pageX - t2.pageX, t1.pageY - t2.pageY);
                initialDistanceRef.current = distance;
                initialScaleRef.current = currentScale.current;
            }
        },
        onPanResponderMove: (evt) => {
            if (evt.nativeEvent.touches.length === 2 && initialDistanceRef.current && initialDistanceRef.current > 0) {
                const [t1, t2] = evt.nativeEvent.touches;
                const distance = Math.hypot(t1.pageX - t2.pageX, t1.pageY - t2.pageY);
                const scaleFactor = distance / initialDistanceRef.current;
                // Strictly clamp to minimum 1.0 (100%) so seats never shrink smaller than their visible 100% size
                const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, initialScaleRef.current * scaleFactor));
                currentScale.current = newScale;
                zoomAnim.setValue(newScale);
            }
        },
        onPanResponderRelease: () => {
            initialDistanceRef.current = null;
            if (currentScale.current < MIN_SCALE) {
                currentScale.current = MIN_SCALE;
                Animated.spring(zoomAnim, {
                    toValue: MIN_SCALE,
                    useNativeDriver: true,
                    friction: 7,
                }).start();
            } else if (currentScale.current > MAX_SCALE) {
                currentScale.current = MAX_SCALE;
                Animated.spring(zoomAnim, {
                    toValue: MAX_SCALE,
                    useNativeDriver: true,
                    friction: 7,
                }).start();
            }
        },
        onPanResponderTerminate: () => {
            initialDistanceRef.current = null;
        },
    }), [zoomAnim]);

    const onRefresh = React.useCallback(async () => {
        setRefreshing(true);
        await fetchSeats();
        setRefreshing(false);
    }, [showId]);

    useEffect(() => {
        if (showId) fetchSeats();
    }, [showId]);

    const fetchSeats = async () => {
        try {
            const response = await fetch(`${endpoints.shows.replace('/shows', '')}/seats/layout/${showId}`);
            const data = await response.json();
            setSeats(data);
        } catch (error) {
            console.error("Failed to fetch seats", error);
            Alert.alert("Error", "Could not load seat layout");
        } finally {
            setLoading(false);
        }
    };

    const toggleSeat = (seatId: number) => {
        const newSelected = new Set(selectedSeats);
        if (newSelected.has(seatId)) {
            newSelected.delete(seatId);
        } else {
            newSelected.add(seatId);
        }
        setSelectedSeats(newSelected);
    };

    const getSeatStyle = (status: string, isSelected: boolean) => {
        if (status === 'BOOKED') {
            return {
                borderColor: isDark ? '#6B7280' : '#64748B',
                backgroundColor: isDark ? '#4B5563' : '#94A3B8',
                opacity: 1
            };
        }
        if (isSelected) {
            return {
                borderColor: '#8A2BE2',
                backgroundColor: '#8A2BE2'
            };
        }
        return {
            borderColor: isDark ? '#4B5563' : '#CBD5E1',
            backgroundColor: isDark ? 'transparent' : '#FAF5FF'
        };
    };

    // Calculate Totals
    const selectedList = seats.filter(s => selectedSeats.has(s.id));
    const totalPrice = selectedList.reduce((sum, s) => sum + s.price, 0);
    const seatLabels = selectedList.map(s => `${s.row}${s.number}`).join(', ');

    // Group seats by row for rendering
    const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
    const seatsByRow = (rowLabel: string) => seats.filter(s => s.row === rowLabel).sort((a, b) => parseInt(a.number) - parseInt(b.number));


    const handleSeatPress = (seat: any) => {
        if (seat.status === 'AVAILABLE') {
            toggleSeat(seat.id);
        } else if (seat.status === 'LOCKED') {
            Alert.alert(
                "Seat Locked",
                "This seat is currently held. It may become available soon.",
                [
                    { text: "Cancel", style: "cancel" },
                    { text: "Refresh Status", onPress: fetchSeats }
                ]
            );
        } else if (seat.status === 'BOOKED') {
            Alert.alert("Seat Booked", "This seat has already been sold.");
        }
    };


    const handleBookSeats = async () => {
        if (selectedSeats.size === 0) return;

        setLoading(true); // Maybe add a separate connecting state, but loading works
        try {
            const token = await SecureStore.getItemAsync('token');
            if (!token) {
                Alert.alert("Login Required", "Please login to book seats", [
                    { text: "Login", onPress: () => router.push('/auth') }
                ]);
                return;
            }

            const seatIds = Array.from(selectedSeats);

            // Call Lock API
            const response = await fetch(`${endpoints.seats}/lock`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    show_id: parseInt(showId as string),
                    seat_ids: seatIds
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                if (response.status === 409) {
                    Alert.alert("Seats Unavailable", "One or more seats are already held or booked by another user.");
                    // Refresh seats to show new status
                    fetchSeats();
                    return;
                }
                throw new Error(errorData.detail || "Failed to lock seats");
            }

            // Success -> Navigate to Checkout
            router.push({
                pathname: `/movie/${id}/checkout`,
                params: {
                    showId,
                    selectedSeats: JSON.stringify(seatIds),
                    seatLabels,
                    totalPrice: totalPrice.toString(),
                    movieTitle: title,
                    theatreName: cinema,
                    showTime: time,
                    screenName: screen,
                    showDate: params.showDate,
                    poster: params.poster,
                    language: language,
                    technology: technology
                }
            });

        } catch (error: any) {
            Alert.alert("Error", error.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top + 8, justifyContent: 'center', alignItems: 'center' }]}>
                <StatusBar style={isDark ? 'light' : 'dark'} />
                <ActivityIndicator size="large" color="#8A2BE2" />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top + 8 }]}>
            <StatusBar style={isDark ? 'light' : 'dark'} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={[styles.iconBtn, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: 20 }]}>
                    <ArrowLeft color={colors.text} size={22} />
                </TouchableOpacity>
                <View style={{ alignItems: 'center' }}>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>{title}</Text>
                    <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>{cinema} • {time}</Text>
                </View>
                <View style={{ width: 40 }} />
            </View>

            {/* Screen Visual */}
            <View style={styles.screenContainer}>
                <View style={[styles.screenCurve, { borderColor: '#8A2BE2' }]}>
                    <LinearGradient
                        colors={['rgba(138, 43, 226, 0.8)', 'transparent']}
                        style={styles.screenGradient}
                    />
                </View>
                <Text style={[styles.screenText, { color: colors.textSecondary }]}>{screen.toUpperCase()}</Text>
            </View>

            {/* Seat Layout by Categories with 2-finger pinch zoom */}
            <View style={{ flex: 1 }} {...panResponder.panHandlers}>
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.verticalScrollContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8A2BE2" />
                    }
                >
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={true}
                        nestedScrollEnabled={true}
                        contentContainerStyle={styles.horizontalScrollContent}
                    >
                        <Animated.View style={[styles.sectionsWrapper, { transform: [{ scale: zoomAnim }] }]}>
                            {['REGULAR', 'PREMIUM', 'RECLINER'].map((type) => {
                                const typeSeats = seats.filter(s => s.type === type);
                                if (typeSeats.length === 0) return null;

                                // Get unique rows for this type
                                const typeRows = Array.from(new Set(typeSeats.map(s => s.row))).sort();
                                const price = typeSeats[0]?.price;

                                return (
                                    <View key={type} style={[styles.sectionContainer, { borderBottomColor: colors.border }]}>
                                        <Text style={[styles.sectionTitle, { color: colors.text }]}>{type} (₹{price})</Text>

                                        {typeRows.map(row => (
                                            <View key={row} style={styles.rowContainer}>
                                                <Text style={[styles.rowLetterText, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                                                    {row.toUpperCase()}
                                                </Text>

                                                <View style={styles.seatsRow}>
                                                    {seatsByRow(row).map(seat => {
                                                        const isGap = seat.number === '3' || seat.number === '7';
                                                        return (
                                                            <React.Fragment key={seat.id}>
                                                                <TouchableOpacity
                                                                    style={[
                                                                        styles.seat,
                                                                        getSeatStyle(seat.status, selectedSeats.has(seat.id))
                                                                    ]}
                                                                    onPress={() => handleSeatPress(seat)}
                                                                    activeOpacity={0.8}
                                                                />
                                                                {isGap && <View style={styles.aisleGap} />}
                                                            </React.Fragment>
                                                        );
                                                    })}
                                                </View>
                                            </View>
                                        ))}
                                    </View>
                                );
                            })}
                        </Animated.View>
                    </ScrollView>
                </ScrollView>
            </View>

            {/* Bottom Bar */}
            {selectedSeats.size > 0 && (
                <View style={[styles.bottomBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
                    <View style={styles.selectionInfo}>
                        <View style={{ flex: 1, marginRight: 10 }}>
                            <Text style={[styles.label, { color: colors.textSecondary }]}>SELECTED SEATS</Text>
                            <Text style={[styles.seatText, { color: colors.text }]}>{seatLabels} • {selectedSeats.size} Tickets</Text>
                        </View>
                        <View style={{ minWidth: 100, alignItems: 'flex-end' }}>
                            <Text style={[styles.label, { textAlign: 'right', color: colors.textSecondary, fontSize: 10, fontWeight: 'bold' }]}>Total Price</Text>
                            <Text style={styles.priceText}>₹{totalPrice.toFixed(2)}</Text>
                        </View>
                    </View>

                    <TouchableOpacity style={styles.bookButton} onPress={handleBookSeats}>
                        <Text style={styles.bookButtonText}>Book Seats</Text>
                        <ArrowRight color="#FFF" size={20} style={{ marginLeft: 8 }} />
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0B0B15' },

    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 20 },
    iconBtn: { padding: 8 },
    headerTitle: { color: '#FFF', fontSize: 16, fontWeight: 'bold', textAlign: 'center' },
    headerSubtitle: { color: '#9CA3AF', fontSize: 12, fontWeight: '500', textAlign: 'center', marginTop: 2 },

    screenContainer: { alignItems: 'center', marginBottom: 24, marginTop: 10 },
    screenCurve: {
        width: width * 0.8, height: 40, borderTopLeftRadius: 100, borderTopRightRadius: 100,
        borderTopWidth: 4, borderColor: '#8A2BE2', overflow: 'hidden',
        shadowColor: '#8A2BE2', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.5, shadowRadius: 20, elevation: 10
    },
    screenGradient: { width: '100%', height: '100%', opacity: 0.5 },
    screenText: { color: '#9CA3AF', fontSize: 10, fontWeight: 'bold', letterSpacing: 2, marginTop: 10 },

    verticalScrollContent: { paddingBottom: 160 },
    horizontalScrollContent: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 40, paddingRight: 80 },
    sectionsWrapper: { alignItems: 'flex-start' },

    sectionContainer: { marginBottom: 24, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#1F1F2E', width: '100%' },
    sectionTitle: { color: '#FFF', fontSize: 14, fontWeight: 'bold', marginBottom: 16, marginTop: 8, textAlign: 'center', textTransform: 'uppercase', letterSpacing: 1 },
    rowContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    rowLetterText: { fontSize: 14, fontWeight: '700', textAlign: 'center', width: 20, marginRight: 10 },
    seatsRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    aisleGap: { width: 18 },

    seat: { width: 28, height: 28, borderRadius: 6, borderWidth: 1 },
    seatAvailable: { borderColor: '#4B5563', backgroundColor: 'transparent' },
    seatSelected: { borderColor: '#8A2BE2', backgroundColor: '#8A2BE2' },
    seatBooked: { borderColor: '#64748B', backgroundColor: '#94A3B8', opacity: 1 },

    bottomBar: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        backgroundColor: '#13131A', padding: 20, paddingBottom: 40,
        borderTopLeftRadius: 24, borderTopRightRadius: 24,
        borderTopWidth: 1, borderTopColor: '#2D2D3F'
    },
    selectionInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
    label: { color: '#6B7280', fontSize: 10, fontWeight: 'bold', marginBottom: 4, textTransform: 'uppercase' },
    seatText: { color: '#FFF', fontSize: 16, fontWeight: 'bold', lineHeight: 24 },
    priceText: { color: '#8A2BE2', fontSize: 20, fontWeight: 'bold', textAlign: 'right' },

    bookButton: {
        backgroundColor: '#8A2BE2', height: 56, borderRadius: 16,
        flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
        shadowColor: '#8A2BE2', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 10
    },
    bookButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' }
});
