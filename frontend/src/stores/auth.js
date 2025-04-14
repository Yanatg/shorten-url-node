// frontend/src/stores/auth.js
import { defineStore } from 'pinia';
import axios from 'axios';
import { ref, computed } from 'vue'; // Import computed

// Get API base URL from environment variables or use default
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

// Use axios instance that handles credentials (cookies)
const apiClient = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true // Important! Send cookies with requests
});

export const useAuthStore = defineStore('auth', () => {
    // --- State ---
    const user = ref(null); // Store user info { id, email } or null
    const initialCheckDone = ref(false); // Track if initial auth check is complete

    // --- Getters ---
    const isLoggedIn = computed(() => !!user.value); // True if user object exists

    // --- Actions ---

    // Action to check session status with backend /api/auth/me endpoint
    async function checkAuthStatus() {
        if (user.value) { // Already logged in, no need to check again unless forced
            initialCheckDone.value = true;
            return;
        }
        try {
            console.log('Checking auth status...');
            const response = await apiClient.get('/auth/me');
            if (response.data.isLoggedIn && response.data.user) {
                user.value = response.data.user;
                console.log('User is logged in:', user.value);
            } else {
                user.value = null;
                console.log('User is not logged in.');
            }
        } catch (error) {
            console.error('Error checking auth status:', error);
            user.value = null; // Assume not logged in on error
        } finally {
             initialCheckDone.value = true; // Mark check as done
        }
    }

    // Action to handle user login
    async function login(email, password) {
        try {
            const response = await apiClient.post('/auth/login', { email, password });
            if (response.data.user) {
                user.value = response.data.user;
                return { success: true };
            }
             // Should not happen if backend sends user on success, but handle defensively
            return { success: false, error: 'Login failed. No user data received.' };
        } catch (error) {
            console.error('Login error:', error);
            const errorMessage = error.response?.data?.error || 'Login failed. Please try again.';
            return { success: false, error: errorMessage };
        }
    }

    // Action to handle user registration
    async function register(email, password) {
         try {
            const response = await apiClient.post('/auth/register', { email, password });
            // Typically registration requires login separately, but return success/error
            return { success: true, message: response.data.message || 'Registration successful!' };
        } catch (error) {
            console.error('Registration error:', error);
            const errorMessage = error.response?.data?.error || 'Registration failed. Please try again.';
            return { success: false, error: errorMessage };
        }
    }

    // Action to handle user logout
    async function logout() {
        try {
            await apiClient.post('/auth/logout');
        } catch (error) {
            console.error('Logout error:', error);
            // Proceed with frontend logout even if backend call fails
        } finally {
            user.value = null; // Clear user state
            console.log('User logged out.');
        }
    }

    // --- Return state, getters, actions ---
    return {
        user,
        initialCheckDone,
        isLoggedIn,
        checkAuthStatus,
        login,
        register,
        logout
    };
});