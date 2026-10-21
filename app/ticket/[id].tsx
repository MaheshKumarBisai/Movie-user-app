import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, Alert, Share, KeyboardAvoidingView, Platform, Modal } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Share2, Check, Download, Star, Edit3, X, XCircle } from 'lucide-react-native';
import QRCode from 'react-native-qrcode-svg';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as SecureStore from 'expo-secure-store';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { endpoints, API_URL } from '../../config/api';
import { TextInput } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

const { width } = Dimensions.get('window');

export default function TicketScreen() {
    const { colors, isDark } = useTheme();
    const { id, movieTitle, theatreName, screenName, showTime, showDate, seatLabels, bookingId, movieId, language, technology } = useLocalSearchParams();
    const formattedDate = showDate ? new Date(showDate as string).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase() : 'DATE';
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [qrValue, setQrValue] = useState("LOADING");
    const [movieInfo, setMovieInfo] = useState<any>(null);

    // Review Modal State
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [submittingReview, setSubmittingReview] = useState(false);
    const [reviewSuccess, setReviewSuccess] = useState(false);
    const [cancelled, setCancelled] = useState(false);

    useEffect(() => {
        if (id) {
            setQrValue(`BOOKING:${id}:${bookingId}`);
        }
    }, [id, bookingId]);

    useEffect(() => {
        if (movieId) {
            fetch(`${endpoints.movies}/${movieId}`)
                .then(res => res.json())
                .then(data => {
                    if (data && data.title) {
                        setMovieInfo(data);
                    }
                })
                .catch(() => {});
        }
    }, [movieId]);

    const handleShare = async () => {
        try {
            await Share.share({
                message: `I'm watching ${movieTitle} at ${theatreName} on ${showTime}! Seats: ${seatLabels}.`,
            });
        } catch (error) {
            console.log(error);
        }
    };

    const handleDownloadPDF = async () => {
        try {
            const html = `
                <html>
                  <body style="text-align: center; font-family: Helvetica, sans-serif;">
                    <h1 style="margin-top: 50px;">Movie Ticket</h1>
                    <h2>${movieTitle}</h2>
                    <p><strong>Theater:</strong> ${theatreName}</p>
                    <p><strong>Time:</strong> ${showTime}</p>
                    <p><strong>Seats:</strong> ${seatLabels}</p>
                    <p><strong>Booking ID:</strong> #${bookingId}</p>
                    <div style="margin-top: 50px;">
                        <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${qrValue}" />
                    </div>
                  </body>
                </html>
            `;
            const { uri } = await Print.printToFileAsync({ html });

            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(uri);
            } else {
                Alert.alert("Error", "Sharing is not available on this device");
            }
        } catch (error) {
            Alert.alert("Error", "Failed to generate PDF");
        }
    };

    const handleCancelTicket = () => {
        Alert.alert(
            "Cancel Ticket",
            "Are you sure you want to cancel this ticket?",
            [
                { text: "No", style: "cancel" },
                {
                    text: "Yes, Cancel",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            const token = await SecureStore.getItemAsync('token');
                            const response = await fetch(endpoints.cancelBooking, {
                                method: 'POST',
                                headers: {
                                    'Authorization': `Bearer ${token}`,
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({ booking_id: parseInt(bookingId as string), seat_ids: [] })
                            });
                            const data = await response.json();
                            if (response.ok) {
                                setCancelled(true);
                                Alert.alert("Cancelled", data.message || "Your ticket has been cancelled.");
                            } else {
                                Alert.alert("Cannot Cancel", data.detail || "Something went wrong.");
                            }
                        } catch (error) {
                            Alert.alert("Error", "Failed to cancel the ticket.");
                        }
                    }
                }
            ]
        );
    };

    const handleSubmitReview = async () => {
        if (rating === 0) {
            Alert.alert("Missing Rating", "Please select a star rating");
            return;
        }

        try {
            setSubmittingReview(true);
            const token = await SecureStore.getItemAsync('token');

            if (!movieId) {
                Alert.alert("Error", "We're not sure which movie this is for!");
                return;
            }

            const response = await fetch(`${API_URL}/movies/${movieId}/reviews`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    movie_id: parseInt(movieId as string),
                    rating: rating,
                    comment: comment
                })
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.detail || 'Failed to submit review');
            }

            setReviewSuccess(true);
        } catch (error: any) {
            Alert.alert("Failed to Post Review", error.message);
        } finally {
            setSubmittingReview(false);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
                <StatusBar style={isDark ? 'light' : 'dark'} />

                {/* Header */}
                <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                    <TouchableOpacity onPress={() => router.replace('/(tabs)/home')} style={[styles.iconBtn, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}>
                        <ArrowLeft color={colors.text} size={22} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>E-TICKET</Text>
                    <TouchableOpacity style={[styles.iconBtn, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]} onPress={handleShare}>
                        <Share2 color={colors.text} size={22} />
                    </TouchableOpacity>
                </View>

                {/* Success Animation */}
                <View style={styles.successContainer}>
                    <View style={styles.successCircle}>
                        <Check color="#FFF" size={38} strokeWidth={3.5} />
                    </View>
                    <Text style={[styles.successTitle, { color: colors.text }]}>Booking Confirmed!</Text>
                    <Text style={[styles.successSubtitle, { color: colors.textSecondary }]}>Your seat is successfully reserved.</Text>
                </View>

                {/* Ticket Card */}
                <View style={[
                    styles.ticketCard, 
                    { 
                        backgroundColor: colors.surface, 
                        borderColor: colors.border,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: isDark ? 0.3 : 0.08,
                        shadowRadius: 12,
                        elevation: isDark ? 0 : 4,
                    }
                ]}>
                    {/* Movie Info */}
                    <View style={styles.cardHeader}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.label}>MOVIE</Text>
                            <Text style={[styles.movieTitle, { color: colors.text }]}>{movieTitle}</Text>
                            <View style={styles.badgeRow}>
                                {(() => {
                                    const genreTag = movieInfo?.genre ? movieInfo.genre.split(',')[0].trim().toUpperCase() : null;
                                    const durationTag = movieInfo?.duration_minutes ? `${movieInfo.duration_minutes} MIN` : null;
                                    const techTag = technology && technology !== 'Standard' && technology !== 'STANDARD' ? String(technology).toUpperCase() : null;
                                    const primaryTag = techTag || genreTag || durationTag;
                                    const langTag = (language || movieInfo?.language || 'English').toUpperCase();

                                    return (
                                        <>
                                            {primaryTag && (
                                                <View style={[styles.pillBadge, { backgroundColor: isDark ? 'rgba(138, 43, 226, 0.2)' : '#F3E8FF' }]}>
                                                    <Text style={[styles.pillBadgeText, { color: '#8A2BE2' }]}>{primaryTag}</Text>
                                                </View>
                                            )}
                                            <View style={[styles.pillBadge, { backgroundColor: isDark ? '#1F1F2E' : '#F3F4F6', marginLeft: primaryTag ? 8 : 0 }]}>
                                                <Text style={[styles.pillBadgeText, { color: colors.textSecondary }]}>{langTag}</Text>
                                            </View>
                                            {durationTag && primaryTag !== durationTag && (
                                                <View style={[styles.pillBadge, { backgroundColor: isDark ? '#1F1F2E' : '#F3F4F6', marginLeft: 8 }]}>
                                                    <Text style={[styles.pillBadgeText, { color: colors.textSecondary }]}>{durationTag}</Text>
                                                </View>
                                            )}
                                        </>
                                    );
                                })()}
                            </View>
                        </View>
                    </View>

                    <View style={[styles.divider, { backgroundColor: colors.border }]} />

                    {/* Details Grid */}
                    <View style={styles.detailsGrid}>
                        <View style={styles.detailItem}>
                            <Text style={styles.label}>DATE</Text>
                            <Text style={[styles.value, { color: colors.text }]}>{formattedDate}</Text>
                        </View>
                        <View style={styles.detailItem}>
                            <Text style={styles.label}>TIME</Text>
                            <Text style={[styles.value, { color: colors.text }]}>{showTime}</Text>
                        </View>
                        <View style={styles.detailItem}>
                            <Text style={styles.label}>THEATER</Text>
                            <Text style={[styles.value, { color: colors.text }]}>{theatreName} - {screenName}</Text>
                        </View>
                        <View style={styles.detailItem}>
                            <Text style={styles.label}>SEAT</Text>
                            <Text style={[styles.value, { color: isDark ? colors.text : '#000000', fontWeight: '800' }]}>{seatLabels}</Text>
                        </View>
                    </View>

                    {/* Dashed Separator with cutouts matching background */}
                    <View style={styles.dashedContainer}>
                        <View style={[styles.circle, { left: -36, backgroundColor: colors.background }]} />
                        <View style={[styles.dashedLine, { borderColor: colors.border }]} />
                        <View style={[styles.circle, { right: -36, backgroundColor: colors.background }]} />
                    </View>

                    {/* QR Code */}
                    <View style={styles.qrContainer}>
                        <View style={styles.qrWrapper}>
                            <QRCode
                                value={qrValue}
                                size={150}
                                color="#111827"
                                backgroundColor="#FFFFFF"
                            />
                        </View>
                        <Text style={[styles.scanText, { color: isDark ? colors.text : '#000000' }]}>SCAN AT ENTRANCE</Text>
                    </View>
                </View>

                {/* Actions */}
                <View style={styles.actions}>
                    <TouchableOpacity style={styles.reviewBtn} onPress={() => setShowReviewModal(true)}>
                        <Edit3 color="#FFF" size={20} style={{ marginRight: 8 }} />
                        <Text style={styles.btnText}>Write a Review</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={[
                            styles.downloadBtn, 
                            { 
                                backgroundColor: colors.surface, 
                                borderColor: colors.border,
                                borderWidth: 1 
                            }
                        ]} 
                        onPress={handleDownloadPDF}
                    >
                        <Download color={colors.text} size={20} style={{ marginRight: 8 }} />
                        <Text style={[styles.btnText, { color: colors.text }]}>Download PDF Ticket</Text>
                    </TouchableOpacity>

                    {!cancelled && (
                        <TouchableOpacity style={styles.cancelBtn} onPress={handleCancelTicket}>
                            <XCircle color="#EF4444" size={20} style={{ marginRight: 8 }} />
                            <Text style={styles.cancelBtnText}>Cancel Ticket</Text>
                        </TouchableOpacity>
                    )}
                    {cancelled && (
                        <View style={styles.cancelledBanner}>
                            <Text style={styles.cancelledText}>This ticket has been cancelled</Text>
                        </View>
                    )}
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>

            {/* Review Modal */}
            <Modal
                transparent={true}
                visible={showReviewModal}
                animationType="slide"
                onRequestClose={() => setShowReviewModal(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    style={styles.modalOverlay}
                >
                    <View style={[styles.modalContent, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, paddingBottom: insets.bottom + 16 }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: colors.text }]}>Rate {movieTitle}</Text>
                            <TouchableOpacity onPress={() => setShowReviewModal(false)}>
                                <X color={colors.textSecondary} size={24} />
                            </TouchableOpacity>
                        </View>

                        {reviewSuccess ? (
                            <View style={styles.successState}>
                                <Check color="#10B981" size={48} />
                                <Text style={[styles.successHeading, { color: colors.text }]}>Thank You!</Text>
                                <Text style={[styles.successSubtext, { color: colors.textSecondary }]}>Your review has been posted publicly.</Text>
                            </View>
                        ) : (
                            <View>
                                {/* Star Rating */}
                                <View style={styles.starsContainer}>
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <TouchableOpacity key={star} onPress={() => setRating(star)}>
                                            <Star
                                                size={40}
                                                color={star <= rating ? "#FACC15" : "#9CA3AF"}
                                                fill={star <= rating ? "#FACC15" : "transparent"}
                                                style={{ marginHorizontal: 4 }}
                                            />
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                {/* Comment */}
                                <TextInput
                                    style={[
                                        styles.reviewInput, 
                                        { 
                                            backgroundColor: colors.inputBg, 
                                            color: colors.text, 
                                            borderColor: colors.border 
                                        }
                                    ]}
                                    placeholder="What did you think of the movie? (Optional)"
                                    placeholderTextColor={colors.textMuted}
                                    multiline
                                    numberOfLines={4}
                                    value={comment}
                                    onChangeText={setComment}
                                />

                                <TouchableOpacity
                                    style={[styles.submitReviewBtn, submittingReview && { opacity: 0.7 }]}
                                    onPress={handleSubmitReview}
                                    disabled={submittingReview}
                                >
                                    <Text style={styles.btnText}>{submittingReview ? "Submitting..." : "Post Review"}</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0B0B15' },

    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: width * 0.05, marginBottom: 20 },
    iconBtn: { padding: 8, backgroundColor: '#1F1F2E', borderRadius: 20 },
    headerTitle: { color: '#FFF', fontSize: 16, fontWeight: 'bold', letterSpacing: 1 },

    successContainer: { alignItems: 'center', marginBottom: 28 },
    successCircle: { 
        width: 72, 
        height: 72, 
        borderRadius: 36, 
        backgroundColor: '#8A2BE2', 
        justifyContent: 'center', 
        alignItems: 'center', 
        marginBottom: 14,
        shadowColor: '#8A2BE2',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 10,
        elevation: 6
    },
    successTitle: { color: '#FFF', fontSize: 24, fontWeight: 'bold', marginBottom: 6 },
    successSubtitle: { color: '#9CA3AF', fontSize: 14 },

    ticketCard: { marginHorizontal: width * 0.05, backgroundColor: '#13131A', borderRadius: 24, padding: 24, borderWidth: 1, borderColor: '#1F1F2E' },

    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 },
    label: { color: '#8A2BE2', fontSize: 10, fontWeight: 'bold', marginBottom: 6, letterSpacing: 1.5, textTransform: 'uppercase' },
    movieTitle: { color: '#FFF', fontSize: 22, fontWeight: 'bold', marginBottom: 8, flexShrink: 1 },
    badgeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
    pillBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
    pillBadgeText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },

    divider: { height: 1, backgroundColor: '#1F1F2E', marginVertical: 18 },

    detailsGrid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 20 },
    detailItem: { width: '50%' },
    value: { color: '#FFF', fontSize: 15, fontWeight: '700', marginTop: 2 },

    dashedContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginVertical: 26, position: 'relative', marginHorizontal: -24 },
    circle: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#0B0B15', position: 'absolute', top: -18 },
    dashedLine: { flex: 1, height: 1, borderWidth: 1, borderColor: '#2D2D3F', borderStyle: 'dashed', marginHorizontal: 20 },

    qrContainer: { alignItems: 'center', paddingTop: 6 },
    qrWrapper: { 
        padding: 14, 
        borderRadius: 20, 
        marginBottom: 16, 
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },

    scanText: { color: '#000000', fontSize: 11, fontWeight: '800', letterSpacing: 2, marginBottom: 4 },

    actions: { marginHorizontal: width * 0.05, marginTop: 30, gap: 16 },
    reviewBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#8A2BE2', height: 56, borderRadius: 16 },
    downloadBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#13131A', height: 56, borderRadius: 16, borderWidth: 1, borderColor: '#2D2D3F' },
    cancelBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(239, 68, 68, 0.1)', height: 56, borderRadius: 16, borderWidth: 1, borderColor: '#EF4444' },
    cancelBtnText: { color: '#EF4444', fontSize: 16, fontWeight: 'bold' },
    cancelledBanner: { alignItems: 'center', justifyContent: 'center', height: 56, borderRadius: 16, backgroundColor: 'rgba(239, 68, 68, 0.05)', borderWidth: 1, borderColor: '#991B1B' },
    cancelledText: { color: '#EF4444', fontSize: 14, fontWeight: '600' },
    btnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#13131A', borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingHorizontal: width * 0.08, paddingTop: 20 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    modalTitle: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
    starsContainer: { flexDirection: 'row', justifyContent: 'center', marginBottom: 16 },
    reviewInput: { backgroundColor: '#1F1F2E', borderRadius: 16, padding: 18, paddingTop: 18, color: '#FFF', fontSize: 16, minHeight: 140, textAlignVertical: 'top', marginBottom: 10, borderWidth: 1, borderColor: '#2D2D3F' },
    submitReviewBtn: { backgroundColor: '#8A2BE2', height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
    successState: { alignItems: 'center', paddingVertical: 40 },
    successHeading: { color: '#FFF', fontSize: 24, fontWeight: 'bold', marginTop: 16, marginBottom: 8 },
    successSubtext: { color: '#9CA3AF', fontSize: 16, textAlign: 'center' }
});
