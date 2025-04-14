// frontend/src/stores/url.js
import { defineStore } from 'pinia';
import { ref } from 'vue';
import axios from 'axios';
import { useAuthStore } from './auth'; // Need auth store to check login status

// API Client Setup (ensure consistent base URL and credentials handling)
// Using a dedicated instance makes configuration explicit
const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
    withCredentials: true // Crucial for sending session cookies
});

export const useUrlStore = defineStore('url', () => {
    // --- State ---
    const history = ref([]); // Holds the array of history items { id, short_code, original_url, visit_count, created_at }
    const isLoadingHistory = ref(false); // Tracks loading state for the history list
    const historyError = ref(null); // Stores any error message related to fetching history

    // --- Actions ---

    // Action to fetch the logged-in user's URL history from the backend
    async function fetchHistory() {
        const authStore = useAuthStore(); // Get auth store instance inside action

        // Only proceed if the user is actually logged in
        if (!authStore.isLoggedIn) {
            console.log('User not logged in, clearing history state.');
            history.value = []; // Clear local history if user is not logged in
            historyError.value = null; // Clear any previous errors
            isLoadingHistory.value = false; // Ensure loading is off
            return; // Stop execution
        }

        console.log('Fetching history via URL store...');
        isLoadingHistory.value = true; // Set loading true
        historyError.value = null; // Clear previous errors
        try {
            // Make the authenticated request to the history endpoint
            const response = await apiClient.get('/urls/history');
            console.log('>>> STEP 2: Store received history data from API:', JSON.stringify(response.data)); // Log received data
            // Update the history state with the data from the backend
            history.value = response.data;
            console.log('>>> STEP 3: Store history state AFTER update:', JSON.stringify(history.value)); // Log state after update');
        } catch (err) {
            // Handle errors during the fetch operation
            console.error('Error fetching history via store:', err);
            history.value = []; // Clear history state on error
            if (err.response && err.response.status === 401) {
                // Specific handling for unauthorized error (e.g., session expired)
                historyError.value = 'Authentication session may have expired. Please log in again.';
                // Consider automatically logging the user out on the frontend
                // authStore.logout();
            } else {
                // Generic error message for other issues
                historyError.value = 'Could not load URL history.';
            }
        } finally {
            // Ensure loading state is always turned off
            isLoadingHistory.value = false;
        }
    }

    // --- Return state and actions needed by components ---
    return {
        history,
        isLoadingHistory,
        historyError,
        fetchHistory // Expose the action so components can call it
    };
});