import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, ActivityIndicator, Image, Dimensions } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Search as SearchIcon, Star, ChevronRight, X } from 'lucide-react-native';
import * as SecureStore from 'expo-secure-store';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { endpoints } from '../../config/api';
import { useTheme } from '../../context/ThemeContext';

const { width } = Dimensions.get('window');

export default function SearchScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [query, setQuery] = useState('');
    const [movies, setMovies] = useState<any[]>([]);
    const [filteredMovies, setFilteredMovies] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { colors, isDark } = useTheme();

    useFocusEffect(
        useCallback(() => {
            fetchMovies();
        }, [])
    );

    const fetchMovies = async () => {
        try {
            setLoading(true);
            const token = await SecureStore.getItemAsync('token');
            const headers: HeadersInit = token ? { 'Authorization': `Bearer ${token}` } : {};

            // Get Location
            const loc = await SecureStore.getItemAsync('user_location');
            const cityParam = loc && loc !== 'Select Location' ? loc : '';

            // Get Movies with city filter
            const url = cityParam ? `${endpoints.movies}?city=${encodeURIComponent(cityParam)}` : endpoints.movies;

            const response = await fetch(url, { headers });
            const data = await response.json();
            if (Array.isArray(data)) {
                setMovies(data);
                setFilteredMovies(data);
            }
        } catch (error) {
            console.error("Search fetch error", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        filterMovies();
    }, [query, movies]);

    const filterMovies = () => {
        let result = movies;
        if (query.trim()) {
            result = result.filter(m => m.title.toLowerCase().includes(query.toLowerCase()));
        }
        setFilteredMovies(result);
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar style={isDark ? 'light' : 'dark'} />

            {loading ? (
                <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
                    <ActivityIndicator size="large" color="#8A2BE2" />
                </View>
            ) : (
                <ScrollView 
                    showsVerticalScrollIndicator={false} 
                    contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 10 }]}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Search Title & Search Bar move seamlessly with results */}
                    <View style={styles.header}>
                        <Text style={[styles.headerTitle, { color: colors.text }]}>Search Movies</Text>
                    </View>

                    <View style={[styles.searchContainer, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                        <SearchIcon color="#8A2BE2" size={18} />
                        <TextInput
                            style={[styles.searchInput, { color: colors.text }]}
                            placeholder="Search movies, genre..."
                            placeholderTextColor={colors.textMuted}
                            value={query}
                            onChangeText={setQuery}
                            autoCapitalize="none"
                            clearButtonMode="while-editing"
                        />
                        {query.length > 0 && (
                            <TouchableOpacity onPress={() => setQuery('')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                                <X color={colors.textSecondary} size={16} />
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Results list flowing directly under search bar, scrolling together */}
                    <View style={styles.resultsList}>
                        {filteredMovies.map(movie => (
                            <TouchableOpacity 
                                key={movie.id} 
                                style={[styles.movieRow, { borderBottomColor: colors.border }]}
                                onPress={() => router.push(`/movie/${movie.id}`)}
                                activeOpacity={0.7}
                            >
                                {/* Left Poster Thumbnail */}
                                <Image
                                    source={{ uri: movie.poster_url || 'https://via.placeholder.com/150' }}
                                    style={styles.poster}
                                    resizeMode="cover"
                                />

                                {/* Middle Details */}
                                <View style={styles.info}>
                                    <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
                                        {movie.title}
                                    </Text>

                                    <Text style={[styles.genre, { color: colors.textSecondary }]} numberOfLines={1}>
                                        {movie.genre || 'Action'} • {Math.floor((movie.duration_minutes || 120) / 60)}h {(movie.duration_minutes || 120) % 60}m
                                    </Text>

                                    <View style={styles.ratingRow}>
                                        <Star color="#FACC15" size={13} fill="#FACC14" />
                                        <Text style={[styles.ratingText, { color: colors.text }]}>
                                            {movie.rating ? movie.rating.toFixed(1) : "0.0"}
                                        </Text>
                                        {movie.available_technologies && movie.available_technologies.length > 0 && (
                                            <Text style={[styles.techPill, { color: '#8A2BE2' }]}>
                                                • {movie.available_technologies[0]}
                                            </Text>
                                        )}
                                    </View>
                                </View>

                                {/* Right Arrow */}
                                <ChevronRight color={colors.textSecondary} size={18} />
                            </TouchableOpacity>
                        ))}

                        {filteredMovies.length === 0 && !loading && (
                            <View style={styles.emptyContainer}>
                                <SearchIcon color={colors.textMuted} size={40} />
                                <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                                    No movies found matching "{query}"
                                </Text>
                            </View>
                        )}
                    </View>
                </ScrollView>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    scrollContent: {
        paddingBottom: 120,
    },

    header: { 
        paddingHorizontal: 20, 
        marginBottom: 12 
    },
    headerTitle: { 
        fontSize: 24, 
        fontWeight: 'bold', 
        letterSpacing: -0.3 
    },

    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 14,
        paddingHorizontal: 14,
        height: 48,
        marginHorizontal: 20,
        marginBottom: 16,
        borderWidth: 1,
    },
    searchInput: { 
        flex: 1, 
        fontSize: 15, 
        marginLeft: 10,
        paddingVertical: 0,
    },

    resultsList: { 
        paddingHorizontal: 20, 
        paddingBottom: 100 
    },

    // Clean, streamlined list row without bulky card boxes
    movieRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    poster: { 
        width: 58, 
        height: 80, 
        borderRadius: 8,
        backgroundColor: '#E5E7EB',
    },
    info: { 
        flex: 1, 
        marginLeft: 14, 
        justifyContent: 'center' 
    },
    title: { 
        fontSize: 16, 
        fontWeight: '700', 
        marginBottom: 4 
    },
    genre: { 
        fontSize: 13, 
        marginBottom: 6 
    },
    ratingRow: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        gap: 4 
    },
    ratingText: { 
        fontSize: 13, 
        fontWeight: '600' 
    },
    techPill: {
        fontSize: 11,
        fontWeight: '600',
        marginLeft: 4,
    },

    emptyContainer: { 
        alignItems: 'center', 
        justifyContent: 'center', 
        marginTop: 60,
        gap: 12,
    },
    emptyText: { 
        fontSize: 14,
        textAlign: 'center',
    },
});
