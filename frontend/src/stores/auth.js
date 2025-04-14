// frontend/src/stores/auth.js
import { defineStore } from 'pinia';
import axios from 'axios';
import { ref, computed } from 'vue';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true
});

export const useAuthStore = defineStore('auth', () => {
    const user = ref(null);
    const initialCheckDone = ref(false);

    const isLoggedIn = computed(() => !!user.value);

    async function checkAuthStatus() {
        if (user.value) {
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
            user.value = null;
        } finally {
             initialCheckDone.value = true;
        }
    }

    async function login(email, password) {
        try {
            const response = await apiClient.post('/auth/login', { email, password });
            if (response.data.user) {
                user.value = response.data.user;
                return { success: true };
            }
            return { success: false, error: 'Login failed. No user data received.' };
        } catch (error) {
            console.error('Login error:', error);
            const errorMessage = error.response?.data?.error || 'Login failed. Please try again.';
            return { success: false, error: errorMessage };
        }
    }

    async function register(email, password) {
         try {
            const response = await apiClient.post('/auth/register', { email, password });
            return { success: true, message: response.data.message || 'Registration successful!' };
        } catch (error) {
            console.error('Registration error:', error);
            const errorMessage = error.response?.data?.error || 'Registration failed. Please try again.';
            return { success: false, error: errorMessage };
        }
    }

    async function logout() {
        try {
            await apiClient.post('/auth/logout');
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            user.value = null; 
            console.log('User logged out.');
        }
    }

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