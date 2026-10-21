import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ChevronLeft, Star } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import { endpoints } from '../config/api';
import { useTheme } from '../context/ThemeContext';

interface ReviewItem {
    id: number;
    movie_id: number;
    movie_title: string;
    poster_url: string;
    rating: number;
    comment: string | null;
    created_at: string;
}

export default function MyReviewsScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { colors, isDark } = useTheme();
    const [reviews, setReviews] = useState<ReviewItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchMyReviews();
    }, []);

    const fetchMyReviews = async () => {
        try {
            const token = await SecureStore.getItemAsync('token');
            if (!token) return;

            const response = await fetch(endpoints.myReviews, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setReviews(data);
            }
        } catch (error) {
            console.error('Failed to fetch reviews', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchMyReviews();
    };

    const renderStars = (rating: number) => {
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            stars.push(
                <Star
                    key={i}
                    size={14}
                    color="#FACC15"
                    fill={i <= rating ? '#FACC15' : 'transparent'}
                />
            );
        }
        return stars;
    };

    const renderItem = ({ item }: { item: ReviewItem }) => (
        <TouchableOpacity
            style={[
                styles.reviewCard,
                {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    borderWidth: 1,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: isDark ? 0 : 0.05,
                    shadowRadius: 3,
                    elevation: isDark ? 0 : 1,
                }
            ]}
            onPress={() => router.push(`/movie/${item.movie_id}`)}
            activeOpacity={0.7}
        >
            <Image
                source={{ uri: item.poster_url || 'https://via.placeholder.com/100' }}
                style={styles.poster}
            />
            <View style={styles.reviewContent}>
                <Text style={[styles.movieTitle, { color: colors.text }]} numberOfLines={1}>{item.movie_title}</Text>
                <View style={styles.starsRow}>
                    {renderStars(item.rating)}
                    <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
                </View>
                {item.comment ? (
                    <Text style={[styles.comment, { color: colors.textSecondary }]} numberOfLines={2}>{item.comment}</Text>
                ) : (
                    <Text style={[styles.noComment, { color: colors.textMuted }]}>No comment</Text>
                )}
                <Text style={[styles.date, { color: colors.textMuted }]}>
                    {item.created_at ? new Date(item.created_at).toLocaleDateString('en-US', {
                        year: 'numeric', month: 'short', day: 'numeric'
                    }) : ''}
                </Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top + 8 }]}>
            <StatusBar style={isDark ? 'light' : 'dark'} />
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ChevronLeft color={colors.text} size={28} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>My Reviews</Text>
                <View style={{ width: 40 }} />
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator color="#8A2BE2" size="large" />
                </View>
            ) : reviews.length > 0 ? (
                <FlatList
                    showsVerticalScrollIndicator={false}
                    data={reviews}
                    renderItem={renderItem}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={styles.list}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8A2BE2" />
                    }
                />
            ) : (
                <View style={styles.center}>
                    <View style={styles.emptyIcon}>
                        <Star color="#3F3F46" size={64} />
                    </View>
                    <Text style={styles.emptyTitle}>No Reviews Yet</Text>
                    <Text style={styles.emptySubtitle}>
                        After watching a movie, come back to share your experience!
                    </Text>
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
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#1F1F2E',
    },
    backButton: { width: 40, height: 40, justifyContent: 'center' },
    headerTitle: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
    list: { padding: 16 },
    reviewCard: {
        flexDirection: 'row',
        backgroundColor: '#13131A',
        borderRadius: 16,
        padding: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#1F1F2E',
    },
    poster: {
        width: 70,
        height: 100,
        borderRadius: 12,
        marginRight: 14,
    },
    reviewContent: {
        flex: 1,
        justifyContent: 'center',
    },
    movieTitle: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 6,
    },
    starsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 6,
    },
    ratingText: {
        color: '#FACC15',
        fontSize: 12,
        fontWeight: 'bold',
        marginLeft: 4,
    },
    comment: {
        color: '#9CA3AF',
        fontSize: 13,
        lineHeight: 18,
        marginBottom: 4,
    },
    noComment: {
        color: '#6B7280',
        fontSize: 13,
        fontStyle: 'italic',
        marginBottom: 4,
    },
    date: {
        color: '#6B7280',
        fontSize: 11,
    },
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
