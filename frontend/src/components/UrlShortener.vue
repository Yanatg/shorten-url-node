<template>
  <div class="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
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
        <div class="flex items-center gap-2 flex-wrap mt-1">
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
        </div>
      </div>
      <div class="text-sm">
        <span class="font-medium text-gray-600">Short Code:</span>
        <span class="text-gray-800 font-mono bg-gray-200 px-1 py-0.5 rounded">{{
          shortUrlResult.short_code
        }}</span>
      </div>

      <p
        v-if="copySuccess"
        class="text-sm text-green-600 font-medium"
        role="status"
      >
        Copied to clipboard!
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import axios from "axios";

// Reactive variables for component state
const originalUrl = ref("");
const shortUrlResult = ref(null);
const isLoading = ref(false);
const error = ref(null);
const copySuccess = ref(false);


const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

// --- Functions ---

// Function to handle the form submission
const createShortUrl = async () => {
  // Reset state before making the API call
  isLoading.value = true;
  error.value = null;
  shortUrlResult.value = null;
  copySuccess.value = false;

  try {
    // Make POST request to the backend API endpoint for creating URLs
    const response = await axios.post(`${API_BASE_URL}/urls`, {
      original_url: originalUrl.value, // Send the URL from the input field
    });
    // Store the successful response data
    shortUrlResult.value = response.data;
    // Optionally clear the input field after success, or leave it for user reference
    // originalUrl.value = '';
  } catch (err) {
    // Handle errors from the API call
    console.error("Error creating short URL:", err);
    // Try to extract a meaningful error message from the response
    if (err.response && err.response.data && err.response.data.error) {
      error.value = err.response.data.error; // Use backend's error message
    } else if (err.request) {
      // Error: The request was made but no response was received
      error.value =
        "Could not reach the server. Please check the connection or API URL.";
    } else {
      // Error: Something else happened in setting up the request
      error.value = "An unexpected error occurred while sending the request.";
    }
  } finally {
    // Ensure loading state is turned off regardless of success or failure
    isLoading.value = false;
  }
};

// Function to copy the provided text to the user's clipboard
const copyToClipboard = (text) => {
  // Check if Clipboard API is available (requires HTTPS or localhost)
  if (!navigator.clipboard) {
    console.warn("Clipboard API not available. Copy functionality limited.");
    error.value =
      "Clipboard API not available in this browser or context (requires HTTPS).";
    return;
  }

  // Use Clipboard API to write text
  navigator.clipboard
    .writeText(text)
    .then(() => {
      copySuccess.value = true; 
      setTimeout(() => {
        copySuccess.value = false;
      }, 2500);
    })
    .catch((err) => {
      console.error("Failed to copy text: ", err);
      error.value = "Failed to copy URL to clipboard.";
      copySuccess.value = false;
    });
};
</script>
