// frontend/src/stores/url.js
import { defineStore } from 'pinia';
import { ref } from 'vue';
import axios from 'axios';
import { useAuthStore } from './auth';

const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
    withCredentials: true
});

export const useUrlStore = defineStore('url', () => {
    const history = ref([]);
    const isLoadingHistory = ref(false);
    const historyError = ref(null);

    async function fetchHistory() {
        const authStore = useAuthStore();

        if (!authStore.isLoggedIn) {
            console.log('User not logged in, clearing history state.');
            history.value = [];
            historyError.value = null;
            isLoadingHistory.value = false;
            return;
        }

        console.log('Fetching history via URL store...');
        isLoadingHistory.value = true;
        historyError.value = null;
        try {
            const response = await apiClient.get('/urls/history');
            history.value = response.data;
            console.log('History fetched successfully:', history.value);
        } catch (err) {
            console.error('Error fetching history via store:', err);
            history.value = [];
            if (err.response && err.response.status === 401) {
                historyError.value = 'Authentication session may have expired. Please log in again.';
            } else {
                historyError.value = 'Could not load URL history.';
            }
        } finally {
            isLoadingHistory.value = false;
        }
    }

    return {
        history,
        isLoadingHistory,
        historyError,
        fetchHistory
    };
});