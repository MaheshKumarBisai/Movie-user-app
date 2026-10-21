import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions, Alert, BackHandler, ToastAndroid, Platform } from 'react-native';
import { Image } from 'expo-image';
import { useRouter, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { MapPin, Bell, Star } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as SecureStore from 'expo-secure-store';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { endpoints } from '../../config/api';
import { useTheme } from '../../context/ThemeContext';
import { getCityLandmarkIcon } from '../../components/LandmarkIcons';

const { width } = Dimensions.get('window');

interface Movie {
    id: number;
    title: string;
    genre: string;
    language: string;
    rating: number;
    duration_minutes: number;
    poster_url: string;
    release_date?: string;
    cast_members?: string;
    trailer_url?: string;
    status?: string;
}

export default function HomeScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [location, setLocation] = useState<string>('Select Location');
    const [movies, setMovies] = useState<Movie[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastBackPressed, setLastBackPressed] = useState(0);
    const [unreadCount, setUnreadCount] = useState(0);
    const { colors, isDark } = useTheme();

    const onBackPress = useCallback(() => {
        const currentTime = Date.now();
        if (currentTime - lastBackPressed < 2000) {
            BackHandler.exitApp();
            return true;
        }
        setLastBackPressed(currentTime);
        if (Platform.OS === 'android') {
            ToastAndroid.show('Press back again to exit', ToastAndroid.SHORT);
        }
        return true;
    }, [lastBackPressed]);

    const fetchUnreadCount = async () => {
        try {
            const token = await SecureStore.getItemAsync('token');
            if (!token) return;
            const response = await fetch(`${endpoints.notifications}/unread-count`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            setUnreadCount(data.count || 0);
        } catch (error) {
            console.error("Failed to fetch unread count", error);
        }
    };

    const loadData = async (showLoader = true) => {
        try {
            if (showLoader) setLoading(true);
            const loc = await SecureStore.getItemAsync('user_location');
            const cityParam = loc && loc !== 'Select Location' ? loc : '';
            if (loc) setLocation(loc);

            const token = await SecureStore.getItemAsync('token');
            const headers: HeadersInit = token ? { 'Authorization': `Bearer ${token}` } : {};

            const url = cityParam ? `${endpoints.movies}?city=${encodeURIComponent(cityParam)}` : endpoints.movies;
            const response = await fetch(url, { headers });
            const data = await response.json();
            if (Array.isArray(data)) setMovies(data);

        } catch (error) {
            console.error("Failed to load home data", error);
        } finally {
            if (showLoader) setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);
            
            // Initial load on focus
            loadData(false);
            fetchUnreadCount();

            // Refresh data periodically only while focused
            const interval = setInterval(() => {
                loadData(false);
                fetchUnreadCount();
            }, 30000); // 30 seconds

            return () => {
                backHandler.remove();
                clearInterval(interval);
            };
        }, [onBackPress])
    );

    useEffect(() => {
        loadData(true);
    }, []);



    const renderMovieCard = (movie: Movie) => (
        <TouchableOpacity 
            key={movie.id} 
            style={[
                styles.movieCard, 
                { 
                    backgroundColor: colors.surface, 
                    borderColor: colors.border, 
                    borderWidth: isDark ? 0 : 1,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: isDark ? 0 : 0.08,
                    shadowRadius: 4,
                    elevation: isDark ? 0 : 2,
                }
            ]} 
            onPress={() => router.push(`/movie/${movie.id}`)}
        >
            <Image 
                source={{ uri: movie.poster_url || 'https://via.placeholder.com/150' }} 
                style={styles.poster} 
                contentFit="cover" 
                transition={200}
                cachePolicy="memory-disk"
            />
            <LinearGradient colors={['transparent', isDark ? 'rgba(0,0,0,0.9)' : 'rgba(0,0,0,0.75)']} style={styles.gradient} />
            <View style={styles.movieInfo}>
                <Text style={styles.movieTitle} numberOfLines={1}>{movie.title}</Text>
                <View style={styles.ratingContainer}>
                    <Star color="#FACC15" size={14} fill="#FACC15" />
                    <Text style={styles.ratingText}>{movie.rating ? movie.rating.toFixed(1) : "0.0"}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    const renderVerticalMovieItem = (movie: Movie) => (
        <TouchableOpacity key={movie.id} onPress={() => router.push(`/movie/${movie.id}`)}>
            <View style={[
                styles.verticalCard,
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
            ]}>
                <Image
                    source={{ uri: movie.poster_url || 'https://via.placeholder.com/150' }}
                    style={styles.verticalPoster}
                    contentFit="cover"
                    transition={200}
                    cachePolicy="memory-disk"
                />
                <View style={styles.verticalInfo}>
                    <Text style={[styles.verticalTitle, { color: colors.text }]}>{movie.title}</Text>
                    <View style={styles.ratingContainer}>
                        <Text style={styles.ratingText}>★ {movie.rating ? movie.rating.toFixed(1) : "0.0"}</Text>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );

    if (loading) return <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}><ActivityIndicator color="#8A2BE2" /></View>;

    // Filter movies based on backend status
    const nowShowing = movies.filter(m => m.status === 'ACTIVE' || !m.status);
    const comingSoon = movies.filter(m => m.status === 'COMING_SOON');

    return (
        <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top + 10 }]}>
            <StatusBar style={isDark ? 'light' : 'dark'} />

            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={[styles.greeting, { color: colors.textSecondary }]}>Welcome Back 👋</Text>
                    <TouchableOpacity style={styles.locationButton} onPress={() => router.push('/location')}>
                        <MapPin color="#8A2BE2" size={16} />
                        <Text style={[styles.locationText, { color: colors.text }]}>{location}</Text>
                        {location !== 'Select Location' && (
                            <View style={{ marginLeft: 6 }}>
                                {getCityLandmarkIcon(location, 16, '#8A2BE2')}
                            </View>
                        )}
                    </TouchableOpacity>
                </View>
                <View style={styles.headerActions}>
                    <TouchableOpacity 
                        style={[
                            styles.iconButton,
                            {
                                backgroundColor: colors.surface,
                                borderColor: colors.border,
                                borderWidth: 1,
                            }
                        ]} 
                        onPress={() => router.push('/notifications')}
                    >
                        <View>
                            <Bell color={colors.text} size={22} />
                            {unreadCount > 0 && <View style={styles.notificationBadge} />}
                        </View>
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

                {/* Now Showing Section */}
                <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Now Showing</Text>
                </View>

                {nowShowing.length > 0 ? (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                        {nowShowing.map(renderMovieCard)}
                    </ScrollView>
                ) : (
                    <Text style={{ color: colors.textMuted, marginLeft: 20 }}>No movies showing currently.</Text>
                )}

                {/* Coming Soon Section */}
                <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Coming Soon</Text>
                </View>

                <View style={styles.verticalList}>
                    {comingSoon.length > 0 ? (
                        comingSoon.map(renderVerticalMovieItem)
                    ) : (
                        <Text style={{ color: colors.textMuted }}>No upcoming movies.</Text>
                    )}
                </View>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0B0B15' },
    loadingContainer: { flex: 1, backgroundColor: '#0B0B15', justifyContent: 'center', alignItems: 'center' },

    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: width * 0.05, marginBottom: 20 },
    headerActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    greeting: { color: '#9CA3AF', fontSize: 14, marginBottom: 4 },
    locationButton: { flexDirection: 'row', alignItems: 'center' },
    locationText: { color: '#FFF', fontSize: 16, fontWeight: 'bold', marginLeft: 6 },
    iconButton: { width: 44, height: 44, backgroundColor: '#1F1F2E', borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    notificationBadge: {
        position: 'absolute',
        top: -2,
        right: -2,
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#EF4444',
        borderWidth: 2,
        borderColor: '#1F1F2E',
    },

    scrollContent: { paddingBottom: 100 },

    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: width * 0.05, marginBottom: 16, marginTop: 10 },
    sectionTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
    seeAll: { color: '#8A2BE2', fontSize: 14 },

    horizontalScroll: { paddingLeft: width * 0.05, marginBottom: 20 },

    movieCard: { width: width * 0.4, height: 240, marginRight: 16, borderRadius: 16, overflow: 'hidden', backgroundColor: '#1F1F2E' },
    poster: { width: '100%', height: '100%' },
    gradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%' },
    movieInfo: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 12 },
    movieTitle: { color: '#FFF', fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
    movieGenre: { color: '#9CA3AF', fontSize: 12, marginBottom: 6 },
    ratingContainer: { flexDirection: 'row', alignItems: 'center' },
    ratingText: { color: '#FACC15', fontSize: 12, fontWeight: 'bold', marginLeft: 4 },

    verticalList: { paddingHorizontal: width * 0.05, paddingBottom: 20 },

    // Missing Vertical Styles
    verticalCard: { flexDirection: 'row', marginBottom: 16, backgroundColor: '#1F1F2E', borderRadius: 16, overflow: 'hidden', padding: 10 },
    verticalPoster: { width: 80, height: 100, borderRadius: 8 },
    verticalInfo: { flex: 1, marginLeft: 16, justifyContent: 'center' },
    verticalTitle: { color: '#FFF', fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
    verticalGenre: { color: '#9CA3AF', fontSize: 13, marginBottom: 8 },
});
