import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ImageBackground, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions, Alert, Modal, Share } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import * as SecureStore from 'expo-secure-store';
import { ArrowLeft, Share2, Star, MapPin, X, ChevronRight } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { endpoints } from '../../config/api';
import { useTheme } from '../../context/ThemeContext';

const { width } = Dimensions.get('window');

export default function MovieDetailsScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { colors, isDark } = useTheme();
    const [movie, setMovie] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [interested, setInterested] = useState(false);
    const [availableTheatres, setAvailableTheatres] = useState<any[]>([]);
    const [reviews, setReviews] = useState<any[]>([]);
    const [showLanguageModal, setShowLanguageModal] = useState(false);
    const [selectedLanguage, setSelectedLanguage] = useState('');

    useEffect(() => {
        if (id) {
            fetchMovieDetails();
            fetchAvailableTheatres();
            fetchReviews();
        }
        checkInterest();
    }, [id]);

    const fetchReviews = async () => {
        try {
            const response = await fetch(`${endpoints.movies}/${id}/reviews`);
            if (response.ok) {
                const data = await response.json();
                setReviews(data);
            }
        } catch (error) {
            console.error("Failed to fetch reviews", error);
        }
    };

    const fetchAvailableTheatres = async () => {
        try {
            const response = await fetch(`${endpoints.shows}/movie/${id}`);
            if (response.ok) {
                const data = await response.json();
                setAvailableTheatres(data);
            }
        } catch (e) {
            console.log('Failed to fetch theatres', e);
        }
    };

    const checkInterest = async () => {
        try {
            const stored = await SecureStore.getItemAsync(`interest_${id}`);
            if (stored === 'true') setInterested(true);
        } catch (e) {
            console.log("Error checking interest", e);
        }
    };

    const fetchMovieDetails = async () => {
        try {
            const response = await fetch(`${endpoints.movies}/${id}`);
            const data = await response.json();
            setMovie(data);
        } catch (error) {
            console.error("Failed to fetch movie details", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
                <StatusBar style={isDark ? 'light' : 'dark'} />
                <ActivityIndicator size="large" color="#8A2BE2" />
            </View>
        );
    }

    if (!movie) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
                <StatusBar style={isDark ? 'light' : 'dark'} />
                <Text style={{ color: colors.text }}>Movie not found</Text>
            </View>
        );
    }

    // Check if movie is upcoming (safe check)
    const isUpcoming = movie?.status === 'COMING_SOON';

    // Handle Cast string -> Array (using cast_members from backend)
    const castList = movie.cast_members ? movie.cast_members.split(',').map((c: string) => c.trim()) : [];

    const handleInterest = async () => {
        if (interested) return;

        Alert.alert("Interest Registered", `We will notify you when tickets for ${movie.title} open!`);
        setInterested(true);
        await SecureStore.setItemAsync(`interest_${id}`, 'true');
    };

    const handleShare = async () => {
        try {
            await Share.share({
                message: `Check out "${movie?.title}" on ShowGo! 🎬🍿`,
            });
        } catch (error) {
            console.error('Error sharing', error);
        }
    };

    const handleSelectShowtimes = (cinemaName?: string) => {
        const langs = (movie.languages || '').split(',').map((l: string) => l.trim()).filter(Boolean);
        if (langs.length > 1) {
            setShowLanguageModal(true);
        } else {
            router.push({
                pathname: `/movie/${id}/select-cinema`,
                params: {
                    title: movie.title,
                    language: langs[0] || movie.language || 'English',
                    poster: movie.poster_url,
                    cinema: cinemaName || undefined,
                }
            });
        }
    };

    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            <StatusBar style="light" />
            <ScrollView showsVerticalScrollIndicator={false} style={[styles.container, { backgroundColor: colors.background }]} bounces={false} contentContainerStyle={{ paddingBottom: 60 }}>

                {/* Poster / Header */}
                <ImageBackground
                    source={{ uri: movie.poster_url }}
                    style={styles.posterImage}
                    resizeMode="cover"
                >
                    <LinearGradient
                        colors={['transparent', colors.background]}
                        style={styles.gradient}
                    />

                    {/* Header Actions - only Back and Share, no toggle here */}
                    <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
                            <ArrowLeft color="#FFF" size={24} />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.iconBtn} onPress={handleShare}>
                            <Share2 color="#FFF" size={22} />
                        </TouchableOpacity>
                    </View>
                </ImageBackground>

                {/* Content */}
                <View style={styles.content}>
                    <Text style={[styles.title, { color: colors.text }]}>{movie.title}</Text>

                    <View style={styles.tagRow}>
                        <View style={styles.tag}><Text style={styles.tagText}>{movie.genre?.split(',')[0] || 'GENRE'}</Text></View>
                        <View style={[styles.timeTag, { backgroundColor: isDark ? '#1F1F2E' : '#F3E8FF' }]}>
                            <Text style={[styles.timeText, { color: isDark ? '#9CA3AF' : '#8A2BE2' }]}>⏱ {Math.floor(movie.duration_minutes / 60)}h {movie.duration_minutes % 60}m</Text>
                        </View>
                        <View style={[styles.ratingTag, { backgroundColor: isDark ? '#1F1F2E' : '#FEF9C3' }]}>
                            <Star fill="#FACC15" color="#FACC15" size={14} />
                            <Text style={[styles.ratingText, { color: isDark ? '#FFF' : '#854D0E' }]}>{movie.rating ? movie.rating.toFixed(1) : "0.0"}</Text>
                        </View>
                    </View>

                    <Text style={[styles.sectionTitle, { color: isDark ? '#9CA3AF' : '#8A2BE2' }]}>SYNOPSIS</Text>
                    <Text style={[styles.synopsis, { color: isDark ? '#D1D5DB' : '#374151' }]}>{movie.description || "No description available."}</Text>

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, marginBottom: 16 }}>
                        <Text style={[styles.sectionTitleWithoutMargin, { color: isDark ? '#9CA3AF' : '#8A2BE2' }]}>TOP CAST</Text>
                        <TouchableOpacity><Text style={styles.seeAll}>SEE ALL</Text></TouchableOpacity>
                    </View>

                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.castList}>
                        {castList.length > 0 ? castList.map((actor: string, index: number) => (
                            <View key={index} style={styles.castItem}>
                                <View style={[styles.castAvatar, { backgroundColor: isDark ? '#1F1F2E' : '#F3E8FF', borderColor: isDark ? '#2D2D3F' : '#E9D5FF' }]}>
                                    <Text style={{ color: isDark ? '#FFF' : '#8A2BE2', fontSize: 20, fontWeight: 'bold' }}>{actor.charAt(0)}</Text>
                                </View>
                                <Text style={[styles.castName, { color: colors.text }]} numberOfLines={2}>{actor}</Text>
                            </View>
                        )) : (
                            <Text style={{ color: colors.textSecondary }}>Cast info unavailable</Text>
                        )}
                    </ScrollView>

                    {/* Select Showtimes Button directly after TOP CAST */}
                    {!isUpcoming ? (
                        <TouchableOpacity
                            style={[styles.bookButton, { marginTop: 8, marginBottom: 24 }]}
                            onPress={() => handleSelectShowtimes()}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.bookButtonText}>SELECT SHOWTIMES</Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity
                            style={[
                                styles.bookButton,
                                {
                                    marginTop: 8,
                                    marginBottom: 24,
                                    backgroundColor: interested ? '#10B981' : '#8A2BE2'
                                }
                            ]}
                            onPress={handleInterest}
                            activeOpacity={interested ? 1 : 0.7}
                        >
                            <Text style={styles.bookButtonText}>
                                {interested ? "INTEREST REGISTERED" : "I'M INTERESTED"}
                            </Text>
                        </TouchableOpacity>
                    )}

                    {/* Appended Real User Reviews Section */}
                    <View style={{ marginTop: 24, marginBottom: 16 }}>
                        <Text style={[styles.sectionTitleWithoutMargin, { color: isDark ? '#9CA3AF' : '#8A2BE2' }]}>USER REVIEWS</Text>

                        {reviews.length > 0 ? (
                            reviews.map((r, i) => (
                                <View key={i} style={[styles.reviewCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                                    <View style={styles.reviewHeader}>
                                        <View style={styles.reviewUser}>
                                            <View style={[styles.smallAvatar, { backgroundColor: isDark ? '#2D2D3F' : '#F3E8FF' }]}>
                                                <Text style={{ color: isDark ? '#FFF' : '#8A2BE2', fontSize: 12, fontWeight: 'bold' }}>{r.user_name?.charAt(0) || 'A'}</Text>
                                            </View>
                                            <Text style={[styles.reviewName, { color: colors.text }]}>{r.user_name || 'Anonymous'}</Text>
                                        </View>
                                        <View style={[styles.reviewStars, { backgroundColor: isDark ? '#1F1F2E' : '#FEF9C3' }]}>
                                            <Star fill="#FACC15" color="#FACC15" size={14} />
                                            <Text style={[styles.reviewRatingText, { color: isDark ? '#FACC15' : '#854D0E' }]}>{r.rating.toFixed(1)}</Text>
                                        </View>
                                    </View>
                                    {r.comment && (
                                        <Text style={[styles.reviewComment, { color: isDark ? '#D1D5DB' : '#4B5563' }]}>{r.comment}</Text>
                                    )}
                                </View>
                            ))
                        ) : (
                            <Text style={{ marginTop: 12, color: colors.textSecondary, fontStyle: 'italic', fontSize: 14 }}>
                                No reviews yet. Be the first to write a review!
                            </Text>
                        )}
                    </View>

                </View>
            </ScrollView>

            {/* Language Selection Modal */}
            <Modal
                visible={showLanguageModal}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowLanguageModal(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowLanguageModal(false)}
                >
                    <View style={[styles.modalContent, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: colors.text }]}>Select Language</Text>
                            <TouchableOpacity onPress={() => setShowLanguageModal(false)}>
                                <X color={colors.textSecondary} size={24} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.languageList}>
                            {(movie.languages || 'English').split(',').map((lang: string) => {
                                const trimmed = lang.trim();
                                const isSelected = selectedLanguage === trimmed;
                                return (
                                    <TouchableOpacity
                                        key={trimmed}
                                        style={[styles.languageItem, { borderBottomColor: colors.border }]}
                                        onPress={() => {
                                            setSelectedLanguage(trimmed);
                                            setTimeout(() => {
                                                setShowLanguageModal(false);
                                                router.push({
                                                    pathname: `/movie/${id}/select-cinema`,
                                                    params: {
                                                        title: movie.title,
                                                        language: trimmed,
                                                        poster: movie.poster_url
                                                    }
                                                });
                                            }, 200);
                                        }}
                                        activeOpacity={0.7}
                                    >
                                        <Text style={[styles.languageText, { color: colors.text }]}>{trimmed}</Text>
                                        <View style={[styles.radioOuter, { borderColor: isSelected ? '#8A2BE2' : (isDark ? '#4B5563' : '#CBD5E1') }]}>
                                            {isSelected && <View style={styles.radioInner} />}
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>
                </TouchableOpacity>
            </Modal>

        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    posterImage: { width: width, height: 450, justifyContent: 'space-between' },
    gradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 300 },

    header: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: width * 0.05 },
    iconBtn: { padding: 10, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 50 },

    playBtnContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginBottom: 40 },
    playBtn: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(138, 43, 226, 0.8)', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)' },

    content: { paddingHorizontal: width * 0.05, marginTop: -40 },
    title: { color: '#FFF', fontSize: 32, fontWeight: 'bold', textAlign: 'center', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1 },

    tagRow: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 30 },
    tag: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#8A2BE2', backgroundColor: 'rgba(138, 43, 226, 0.1)' },
    tagText: { color: '#8A2BE2', fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase' },
    timeTag: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1F1F2E', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
    timeText: { color: '#9CA3AF', fontSize: 12, fontWeight: '600' },
    ratingTag: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1F1F2E', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 4 },
    ratingText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },

    sectionTitle: { color: '#9CA3AF', fontSize: 12, fontWeight: 'bold', marginBottom: 12, letterSpacing: 1.5 },
    sectionTitleWithoutMargin: { color: '#9CA3AF', fontSize: 12, fontWeight: 'bold', letterSpacing: 1.5 },
    synopsis: { color: '#D1D5DB', fontSize: 15, lineHeight: 24, fontWeight: '400', marginBottom: 24 },

    seeAll: { color: '#8A2BE2', fontSize: 12, fontWeight: 'bold', letterSpacing: 1 },

    castList: { marginBottom: 30 },
    castItem: { alignItems: 'center', marginRight: 20, width: 70 },
    castAvatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#1F1F2E', justifyContent: 'center', alignItems: 'center', marginBottom: 8, borderWidth: 1, borderColor: '#2D2D3F' },
    castName: { color: '#FFF', fontSize: 11, textAlign: 'center', fontWeight: '500' },

    theaterCard: { backgroundColor: '#13131A', padding: 20, borderRadius: 24, borderWidth: 1, borderColor: '#2D2D3F', borderStyle: 'dashed' },
    cardLabel: { color: '#6B7280', fontSize: 11, fontWeight: 'bold', marginBottom: 8, letterSpacing: 1 },
    theaterName: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
    cinemaRowItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 12,
        borderWidth: 1,
    },

    bottomBar: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        backgroundColor: '#0B0B15', paddingHorizontal: width * 0.05,
        paddingTop: 20, paddingBottom: 50, // Increased bottom padding for navigation bar
        borderTopWidth: 1, borderTopColor: '#1F1F2E'
    },
    bookButton: {
        backgroundColor: '#8A2BE2', height: 56, borderRadius: 16,
        justifyContent: 'center', alignItems: 'center',
        shadowColor: '#8A2BE2', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 8
    },
    bookButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold', letterSpacing: 1 },

    reviewCard: { backgroundColor: '#13131A', borderRadius: 16, padding: 16, marginTop: 12, borderWidth: 1, borderColor: '#1F1F2E' },
    reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    reviewUser: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    smallAvatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#2D2D3F', justifyContent: 'center', alignItems: 'center' },
    reviewName: { color: '#FFF', fontSize: 14, fontWeight: '600' },
    reviewStars: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#1F1F2E', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
    reviewRatingText: { color: '#FACC15', fontSize: 12, fontWeight: 'bold' },
    reviewComment: { color: '#D1D5DB', fontSize: 13, lineHeight: 20 },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#13131A', borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingHorizontal: width * 0.08, paddingTop: 32, paddingBottom: 40 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    modalTitle: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
    languageList: { gap: 16 },
    languageItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#1F1F2E' },
    languageText: { color: '#FFF', fontSize: 18, fontWeight: '600' },
    radioOuter: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#8A2BE2', justifyContent: 'center', alignItems: 'center' },
    radioInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#8A2BE2' },
});
