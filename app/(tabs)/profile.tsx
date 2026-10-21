import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Alert, Dimensions, TextInput, Modal, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Settings, Check, ChevronRight, Ticket, CreditCard, Gift, Camera, Star } from 'lucide-react-native';
import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { endpoints } from '../../config/api';
import { uploadImageViaXHR } from '../../utils/upload';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { ThemeToggle } from '../../components/ui/ThemeToggle';

const { width, height } = Dimensions.get('window');

export default function ProfileScreen() {
    const { logout } = useAuth();
    const { colors, isDark } = useTheme();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [user, setUser] = useState<any>(null);
    const [recentBookings, setRecentBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [editModalVisible, setEditModalVisible] = useState(false);
    const [editName, setEditName] = useState('');
    const [editEmail, setEditEmail] = useState('');
    const [editMobile, setEditMobile] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (user) {
            setEditName(user.name || '');
            setEditEmail(user.email || '');
            setEditMobile(user.mobile || '');
        }
    }, [user]);

    useEffect(() => {
        fetchProfile();
        fetchMyBookings();
    }, []);

    const fetchProfile = async () => {
        try {
            const token = await SecureStore.getItemAsync('token');
            if (!token) return;

            const response = await fetch(endpoints.profile, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                console.log("Fetched Profile:", data.id, data.name, "Avatar Length:", data.avatar_url ? data.avatar_url.length : 0);
                setUser(data);
            }
        } catch (error) {
            console.error("Failed to fetch profile", error);
        }
    };

    const fetchMyBookings = async () => {
        try {
            const token = await SecureStore.getItemAsync('token');
            if (!token) return;

            const response = await fetch(endpoints.myBookings, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setRecentBookings(data.slice(0, 3)); // Top 3
            }
        } catch (error) {
            console.error("Failed to fetch bookings", error);
        } finally {
            setLoading(false);
        }
    };

    const [previewModalVisible, setPreviewModalVisible] = useState(false);
    const [tempAvatar, setTempAvatar] = useState<string | null>(null);

    const handlePickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
        });

        if (!result.canceled && result.assets[0].uri) {
            setTempAvatar(result.assets[0].uri);
            setPreviewModalVisible(true);
        }
    };

    const handleConfirmUpload = async () => {
        if (!tempAvatar) return;
        setSaving(true);

        try {
            const token = await SecureStore.getItemAsync('token');
            if (!token) return;

            // Step 1: Upload image to S3 via XHR
            const s3Url = await uploadImageViaXHR(endpoints.uploadImage, token, tempAvatar, 'profiles/users');

            // Step 2: Save S3 URL to profile
            const response = await fetch(endpoints.profile, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    avatar_url: s3Url
                })
            });

            if (response.ok) {
                const updatedUser = await response.json();
                setUser(updatedUser);
                setPreviewModalVisible(false);
                setTempAvatar(null);
                Alert.alert("Success", "Profile photo updated!");
            } else {
                Alert.alert("Error", "Failed to update profile photo");
            }
        } catch (error) {
            console.error("Failed to upload image", error);
            Alert.alert("Error", "Network error occurred");
        } finally {
            setSaving(false);
        }
    };

    const handleCancelPreview = () => {
        setPreviewModalVisible(false);
        setTempAvatar(null);
    };

    const handleLogout = async () => {
        await logout();
    };

    const handleSaveProfile = async () => {
        if (!editEmail.includes('@')) {
            Alert.alert("Please enter a valid email address");
            return;
        }

        setSaving(true);
        try {
            const token = await SecureStore.getItemAsync('token');
            if (!token) return;

            const response = await fetch(endpoints.profile, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: editName,
                    email: editEmail,
                    mobile: editMobile
                })
            });

            if (response.ok) {
                const updatedUser = await response.json();
                setUser(updatedUser);
                setEditModalVisible(false);
                Alert.alert("Success", "Profile updated!");
            } else {
                let errorMessage = "Failed to update profile";
                try {
                    const errorData = await response.json();
                    if (errorData.detail) {
                        errorMessage = typeof errorData.detail === 'string' ? errorData.detail : JSON.stringify(errorData.detail);
                    }
                } catch (e) {
                    console.error("Could not parse error response", e);
                }
                Alert.alert("Error", errorMessage);
            }
        } catch (error) {
            console.error("Failed to update profile", error);
            Alert.alert("Error", "Network error occurred");
        } finally {
            setSaving(false);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar style={isDark ? 'light' : 'dark'} />
            {/* Fixed Header without outline */}
            <View style={[styles.fixedHeader, { paddingTop: insets.top + 8, backgroundColor: colors.background }]}>
                <View style={styles.headerContent}>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>Profile</Text>
                    <TouchableOpacity 
                        style={[
                            styles.settingsButton, 
                            { 
                                backgroundColor: colors.surface, 
                                borderColor: colors.border, 
                                borderWidth: 1 
                            }
                        ]} 
                        onPress={() => setEditModalVisible(true)}
                    >
                        <Settings color="#8A2BE2" size={20} />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
                <View style={styles.content}>
                {/* Profile Section */}
                <View style={styles.profileSection}>
                    <TouchableOpacity onPress={handlePickImage} style={styles.avatarContainer}>
                        <LinearGradient
                            colors={['#8A2BE2', 'transparent']}
                            style={styles.avatarGradient}
                        >
                            <Image
                                source={{ uri: user?.avatar_url || 'https://via.placeholder.com/150' }}
                                style={[styles.avatar, { borderColor: colors.background }]}
                            />
                        </LinearGradient>
                        <View style={[styles.editBadge, { borderColor: colors.background }]}>
                            <Camera color="#FFF" size={12} />
                        </View>
                    </TouchableOpacity>

                    {/* Logic: Show Name if set, else show Email */}
                    <Text style={[styles.userName, { color: colors.text }]}>
                        {user?.name && user.name !== 'Movie Buff' ? user.name : user?.email || 'Guest'}
                    </Text>

                    <View style={[styles.proBadge, { backgroundColor: isDark ? '#1F1F2E' : '#F3E8FF' }]}>
                        <Text style={styles.proText}>PRO MEMBER</Text>
                        <Text style={[styles.sinceText, { color: colors.textSecondary }]}> Since 2023</Text>
                    </View>
                </View>

                {/* Dashboard Buttons */}
                <View style={styles.dashboard}>
                    {/* Theme Appearance Row */}
                    <ThemeToggle variant="row" />

                    <TouchableOpacity 
                        style={[
                            styles.dashBtn, 
                            { 
                                backgroundColor: colors.surface, 
                                borderColor: colors.border,
                                borderWidth: 1,
                            }
                        ]} 
                        onPress={() => router.push('/my-bookings')}
                    >
                        <View style={styles.dashIcon}>
                            <Ticket color="#8A2BE2" size={22} />
                        </View>
                        <Text style={[styles.dashText, { color: colors.text }]}>My Bookings</Text>
                        <ChevronRight color={colors.textSecondary} size={20} />
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={[
                            styles.dashBtn, 
                            { 
                                backgroundColor: colors.surface, 
                                borderColor: colors.border,
                                borderWidth: 1,
                            }
                        ]} 
                        onPress={() => router.push('/my-reviews')}
                    >
                        <View style={styles.dashIcon}>
                            <Star color="#8A2BE2" size={22} />
                        </View>
                        <Text style={[styles.dashText, { color: colors.text }]}>My Reviews</Text>
                        <ChevronRight color={colors.textSecondary} size={20} />
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={[
                            styles.dashBtn, 
                            { 
                                backgroundColor: colors.surface, 
                                borderColor: colors.border,
                                borderWidth: 1,
                            }
                        ]} 
                        onPress={() => router.push('/offers')}
                    >
                        <View style={styles.dashIcon}>
                            <CreditCard color="#8A2BE2" size={22} />
                        </View>
                        <Text style={[styles.dashText, { color: colors.text }]}>Offers & Rewards</Text>
                        <ChevronRight color={colors.textSecondary} size={20} />
                    </TouchableOpacity>
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 30, marginBottom: 16 }}>
                    <Text style={[styles.sectionHeaderNoMargin, { color: colors.textSecondary }]}>RECENT HISTORY</Text>
                    <TouchableOpacity onPress={() => router.push('/my-bookings')}>
                        <Text style={styles.viewAll}>VIEW ALL</Text>
                    </TouchableOpacity>
                </View>

                {/* Recent History List */}
                <View style={styles.historyList}>
                    {recentBookings.map((booking: any) => (
                        <View 
                            key={booking.id} 
                            style={[
                                styles.historyCard, 
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
                        >
                            <Image
                                source={{ uri: booking.poster_url || 'https://via.placeholder.com/100' }}
                                style={styles.historyPoster}
                            />
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.historyTitle, { color: colors.text }]}>{booking.movie_title || 'Unknown Movie'}</Text>
                                <Text style={[styles.historySubtitle, { color: colors.textSecondary }]}>{booking.theater_name} • 2 Tickets</Text>
                                <View style={[styles.statusBadge, { backgroundColor: isDark ? 'rgba(138, 43, 226, 0.15)' : '#F3E8FF' }]}>
                                    <Text style={styles.statusText}>COMPLETED</Text>
                                </View>
                            </View>
                        </View>
                    ))}
                    {recentBookings.length === 0 && (
                        <Text style={{ color: colors.textMuted, textAlign: 'center' }}>No recent bookings</Text>
                    )}
                </View>

                {/* Logout */}
                <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                    <Text style={styles.logoutText}>Log Out</Text>
                </TouchableOpacity>

                <View style={{ height: 100 }} />
                </View>
            </ScrollView>

            {/* Edit Profile Modal */}
            <Modal
                animationType="slide"
                transparent={false}
                visible={editModalVisible}
                onRequestClose={() => setEditModalVisible(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={[styles.fullScreenModal, { backgroundColor: colors.background }]}
                >
                    <View style={styles.previewContainer}>
                        <Text style={[styles.previewTitle, { color: colors.text }]}>Edit Profile</Text>

                        <View style={{ width: '100%', marginBottom: 20 }}>
                            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Name</Text>
                            <TextInput
                                style={[
                                    styles.input, 
                                    { 
                                        backgroundColor: colors.inputBg, 
                                        color: colors.text, 
                                        borderColor: colors.border 
                                    }
                                ]}
                                value={editName}
                                onChangeText={setEditName}
                                placeholder="Enter your name"
                                placeholderTextColor={colors.textMuted}
                            />

                            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Email</Text>
                            <TextInput
                                style={[
                                    styles.input, 
                                    { 
                                        backgroundColor: colors.inputBg, 
                                        color: colors.text, 
                                        borderColor: colors.border 
                                    }
                                ]}
                                value={editEmail}
                                onChangeText={setEditEmail}
                                placeholder="Enter your email"
                                placeholderTextColor={colors.textMuted}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />

                            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Mobile Number</Text>
                            <TextInput
                                style={[
                                    styles.input, 
                                    { 
                                        backgroundColor: colors.inputBg, 
                                        color: colors.text, 
                                        borderColor: colors.border 
                                    }
                                ]}
                                value={editMobile}
                                onChangeText={setEditMobile}
                                placeholder="Enter your mobile number"
                                placeholderTextColor={colors.textMuted}
                                keyboardType="phone-pad"
                            />
                        </View>

                        <View style={styles.previewButtons}>
                            <TouchableOpacity 
                                style={[
                                    styles.cancelBtn, 
                                    { 
                                        backgroundColor: colors.surface, 
                                        borderColor: colors.border,
                                        borderWidth: 1,
                                    }
                                ]} 
                                onPress={() => setEditModalVisible(false)}
                            >
                                <Text style={[styles.cancelText, { color: colors.text }]}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveProfile} disabled={saving}>
                                <Text style={styles.saveText}>{saving ? 'Saving...' : 'Save Changes'}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            {/* Image Preview Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={previewModalVisible && !!tempAvatar}
                onRequestClose={handleCancelPreview}
            >
                <View style={[styles.fullScreenModal, { backgroundColor: colors.background }]}>
                    <View style={styles.previewContainer}>
                        <Text style={[styles.previewTitle, { color: colors.text }]}>Preview Photo</Text>

                        <Image
                            source={{ uri: tempAvatar || '' }}
                            style={styles.previewImage}
                        />

                        <View style={styles.previewButtons}>
                            <TouchableOpacity 
                                style={[styles.cancelBtn, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]} 
                                onPress={handleCancelPreview}
                            >
                                <Text style={[styles.cancelText, { color: colors.text }]}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.saveBtn} onPress={handleConfirmUpload} disabled={saving}>
                                <Text style={styles.saveText}>{saving ? 'Uploading...' : 'Confirm'}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0B0B15' },

    fixedHeader: { 
        paddingHorizontal: width * 0.05, 
        paddingBottom: 14,
        borderBottomWidth: 0, // No outline
    },
    headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    headerTitle: { fontSize: 26, fontWeight: 'bold' },
    settingsButton: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    content: { paddingHorizontal: width * 0.05, paddingBottom: 100 },

    profileSection: { alignItems: 'center', marginBottom: 30 },
    avatarContainer: { position: 'relative', marginBottom: 16 },
    avatarGradient: { width: 104, height: 104, borderRadius: 52, padding: 2, justifyContent: 'center', alignItems: 'center' },
    avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 4, borderColor: '#0B0B15' },
    editBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#8A2BE2', padding: 6, borderRadius: 20, borderWidth: 3, borderColor: '#0B0B15' },

    userName: { color: '#FFF', fontSize: 22, fontWeight: 'bold', marginBottom: 8 },
    proBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1F1F2E', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
    proText: { color: '#8A2BE2', fontSize: 10, fontWeight: 'bold' },
    sinceText: { color: '#6B7280', fontSize: 10 },

    statsRow: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: '#13131A', borderRadius: 24, padding: 20, marginBottom: 30, borderWidth: 1, borderColor: '#1F1F2E' },
    statItem: { alignItems: 'center' },
    statValue: { color: '#FFF', fontSize: 20, fontWeight: 'bold', marginBottom: 4 },
    statLabel: { color: '#6B7280', fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
    statDivider: { width: 1, backgroundColor: '#2D2D3F' },

    sectionHeader: { color: '#6B7280', fontSize: 12, fontWeight: 'bold', letterSpacing: 1, marginBottom: 16, textTransform: 'uppercase' },
    sectionHeaderNoMargin: { color: '#6B7280', fontSize: 12, fontWeight: 'bold', letterSpacing: 1, textTransform: 'uppercase' },
    viewAll: { color: '#8A2BE2', fontSize: 12, fontWeight: 'bold' },

    dashboard: { gap: 12 },
    dashBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#13131A', padding: 16, borderRadius: 20, borderWidth: 1, borderColor: '#1F1F2E' },
    dashIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(138, 43, 226, 0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    dashText: { color: '#FFF', fontSize: 16, flex: 1, fontWeight: '500' },

    historyList: { gap: 16 },
    historyCard: { flexDirection: 'row', backgroundColor: '#13131A', padding: 12, borderRadius: 20, borderWidth: 1, borderColor: '#1F1F2E', alignItems: 'center' },
    historyPoster: { width: 50, height: 75, borderRadius: 10, marginRight: 16 },
    historyTitle: { color: '#FFF', fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
    historySubtitle: { color: '#9CA3AF', fontSize: 12, marginBottom: 8 },
    statusBadge: { alignSelf: 'flex-start', backgroundColor: 'rgba(138, 43, 226, 0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    statusText: { color: '#8A2BE2', fontSize: 10, fontWeight: 'bold' },

    logoutBtn: { alignItems: 'center', marginTop: 40, marginBottom: 20 },
    logoutText: { color: '#EF4444', fontSize: 16, fontWeight: 'bold' },

    modalOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    modalContent: { width: '100%', backgroundColor: '#1F1F2E', borderRadius: 24, padding: 24, borderWidth: 1, borderColor: '#2D2D3F' },
    modalTitle: { color: '#FFF', fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },

    fullScreenModal: { flex: 1, backgroundColor: '#0B0B15', justifyContent: 'flex-start', paddingTop: 100, paddingHorizontal: 20 },
    previewContainer: { alignItems: 'center', width: '100%' },
    previewTitle: { color: '#FFF', fontSize: 24, fontWeight: 'bold', marginBottom: 40 },
    previewImage: { width: 250, height: 250, borderRadius: 125, borderWidth: 4, borderColor: '#8A2BE2', marginBottom: 50 },
    previewButtons: { flexDirection: 'row', gap: 20, width: '100%' },

    inputLabel: { color: '#9CA3AF', fontSize: 12, marginBottom: 8, fontWeight: '600' },
    input: { backgroundColor: '#13131A', color: '#FFF', padding: 16, borderRadius: 12, marginBottom: 20, fontSize: 16, borderWidth: 1, borderColor: '#2D2D3F' },
    modalButtons: { flexDirection: 'row', gap: 12 },
    cancelBtn: { flex: 1, padding: 16, backgroundColor: '#2D2D3F', borderRadius: 16, alignItems: 'center' },
    cancelText: { color: '#FFF', fontWeight: 'bold' },
    saveBtn: { flex: 1, padding: 16, backgroundColor: '#8A2BE2', borderRadius: 16, alignItems: 'center' },
    saveText: { color: '#FFF', fontWeight: 'bold' },
});
