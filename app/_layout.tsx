import { useEffect, useCallback } from 'react';
import { Stack, useRouter, SplashScreen, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import { registerForPushNotificationsAsync, savePushToken } from '../config/notifications';

// Keep splash screen visible while checking auth
SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
    const { isLoggedIn, loading } = useAuth();
    const { colors, theme } = useTheme();
    const segments = useSegments();
    const router = useRouter();

    useEffect(() => {
        if (loading) return;

        const inAuthGroup = !segments[0] || segments[0] === '(auth)' || segments[0] === 'auth' || segments[0] === 'index';

        if (!isLoggedIn && !inAuthGroup) {
            // Redirect to auth if not logged in and not in auth group
            router.replace('/auth');
        } else if (isLoggedIn && inAuthGroup) {
            // Redirect to home if logged in and in auth group
            router.replace('/(tabs)/home');
        }
    }, [isLoggedIn, segments, loading]);

    useEffect(() => {
        if (!loading && isLoggedIn) {
            async function setupNotifications() {
                try {
                    const token = await registerForPushNotificationsAsync();
                    if (token) {
                        await savePushToken(token);
                    }
                } catch (e) {
                    console.log('Notification setup error:', e);
                }
            }
            setupNotifications();
        }
    }, [loading, isLoggedIn]);

    const onLayoutRootView = useCallback(async () => {
        if (!loading) {
            await SplashScreen.hideAsync();
        }
    }, [loading]);

    useEffect(() => {
        onLayoutRootView();
    }, [onLayoutRootView]);

    if (loading) {
        return null;
    }

    return (
        <>
            <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
            <Stack screenOptions={{ 
                headerShown: false, 
                animation: 'fade_from_bottom',
                animationDuration: 250,
                contentStyle: { backgroundColor: colors.background }
            }}>
                <Stack.Screen name="(tabs)" options={{ animation: 'fade_from_bottom' }} />
                <Stack.Screen name="index" options={{ animation: 'fade_from_bottom' }} />
                <Stack.Screen name="auth" options={{ animation: 'fade_from_bottom' }} />
                <Stack.Screen name="movie/[id]" options={{ animation: 'fade_from_bottom' }} />
                <Stack.Screen name="movie/[id]/select-cinema" options={{ animation: 'fade_from_bottom' }} />
                <Stack.Screen name="movie/[id]/select-seats" options={{ animation: 'fade_from_bottom' }} />
                <Stack.Screen name="movie/[id]/checkout" options={{ animation: 'fade_from_bottom' }} />
                <Stack.Screen name="location" options={{ animation: 'fade_from_bottom' }} />
                <Stack.Screen name="my-bookings" options={{ animation: 'fade_from_bottom' }} />
                <Stack.Screen name="my-reviews" options={{ animation: 'fade_from_bottom' }} />
                <Stack.Screen name="notifications" options={{ animation: 'fade_from_bottom' }} />
                <Stack.Screen name="offers" options={{ animation: 'fade_from_bottom' }} />
                <Stack.Screen name="ticket/[id]" options={{ animation: 'fade_from_bottom' }} />
            </Stack>
        </>
    );
}

export default function RootLayout() {
    return (
        <SafeAreaProvider>
            <ThemeProvider>
                <AuthProvider>
                    <RootLayoutNav />
                </AuthProvider>
            </ThemeProvider>
        </SafeAreaProvider>
    );
}


