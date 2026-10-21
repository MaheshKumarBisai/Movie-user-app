import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeft, ArrowRight, CreditCard, Apple } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import { endpoints } from '../../../config/api';
import { useTheme } from '../../../context/ThemeContext';

export default function CheckoutScreen() {
    const { colors, isDark } = useTheme();
    const insets = useSafeAreaInsets();
    const params = useLocalSearchParams();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<'apple' | 'card'>('apple');

    const {
        showId,
        selectedSeats, // JSON string of seat IDs
        totalPrice,
        movieTitle,
        theatreName,
        screenName,
        showTime,
        poster,
        seatLabels, // "A1, A2"
        language,
        technology
    } = params;

    // Parse selectedSeats
    const seatIds = selectedSeats ? JSON.parse(selectedSeats as string) : [];
    const amount = parseFloat(totalPrice as string || '0');
    const serviceFee = 2.50; // Visual only, not charged as per request "just seat amount" in total calculation for backend, 
    // wait user said "make there is no service charge just seat amount" BUT "make it as it is design" (image has service fee).
    // User clarified: "make there is no service charge just seat amount". 
    // So I will SHOW it as 0 or remove it?
    // User: "make there is no service charge just seat amount". 
    // I will remove the service fee line item from calculation but keep visual if needed, or better, remove it to obey "no service charge".
    // Let's stick to user text over image. NO service charge.

    // Total Amount
    const finalAmount = amount; // + serviceFee if needed

    const handlePayment = async () => {
        setLoading(true);
        try {
            // 1. Get Token
            const token = await SecureStore.getItemAsync('token');
            if (!token) {
                Alert.alert("Error", "Please login to book tickets");
                setLoading(false);
                return;
            }

            // 2. Call Booking API (Create Booking)
            const response = await fetch(endpoints.bookings, {
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
                const err = await response.json();
                throw new Error(err.detail || "Booking failed");
            }

            const bookingData = await response.json();
            const bookingId = bookingData.id;

            // 3. Confirm Booking (Fake Payment)
            // Call confirm endpoint
            const confirmResponse = await fetch(`${endpoints.bookings}/confirm`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    booking_id: bookingId,
                    seat_ids: seatIds,
                    payment_id: "fake_payment_id_123"
                })
            });

            if (!confirmResponse.ok) {
                const err = await confirmResponse.json();
                throw new Error(err.detail || "Payment failed");
            }

            if (response.ok) {
                // Note: `response.json()` was already consumed into `bookingData`.
                // We use `bookingData` directly here.

                // Direct Navigation to Ticket Screen
                router.replace({
                    pathname: `/ticket/${bookingData.id}`,
                    params: {
                        bookingId: bookingData.id,
                        movieId: params.id,
                        movieTitle: movieTitle,
                        theatreName: theatreName,
                        screenName: screenName,
                        showTime: showTime,
                        showDate: params.showDate,
                        seatLabels: seatLabels,
                        language: language,
                        technology: technology
                    }
                });
            } else {
                Alert.alert("Error", "Booking failed. Please try again.");
            }

        } catch (error: any) {
            Alert.alert("Booking Failed", error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleBack = async () => {
        // Unlock seats before going back
        try {
            const token = await SecureStore.getItemAsync('token');
            if (token) {
                // Fire and forget unlock request - don't block navigation too long
                fetch(`${endpoints.seats}/unlock`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        show_id: parseInt(showId as string),
                        seat_ids: seatIds
                    })
                }).catch(err => console.log("Unlock failed", err));
            }
        } catch (e) {
            console.log("Error unlocking", e);
        }
        router.back();
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top + 8 }]}>
            <StatusBar style={isDark ? 'light' : 'dark'} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={handleBack} style={[styles.iconBtn, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}>
                    <ArrowLeft color={colors.text} size={22} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Checkout</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* Steps Visual */}
            <View style={styles.stepsContainer}>
                <View style={styles.step}>
                    <View style={[styles.stepDot, styles.stepActive]} />
                    <Text style={[styles.stepText, { color: colors.text }]}>TICKETS</Text>
                </View>
                <View style={styles.stepLine} />
                <View style={styles.step}>
                    <View style={[styles.stepDot, styles.stepActive]} />
                    <Text style={[styles.stepText, { color: colors.text }]}>SEATS</Text>
                </View>
                <View style={styles.stepLine} />
                <View style={styles.step}>
                    <View style={[styles.stepDot, styles.stepActive]} />
                    <Text style={[styles.stepText, { color: colors.text }]}>PAYMENT</Text>
                </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

                {/* Order Summary Card */}
                <View style={[styles.orderCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.cardLabel}>ORDER SUMMARY</Text>
                            <Text style={[styles.movieTitle, { color: colors.text }]}>{movieTitle}</Text>
                            <Text style={[styles.cinemaText, { color: colors.textSecondary }]}>{theatreName}</Text>
                            <Text style={[styles.dateText, { color: colors.textSecondary }]}>{showTime}</Text>
                        </View>
                        <Image
                            source={{ uri: poster as string || 'https://via.placeholder.com/100' }}
                            style={styles.poster}
                        />
                    </View>

                    <View style={[styles.divider, { backgroundColor: colors.border }]} />

                    <View style={{ marginTop: 16 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                            <Text style={styles.cardLabel}>SEATS</Text>
                            <Text style={styles.cardLabel}>TOTAL</Text>
                        </View>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text style={[styles.seatLabel, { color: colors.text }]}>{seatLabels}</Text>
                            <Text style={[styles.seatPrice, { color: colors.text }]}>₹{amount.toFixed(2)}</Text>
                        </View>
                    </View>
                </View>

                {/* Payment Method */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 30, marginBottom: 16 }}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Payment Method</Text>
                    <TouchableOpacity><Text style={styles.changeBtn}>ADD NEW</Text></TouchableOpacity>
                </View>

                <TouchableOpacity
                    style={[
                        styles.paymentOption,
                        { backgroundColor: colors.surface, borderColor: paymentMethod === 'apple' ? '#8A2BE2' : colors.border }
                    ]}
                    onPress={() => setPaymentMethod('apple')}
                >
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <View style={[styles.payIconContainer, { backgroundColor: isDark ? '#FFF' : '#F3E8FF' }]}>
                            <Apple color={isDark ? '#000' : '#8A2BE2'} size={20} />
                        </View>
                        <View style={{ marginLeft: 16 }}>
                            <Text style={[styles.payTitle, { color: colors.text }]}>Apple Pay</Text>
                            <Text style={[styles.paySub, { color: colors.textSecondary }]}>DEFAULT WALLET</Text>
                        </View>
                    </View>
                    <View style={[styles.radioOuter, { borderColor: paymentMethod === 'apple' ? '#8A2BE2' : colors.border }]}>
                        {paymentMethod === 'apple' && <View style={styles.radioInner} />}
                    </View>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        styles.paymentOption,
                        { backgroundColor: colors.surface, borderColor: paymentMethod === 'card' ? '#8A2BE2' : colors.border }
                    ]}
                    onPress={() => setPaymentMethod('card')}
                >
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <View style={[styles.payIconContainer, { backgroundColor: isDark ? '#1F1F2E' : '#F3E8FF' }]}>
                            <CreditCard color={isDark ? '#FFF' : '#8A2BE2'} size={20} />
                        </View>
                        <View style={{ marginLeft: 16 }}>
                            <Text style={[styles.payTitle, { color: colors.text }]}>Credit Card</Text>
                            <Text style={[styles.paySub, { color: colors.textSecondary }]}>•••• •••• •••• 4582</Text>
                        </View>
                    </View>
                    <View style={[styles.radioOuter, { borderColor: paymentMethod === 'card' ? '#8A2BE2' : colors.border }]}>
                        {paymentMethod === 'card' && <View style={styles.radioInner} />}
                    </View>
                </TouchableOpacity>

                {/* Breakdown */}
                <View style={{ marginTop: 30 }}>
                    <View style={styles.row}>
                        <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>Subtotal</Text>
                        <Text style={[styles.rowValue, { color: colors.text }]}>₹{amount.toFixed(2)}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>Service Fee</Text>
                        <Text style={[styles.rowValue, { color: colors.text }]}>₹0.00</Text>
                    </View>
                    <View style={[styles.divider, { backgroundColor: colors.border }]} />
                    <View style={[styles.row, { marginTop: 16 }]}>
                        <Text style={[styles.totalLabel, { color: colors.text }]}>Total Amount</Text>
                        <Text style={styles.totalValue}>₹{finalAmount.toFixed(2)}</Text>
                    </View>
                </View>

                {/* Pay Button */}
                <TouchableOpacity
                    style={styles.payButton}
                    onPress={handlePayment}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#FFF" />
                    ) : (
                        <>
                            <Text style={styles.payButtonText}>Pay Now</Text>
                            <ArrowRight color="#FFF" size={20} style={{ marginLeft: 8 }} />
                        </>
                    )}
                </TouchableOpacity>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0B0B15' },

    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 20 },
    iconBtn: { padding: 8, backgroundColor: '#1F1F2E', borderRadius: 50 }, // Circular back button
    headerTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },

    stepsContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 30, paddingHorizontal: 40 },
    step: { alignItems: 'center' },
    stepDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#2D2D3F', marginBottom: 4 },
    stepActive: { backgroundColor: '#8A2BE2', marginTop: -4, width: 16, height: 16, borderRadius: 8, shadowColor: '#8A2BE2', shadowRadius: 8, shadowOpacity: 0.8 },
    stepLine: { flex: 1, height: 2, backgroundColor: '#8A2BE2', marginHorizontal: 4, marginBottom: 14 }, // connecting lines
    stepText: { color: '#6B7280', fontSize: 10, fontWeight: 'bold' },
    textActive: { color: '#FFF' },

    content: { paddingHorizontal: 20, paddingBottom: 40 },

    orderCard: { backgroundColor: '#13131A', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: '#2D2D3F' },
    cardLabel: { color: '#8A2BE2', fontSize: 10, fontWeight: 'bold', letterSpacing: 1, marginBottom: 8 },
    movieTitle: { color: '#FFF', fontSize: 22, fontWeight: 'bold', marginBottom: 4 },
    cinemaText: { color: '#9CA3AF', fontSize: 14, marginBottom: 4 },
    dateText: { color: '#9CA3AF', fontSize: 14 },
    poster: { width: 70, height: 100, borderRadius: 12 },

    divider: { height: 1, backgroundColor: '#2D2D3F', marginVertical: 4 },
    seatLabel: { color: '#FFF', fontSize: 14, fontWeight: '600' },
    seatPrice: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },

    sectionTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
    changeBtn: { color: '#8A2BE2', fontSize: 12, fontWeight: 'bold', letterSpacing: 1 },

    paymentOption: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        backgroundColor: '#13131A', padding: 16, borderRadius: 16, marginBottom: 12,
        borderWidth: 1, borderColor: '#2D2D3F'
    },
    paymentActive: { borderColor: '#8A2BE2' },
    payIconContainer: { width: 48, height: 32, backgroundColor: '#FFF', borderRadius: 4, justifyContent: 'center', alignItems: 'center' },
    payTitle: { color: '#FFF', fontSize: 16, fontWeight: '600' },
    paySub: { color: '#6B7280', fontSize: 10 },

    radioOuter: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#2D2D3F', justifyContent: 'center', alignItems: 'center' },
    radioInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#8A2BE2' },

    row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    rowLabel: { color: '#9CA3AF', fontSize: 14 },
    rowValue: { color: '#FFF', fontSize: 14, fontWeight: '600' },
    totalLabel: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
    totalValue: { color: '#8A2BE2', fontSize: 24, fontWeight: 'bold' },

    payButton: {
        backgroundColor: '#8A2BE2', height: 56, borderRadius: 16,
        flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
        marginTop: 30,
        shadowColor: '#8A2BE2', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16
    },
    payButtonText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' }
});
