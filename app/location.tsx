import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Search, Navigation, ChevronRight, ArrowLeft } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as SecureStore from 'expo-secure-store';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { endpoints } from '../config/api';
import { useTheme } from '../context/ThemeContext';
import { getCityLandmarkIcon } from '../components/LandmarkIcons';

// Famous cities with dedicated landmark icons
const FAMOUS_CITIES = [
    'Hyderabad',
    'Visakhapatnam',
    'Vijayawada',
    'Bangalore',
    'Mumbai',
    'Chennai',
    'Delhi',
    'Kolkata',
];

// Comprehensive list of other cities (AP, Telangana, and major hubs)
const ALL_OTHER_CITIES = [
    'Anantapur',
    'Bhimavaram',
    'Chittoor',
    'Coimbatore',
    'Dharmavaram',
    'Eluru',
    'Gudivada',
    'Guntakal',
    'Guntur',
    'Hindupur',
    'Kadapa',
    'Kakinada',
    'Karimnagar',
    'Khammam',
    'Kochi',
    'Kurnool',
    'Machilipatnam',
    'Madanapalle',
    'Mangalagiri',
    'Narasaraopet',
    'Nellore',
    'Nizamabad',
    'Ongole',
    'Proddatur',
    'Pune',
    'Rajahmundry',
    'Srikakulam',
    'Tadipatri',
    'Tenali',
    'Tirupati',
    'Vizianagaram',
    'Warangal',
];

// Helper to normalize city names (deduplicate variations like "Bangalore" vs "Banglore")
const normalizeCityName = (city: string): string => {
    const trimmed = city.trim();
    const lower = trimmed.toLowerCase();
    if (lower === 'banglore' || lower === 'bangalore' || lower === 'bengaluru') return 'Bangalore';
    if (lower === 'vizag' || lower === 'visakhapatnam') return 'Visakhapatnam';
    if (lower === 'secunderabad' || lower === 'hyderabad') return 'Hyderabad';
    if (lower === 'bombay' || lower === 'mumbai') return 'Mumbai';
    if (lower === 'madras' || lower === 'chennai') return 'Chennai';
    if (lower === 'calcutta' || lower === 'kolkata') return 'Kolkata';
    // Title case
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
};

export default function LocationScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { colors, isDark } = useTheme();
    const [backendLocations, setBackendLocations] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchLocations();
    }, []);

    const fetchLocations = async () => {
        try {
            const response = await fetch(endpoints.locations);
            const data = await response.json();
            if (Array.isArray(data)) {
                setBackendLocations(data);
            }
        } catch (error) {
            console.error("Failed to fetch locations", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectLocation = async (city: string) => {
        const normalized = normalizeCityName(city);
        await SecureStore.setItemAsync('user_location', normalized);
        router.replace('/(tabs)/home');
    };

    // Combine and deduplicate all cities
    const { popularCities, otherCities } = useMemo(() => {
        // Collect backend cities normalized
        const normalizedBackend = backendLocations.map(normalizeCityName);

        // Normalize famous cities
        const famousSet = new Set(FAMOUS_CITIES);

        // Merge all other cities with any extra backend cities
        const otherSet = new Set<string>();
        ALL_OTHER_CITIES.forEach(c => {
            const norm = normalizeCityName(c);
            if (!famousSet.has(norm)) otherSet.add(norm);
        });
        normalizedBackend.forEach(c => {
            if (!famousSet.has(c)) otherSet.add(c);
        });

        const sortedOther = Array.from(otherSet).sort((a, b) => a.localeCompare(b));

        const query = searchQuery.trim().toLowerCase();
        if (!query) {
            return {
                popularCities: FAMOUS_CITIES,
                otherCities: sortedOther
            };
        }

        return {
            popularCities: FAMOUS_CITIES.filter(c => c.toLowerCase().includes(query)),
            otherCities: sortedOther.filter(c => c.toLowerCase().includes(query))
        };
    }, [backendLocations, searchQuery]);

    return (
        <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top + 8 }]}>
            <StatusBar style={isDark ? 'light' : 'dark'} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={[styles.backBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
                >
                    <ArrowLeft color={colors.text} size={20} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Select Location</Text>
                <View style={{ width: 36 }} />
            </View>

            {/* Search Bar */}
            <View style={[styles.searchContainer, { backgroundColor: isDark ? '#1A1A24' : '#F1F5F9' }]}>
                <Search color={colors.textSecondary} size={18} style={{ marginRight: 10 }} />
                <TextInput
                    style={[styles.searchInput, { color: colors.text }]}
                    placeholder="Search for a city..."
                    placeholderTextColor={colors.textSecondary}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    autoCapitalize="words"
                />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Use Current Location */}
                <TouchableOpacity
                    style={[styles.currentLocationButton, { backgroundColor: colors.surface }]}
                    onPress={() => handleSelectLocation('Visakhapatnam')}
                    activeOpacity={0.8}
                >
                    <LinearGradient
                        colors={['#8A2BE2', '#6D28D9']}
                        style={styles.locationIconBox}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    >
                        <Navigation color="#FFF" size={18} />
                    </LinearGradient>
                    <View style={{ flex: 1, marginLeft: 14 }}>
                        <Text style={[styles.locationTitle, { color: colors.text }]}>Use Current Location</Text>
                        <Text style={[styles.locationSubtitle, { color: colors.textSecondary }]}>Enable GPS for better accuracy</Text>
                    </View>
                    <ChevronRight color={colors.textSecondary} size={18} />
                </TouchableOpacity>

                {loading ? (
                    <ActivityIndicator color="#8A2BE2" style={{ marginTop: 30 }} />
                ) : (
                    <>
                        {/* Popular Cities with Famous Landmark Icons */}
                        {popularCities.length > 0 && (
                            <View style={styles.section}>
                                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>POPULAR CITIES</Text>
                                <View style={styles.popularGrid}>
                                    {popularCities.map((city) => (
                                        <TouchableOpacity
                                            key={city}
                                            style={styles.popularCard}
                                            onPress={() => handleSelectLocation(city)}
                                            activeOpacity={0.7}
                                        >
                                            <LinearGradient
                                                colors={isDark ? ['#241C35', '#1B1629'] : ['#F5F3FF', '#EDE9FE']}
                                                style={styles.popularIconBox}
                                            >
                                                {getCityLandmarkIcon(city, 40, '#8A2BE2')}
                                            </LinearGradient>
                                            <Text
                                                style={[styles.popularCityName, { color: colors.text }]}
                                                numberOfLines={1}
                                            >
                                                {city}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        )}

                        {/* Other Cities List without Outline Stroke */}
                        {otherCities.length > 0 && (
                            <View style={styles.section}>
                                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                                    {searchQuery ? 'SEARCH RESULTS' : 'OTHER CITIES'}
                                </Text>
                                <View style={[styles.otherCitiesContainer, { backgroundColor: colors.surface }]}>
                                    {otherCities.map((city, index) => (
                                        <TouchableOpacity
                                            key={city}
                                            style={[
                                                styles.otherCityItem,
                                                index < otherCities.length - 1 && {
                                                    borderBottomWidth: StyleSheet.hairlineWidth,
                                                    borderBottomColor: colors.border
                                                }
                                            ]}
                                            onPress={() => handleSelectLocation(city)}
                                            activeOpacity={0.6}
                                        >
                                            <Text style={[styles.otherCityText, { color: colors.text }]}>{city}</Text>
                                            <ChevronRight size={16} color={colors.textSecondary} />
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        )}

                        {popularCities.length === 0 && otherCities.length === 0 && (
                            <View style={styles.emptyContainer}>
                                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                                    No cities found matching "{searchQuery}"
                                </Text>
                            </View>
                        )}
                    </>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0B0B15' },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    backBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
    },

    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 14,
        marginHorizontal: 20,
        paddingHorizontal: 16,
        height: 48,
        marginBottom: 20,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
    },

    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },

    currentLocationButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderRadius: 16,
        marginBottom: 24,
    },
    locationIconBox: {
        width: 38,
        height: 38,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    locationTitle: {
        fontSize: 15,
        fontWeight: '600',
    },
    locationSubtitle: {
        fontSize: 12,
        marginTop: 2,
    },

    section: {
        marginBottom: 28,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 1.2,
        marginBottom: 14,
    },

    // Popular Cities Grid (clean cards with landmark icons, NO outline stroke)
    popularGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: -6,
    },
    popularCard: {
        width: '33.33%',
        paddingHorizontal: 6,
        alignItems: 'center',
        marginBottom: 16,
    },
    popularIconBox: {
        width: '100%',
        aspectRatio: 1.1,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    popularCityName: {
        fontSize: 13,
        fontWeight: '600',
        textAlign: 'center',
    },

    // Other Cities List (vertical list, NO outline stroke)
    otherCitiesContainer: {
        borderRadius: 16,
        overflow: 'hidden',
    },
    otherCityItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
        paddingHorizontal: 16,
    },
    otherCityText: {
        fontSize: 15,
        fontWeight: '500',
    },

    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    emptyText: {
        fontSize: 14,
        textAlign: 'center',
    },
});
