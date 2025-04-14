<template>
  <div class="mx-auto p-6 bg-white rounded-lg shadow-lg">
    <h2 class="text-2xl font-semibold text-center mb-6 text-gray-700">
      Create Short URL
    </h2>

    <form
      @submit.prevent="createShortUrl"
      class="flex flex-col sm:flex-row gap-3 mb-4"
    >
      <input
        type="url"
        v-model="originalUrl"
        placeholder="Enter your long URL here (e.g., https://example.com)"
        required
        aria-label="Long URL Input"
        class="flex-grow p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150 ease-in-out"
      />
      <button
        type="submit"
        :disabled="isLoading"
        class="px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150 ease-in-out"
      >
        <span v-if="isLoading">Creating...</span>
        <span v-else>Shorten URL</span>
      </button>
    </form>

    <div
      v-if="error"
      class="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md text-sm"
      role="alert"
    >
      <strong>Error:</strong> {{ error }}
    </div>

    <div
      v-if="shortUrlResult"
      class="mt-6 p-4 border border-gray-200 rounded-md bg-gray-50 space-y-3"
    >
      <h3 class="text-lg font-semibold text-green-700">Success!</h3>

      <div class="text-sm">
        <span class="font-medium text-gray-600">Short URL:</span>
        <div class="flex items-center justify-center gap-2 flex-wrap mt-1">
          <a
            :href="shortUrlResult.full_short_url"
            target="_blank"
            rel="noopener noreferrer"
            class="text-blue-600 hover:underline break-all font-medium"
          >
            {{ shortUrlResult.full_short_url }}
          </a>
          <button
            @click="copyToClipboard(shortUrlResult.full_short_url)"
            title="Copy Short URL"
            class="px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 focus:outline-none focus:ring-1 focus:ring-gray-400 transition duration-150 ease-in-out"
          >
            Copy URL
          </button>
          <button
            @click="openQrModal(shortUrlResult.full_short_url)"
            title="Show QR Code"
            class="px-2 py-1 text-xs bg-indigo-500 text-white rounded hover:bg-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-400 transition duration-150 ease-in-out"
          >
            Show QR
          </button>
        </div>
      </div>

      <p
        v-if="copySuccess"
        class="text-sm text-green-600 font-medium"
        role="status"
      >
        Copied to clipboard!
      </p>
    </div>
    <QrCodeModal
      v-if="showQrModal"
      :url="qrCodeUrl"
      @close="showQrModal = false"
    />
  </div>
</template>

<script setup>
import { ref } from "vue";
import axios from "axios";
import QrCodeModal from './QrCodeModal.vue';
import { useUrlStore } from '../stores/url';
import { useAuthStore } from '../stores/auth';

const originalUrl = ref("");
const shortUrlResult = ref(null);
const isLoading = ref(false);
const error = ref(null);
const copySuccess = ref(false);
const showQrModal = ref(false);
const qrCodeUrl = ref('');
const urlStore = useUrlStore();
const authStore = useAuthStore();

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";


const createShortUrl = async () => {
    isLoading.value = true;
    error.value = null;
    shortUrlResult.value = null;
    copySuccess.value = false;
    showQrModal.value = false;
    qrCodeUrl.value = '';
    let creationSuccess = false;

    try {
        const response = await axios.post(
            `${API_BASE_URL}/urls`,
            { original_url: originalUrl.value },
            { withCredentials: true }
        );
        shortUrlResult.value = response.data;
        creationSuccess = true;

    } catch (err) {
        console.error("Error creating short URL:", err);
        if (err.response && err.response.data && err.response.data.error) {
            error.value = err.response.data.error;
        } else if (err.request) {
            error.value = "Could not reach the server. Please check the connection or API URL.";
        } else {
            error.value = "An unexpected error occurred while sending the request.";
        }
        shortUrlResult.value = null;

    } finally {
        isLoading.value = false;
    }

    if (creationSuccess && authStore.isLoggedIn) {
        console.log('>>> STEP 1: UrlShortener requesting history refresh <<<');
        try {
            await urlStore.fetchHistory();
        } catch (fetchErr) {
            console.error("Error refreshing history after URL creation:", fetchErr);
        }
    }
};

const copyToClipboard = (text) => {
    if (!navigator.clipboard) {
        console.warn("Clipboard API not available.");
        error.value = "Clipboard API not available in this browser or context (requires HTTPS).";
        return;
    }
    navigator.clipboard.writeText(text)
    .then(() => {
        copySuccess.value = true;
        setTimeout(() => { copySuccess.value = false; }, 2500);
    })
    .catch((err) => {
        console.error("Failed to copy text: ", err);
        error.value = "Failed to copy URL to clipboard.";
        copySuccess.value = false;
    });
};

const openQrModal = (url) => {
    if(url && typeof url === 'string'){
        qrCodeUrl.value = url;
        showQrModal.value = true;
    } else {
        console.error("Cannot open QR modal: Invalid or no URL provided");
        error.value = "Could not generate QR code for this URL.";
    }
};
</script>
