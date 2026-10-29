import Constants from 'expo-constants';

// Dynamically resolve API URL: prefer env, then Expo host IP, then Wi-Fi IP fallback
const getApiUrl = () => {
    if (process.env.EXPO_PUBLIC_API_URL) {
        return process.env.EXPO_PUBLIC_API_URL;
    }
    const hostUri = Constants.expoConfig?.hostUri;
    if (hostUri) {
        const hostIp = hostUri.split(':')[0];
        return `http://${hostIp}:8000`;
    }
    return 'http://192.168.1.2:8000';
};

export const API_URL = getApiUrl();

export const endpoints = {
    requestOtp: `${API_URL}/auth/request-otp`,
    verifyOtp: `${API_URL}/auth/verify-otp`,
    loginPassword: `${API_URL}/auth/login-password`,
    setPassword: `${API_URL}/auth/set-password`,
    locations: `${API_URL}/locations`,
    theatres: `${API_URL}/theatres`,
    movies: `${API_URL}/movies`,
    bookings: `${API_URL}/booking`,
    myBookings: `${API_URL}/booking/my-bookings`,
    notifications: `${API_URL}/notifications`,
    profile: `${API_URL}/auth/me`,
    shows: `${API_URL}/shows`,
    seats: `${API_URL}/seats`,
    cancelBooking: `${API_URL}/booking/cancel`,
    myReviews: `${API_URL}/reviews/me`,
    uploadImage: `${API_URL}/upload/image`,
    firebaseVerify: `${API_URL}/auth/firebase-verify`,
};
