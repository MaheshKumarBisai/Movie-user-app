import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Easing } from 'react-native';
import Svg, { Path, Circle, G } from 'react-native-svg';
import { Sun, Moon } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';

interface ThemeToggleProps {
    variant?: 'header' | 'row';
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ variant = 'header' }) => {
    const { isDark, toggleTheme, colors } = useTheme();

    // Animation progress: 0 = Light (Day), 1 = Dark (Night)
    const animProgress = useRef(new Animated.Value(isDark ? 1 : 0)).current;

    useEffect(() => {
        Animated.timing(animProgress, {
            toValue: isDark ? 1 : 0,
            duration: 420,
            easing: Easing.bezier(0.4, 0.0, 0.2, 1),
            useNativeDriver: false,
        }).start();
    }, [isDark]);

    // Interpolations for the Compact Celestial Switch
    const trackBg = animProgress.interpolate({
        inputRange: [0, 1],
        outputRange: ['#9061F9', '#1A0B2E'],
    });

    const trackBorder = animProgress.interpolate({
        inputRange: [0, 1],
        outputRange: ['#C4B5FD', '#581C87'],
    });

    // Sun / Moon thumb translateX: 2 (left / Day) -> 26 (right / Night)
    const thumbTranslateX = animProgress.interpolate({
        inputRange: [0, 1],
        outputRange: [2, 26],
    });

    // Clouds slide down and fade out
    const cloudsTranslateY = animProgress.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 18],
    });

    const cloudsOpacity = animProgress.interpolate({
        inputRange: [0, 0.7, 1],
        outputRange: [1, 0.3, 0],
    });

    // Stars scale up and fade in
    const starsOpacity = animProgress.interpolate({
        inputRange: [0, 0.3, 1],
        outputRange: [0, 0.2, 1],
    });

    const starsScale = animProgress.interpolate({
        inputRange: [0, 1],
        outputRange: [0.3, 1],
    });

    // Sun to Moon crossfade
    const sunOpacity = animProgress.interpolate({
        inputRange: [0, 0.6, 1],
        outputRange: [1, 0.2, 0],
    });

    const moonOpacity = animProgress.interpolate({
        inputRange: [0, 0.4, 1],
        outputRange: [0, 0.5, 1],
    });

    const sunScale = animProgress.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 0.6],
    });

    const moonScale = animProgress.interpolate({
        inputRange: [0, 1],
        outputRange: [0.6, 1],
    });

    if (variant === 'row') {
        return (
            <TouchableOpacity
                style={[
                    styles.rowContainer,
                    {
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                    }
                ]}
                onPress={toggleTheme}
                activeOpacity={0.8}
            >
                <View style={styles.rowLeft}>
                    <View style={[styles.circleIcon, { backgroundColor: isDark ? '#2A2A3E' : '#F3E8FF', borderColor: isDark ? '#3E3E58' : '#E9D5FF' }]}>
                        {isDark ? (
                            <Moon size={17} color="#A78BFA" />
                        ) : (
                            <Sun size={17} color="#8A2BE2" />
                        )}
                    </View>
                    <View>
                        <Text style={[styles.rowTitle, { color: colors.text }]}>Appearance</Text>
                        <Text style={[styles.rowSubtitle, { color: colors.textSecondary }]}>
                            {isDark ? 'Dark Theme' : 'Pure White Theme'}
                        </Text>
                    </View>
                </View>

                {/* Sleek, Compact Animated Celestial Day / Night Toggle Capsule */}
                <Animated.View
                    style={[
                        styles.celestialTrack,
                        {
                            backgroundColor: trackBg,
                            borderColor: trackBorder,
                        }
                    ]}
                >
                    {/* Stars Layer (active at night on the left side) */}
                    <Animated.View
                        style={[
                            styles.starsContainer,
                            {
                                opacity: starsOpacity,
                                transform: [{ scale: starsScale }],
                            }
                        ]}
                        pointerEvents="none"
                    >
                        {/* Sparkle Star 1 */}
                        <View style={[styles.starSparkle, { top: 4, left: 6 }]}>
                            <Svg width="6.5" height="6.5" viewBox="0 0 24 24" fill="none">
                                <Path
                                    d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z"
                                    fill="#FFFFFF"
                                />
                            </Svg>
                        </View>
                        {/* Tiny Star Dot 2 */}
                        <View style={[styles.starDot, { top: 6, left: 15, width: 2, height: 2 }]} />
                        {/* Sparkle Star 3 */}
                        <View style={[styles.starSparkle, { top: 12, left: 10 }]}>
                            <Svg width="5.5" height="5.5" viewBox="0 0 24 24" fill="none">
                                <Path
                                    d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z"
                                    fill="#FDE047"
                                />
                            </Svg>
                        </View>
                        {/* Tiny Star Dot 4 */}
                        <View style={[styles.starDot, { top: 15, left: 18, width: 2, height: 2 }]} />
                        {/* Tiny Star Dot 5 */}
                        <View style={[styles.starDot, { top: 12, left: 4, width: 1.5, height: 1.5 }]} />
                    </Animated.View>

                    {/* Clouds Layer (active during day on the right side) */}
                    <Animated.View
                        style={[
                            styles.cloudsContainer,
                            {
                                opacity: cloudsOpacity,
                                transform: [{ translateY: cloudsTranslateY }],
                            }
                        ]}
                        pointerEvents="none"
                    >
                        <Svg width="32" height="18" viewBox="0 0 70 38" fill="none">
                            {/* Translucent back cloud layer */}
                            <G opacity="0.45">
                                <Circle cx="32" cy="22" r="14" fill="#FFFFFF" />
                                <Circle cx="48" cy="24" r="11" fill="#FFFFFF" />
                                <Circle cx="18" cy="26" r="9" fill="#FFFFFF" />
                            </G>
                            {/* Solid front puffy clouds */}
                            <Circle cx="38" cy="24" r="13" fill="#FFFFFF" />
                            <Circle cx="52" cy="26" r="10" fill="#FFFFFF" />
                            <Circle cx="24" cy="27" r="9" fill="#FFFFFF" />
                            <Circle cx="12" cy="30" r="7" fill="#FFFFFF" />
                            <Path
                                d="M12 36H56C60 36 64 33 64 29C64 25 61 22 57 22C56 16 50 12 44 13C40 13 36 15 34 18C32 17 29 17 27 18C23 18 20 21 20 25C17 25 14 27 13 30C11 31 10 33 10 36Z"
                                fill="#FFFFFF"
                            />
                        </Svg>
                    </Animated.View>

                    {/* Sliding Celestial Ball (Sun / Moon) */}
                    <Animated.View
                        style={[
                            styles.celestialThumb,
                            {
                                transform: [{ translateX: thumbTranslateX }],
                            }
                        ]}
                    >
                        {/* SUN (Day Mode) */}
                        <Animated.View
                            style={[
                                styles.sunBody,
                                {
                                    opacity: sunOpacity,
                                    transform: [{ scale: sunScale }],
                                }
                            ]}
                        >
                            <View style={styles.sunInner}>
                                <View style={styles.sunHighlight} />
                            </View>
                        </Animated.View>

                        {/* MOON with Craters (Night Mode) */}
                        <Animated.View
                            style={[
                                styles.moonBody,
                                {
                                    opacity: moonOpacity,
                                    transform: [{ scale: moonScale }],
                                }
                            ]}
                        >
                            {/* Crater 1 (top right) */}
                            <View style={[styles.crater, { top: 3, right: 4, width: 4, height: 4, borderRadius: 2 }]} />
                            {/* Crater 2 (bottom right) */}
                            <View style={[styles.crater, { bottom: 3.5, right: 5, width: 4.5, height: 4.5, borderRadius: 2.25 }]} />
                            {/* Crater 3 (left center) */}
                            <View style={[styles.crater, { top: 7, left: 3, width: 6, height: 6, borderRadius: 3 }]} />
                        </Animated.View>
                    </Animated.View>
                </Animated.View>
            </TouchableOpacity>
        );
    }

    // Header variant: 100% circular celestial button
    return (
        <TouchableOpacity
            style={[
                styles.circularHeaderBtn,
                {
                    backgroundColor: isDark ? '#1A0B2E' : '#FFFFFF',
                    borderColor: isDark ? '#581C87' : '#E5E7EB',
                }
            ]}
            onPress={toggleTheme}
            activeOpacity={0.7}
            accessibilityLabel={`Switch to ${isDark ? 'Light' : 'Dark'} theme`}
        >
            {isDark ? (
                <Moon size={16} color="#C084FC" />
            ) : (
                <Sun size={16} color="#8A2BE2" />
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    circularHeaderBtn: {
        width: 34,
        height: 34,
        borderRadius: 17,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        overflow: 'hidden',
        shadowColor: '#8A2BE2',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 3,
        elevation: 2,
    },
    rowContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 12,
    },
    rowLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    circleIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        overflow: 'hidden',
    },
    rowTitle: {
        fontSize: 15,
        fontWeight: '700',
    },
    rowSubtitle: {
        fontSize: 12,
        marginTop: 2,
    },

    // Compact, Delicate & Attractive Celestial Switch Track
    celestialTrack: {
        width: 52,
        height: 28,
        borderRadius: 14,
        borderWidth: 1.2,
        overflow: 'hidden',
        position: 'relative',
        justifyContent: 'center',
        shadowColor: '#8A2BE2',
        shadowOffset: { width: 0, height: 1.5 },
        shadowOpacity: 0.16,
        shadowRadius: 3,
        elevation: 2,
    },

    // Night Stars
    starsContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: 26,
        height: 28,
    },
    starSparkle: {
        position: 'absolute',
    },
    starDot: {
        position: 'absolute',
        backgroundColor: '#FFFFFF',
        borderRadius: 1,
        shadowColor: '#FFFFFF',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 1.5,
    },

    // Day Clouds
    cloudsContainer: {
        position: 'absolute',
        bottom: -1,
        right: -1,
        width: 32,
        height: 18,
    },

    // Sliding Celestial Thumb (Sun / Moon)
    celestialThumb: {
        width: 22,
        height: 22,
        borderRadius: 11,
        position: 'absolute',
        top: 2,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.25,
        shadowRadius: 2,
        elevation: 3,
    },

    // Sun Body
    sunBody: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        borderRadius: 11,
        backgroundColor: '#F59E0B',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#FCD34D',
    },
    sunInner: {
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: '#FBBF24',
        position: 'relative',
    },
    sunHighlight: {
        position: 'absolute',
        top: 2,
        left: 2.5,
        width: 5,
        height: 3,
        borderRadius: 2,
        backgroundColor: '#FEF3C7',
        opacity: 0.8,
    },

    // Moon Body with Craters
    moonBody: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        borderRadius: 11,
        backgroundColor: '#DDD6FE',
        borderWidth: 1,
        borderColor: '#EDE9FE',
    },
    crater: {
        position: 'absolute',
        backgroundColor: '#A78BFA',
        opacity: 0.85,
        borderWidth: 0.5,
        borderColor: '#8B5CF6',
    },
});
