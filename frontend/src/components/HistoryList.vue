<template>
  <div
    class="history-container bg-white p-6 rounded-lg shadow-lg border border-gray-200"
  >
    <h3 class="text-xl font-semibold mb-4 text-gray-700">
      Your URL History (Items: {{ historyForLoop.length }})
    </h3>

    <div v-if="urlStore.isLoadingHistory" class="text-center text-gray-500">
      Loading history...
    </div>

    <div
      v-else-if="urlStore.historyError"
      class="p-3 bg-red-100 border border-red-400 text-red-700 rounded-md text-sm"
      role="alert"
    >
      Error loading history: {{ urlStore.historyError }}
    </div>

    <div
      v-else-if="historyForLoop.length === 0"
      class="text-center text-gray-500"
    >
      You haven't shortened any URLs while logged in yet, or history is empty.
    </div>

    <div v-else class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th
              scope="col"
              class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Original URL
            </th>
            <th
              scope="col"
              class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Short URL
            </th>
            <th
              scope="col"
              class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Visits
            </th>
            <th
              scope="col"
              class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Created
            </th>
            <th
              scope="col"
              class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              QR Code
            </th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr
            v-for="item in historyForLoop"
            :key="item.id"
            class="hover:bg-gray-50"
          >
            <td
              class="px-4 py-3 whitespace-nowrap max-w-xs overflow-hidden overflow-ellipsis"
            >
              <a
                :href="item.original_url"
                target="_blank"
                rel="noopener noreferrer"
                :title="item.original_url"
                class="text-sm text-gray-600 hover:text-blue-600"
              >
                {{ truncateUrl(item.original_url) }}
              </a>
            </td>
            <td class="px-4 py-3 whitespace-nowrap">
              <a
                :href="getFullShortUrl(item.short_code)"
                target="_blank"
                rel="noopener noreferrer"
                class="text-sm text-blue-600 hover:underline font-medium"
              >
                {{ getFullShortUrl(item.short_code) }}
              </a>
            </td>
            <td class="px-4 py-3 whitespace-nowrap text-center">
              <span class="text-sm font-medium text-gray-900">{{
                item.visit_count
              }}</span>
            </td>
            <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
              {{ formatDate(item.created_at) }}
            </td>
            <td class="px-4 py-3 whitespace-nowrap text-center">
              <button
                @click="openQrModal(getFullShortUrl(item.short_code))"
                title="Show QR Code"
                class="px-2 py-1 text-xs bg-indigo-500 text-white rounded hover:bg-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-400 transition duration-150 ease-in-out"
              >
                Show QR
              </button>
            </td>
            <td
              class="px-4 py-3 whitespace-nowrap text-center text-sm font-medium"
            >
              <button
                @click="handleDelete(item.id)"
                title="Delete URL"
                class="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 focus:outline-none focus:ring-1 focus:ring-red-400 transition duration-150 ease-in-out"
              >
                Delete
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <QrCodeModal
      v-if="showQrModal"
      :url="qrCodeUrl"
      :size="200"
      @close="showQrModal = false"
    />
  </div>
</template>

<script setup>
// Added computed
import { ref, onMounted, watch, computed } from "vue";
// Removed axios import - store handles it
import { useAuthStore } from "../stores/auth";
import { useUrlStore } from "../stores/url"; // <-- Import the URL store
import QrCodeModal from "./QrCodeModal.vue";

const authStore = useAuthStore();
const urlStore = useUrlStore(); // <-- Get URL store instance

// --- Removed local state for history, isLoading, error ---
// const history = ref([]);
// const isLoading = ref(false);
// const error = ref(null);

// --- Local state only for QR Modal ---
const showQrModal = ref(false);
const qrCodeUrl = ref("");

// --- Debugging Computed Property ---
const historyForLoop = computed(() => {
  // This log runs whenever Vue re-evaluates dependencies for the template's v-for
  console.log(
    `>>> STEP 4: HistoryList computed running. Store history length: ${
      urlStore.history?.length ?? "undefined"
    }`
  );
  // Return the history array from the store
  return urlStore.history;
});
// --- End Debugging Computed Property ---

// --- Removed local fetchHistory function ---
// const fetchHistory = async () => { ... }

// --- Methods ---

// Helper functions remain the same
const getFullShortUrl = (shortCode) => {
  const redirectBase =
    import.meta.env.VITE_APP_BASE_REDIRECT_URL || "http://localhost:3000";
  return `${redirectBase.replace(/\/$/, "")}/${shortCode}`;
};
const formatDate = (dateString) => {
  if (!dateString) return "";
  const options = {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  };
  try {
    return new Date(dateString).toLocaleDateString(undefined, options);
  } catch (e) {
    return dateString;
  }
};
const truncateUrl = (url, maxLength = 50) => {
  if (!url || url.length <= maxLength) return url;
  return url.substring(0, maxLength) + "...";
};
const openQrModal = (url) => {
  if (url && typeof url === "string") {
    qrCodeUrl.value = url;
    showQrModal.value = true;
  } else {
    console.error(
      "Cannot open QR modal: Invalid or no URL provided for history item"
    );
    // Potentially set a user-visible error, but avoid using the removed local 'error' ref
  }
};

// --- **** ADD DELETE HANDLER **** ---
const handleDelete = async (urlId) => {
  if (!urlId) return;

  // Confirm before deleting
  if (!confirm("Are you sure you want to permanently delete this short URL?")) {
    return;
  }

  console.log(`Attempting to delete URL ID: ${urlId}`);
  try {
    // Call the backend DELETE endpoint
    await apiClient.delete(`/urls/${urlId}`); // Use the configured apiClient

    console.log(`Successfully requested deletion for URL ID: ${urlId}`);

    // Refresh the history list to show the item removed
    // Calling the store action is the easiest way
    await urlStore.fetchHistory();
  } catch (err) {
    console.error(`Error deleting URL ID ${urlId}:`, err);
    // Display error to user (could use a toast notification or set an error ref)
    const errorMessage =
      err.response?.data?.error ||
      "Failed to delete the URL. Please try again.";
    alert(`Error: ${errorMessage}`); // Simple alert for now
    // Optionally check if error was 401 and trigger logout?
    // if (err.response?.status === 401) { authStore.logout(); router.push('/login'); }
  }
};

// --- Lifecycle Hooks & Watchers ---

// Use urlStore.fetchHistory
onMounted(() => {
  if (authStore.initialCheckDone) {
    urlStore.fetchHistory(); // Use store action
  } else {
    const unwatch = watch(
      () => authStore.initialCheckDone,
      (isDone) => {
        if (isDone) {
          urlStore.fetchHistory(); // Use store action
          unwatch();
        }
      }
    );
  }
});

// Use urlStore.fetchHistory
watch(
  () => authStore.isLoggedIn,
  (loggedIn) => {
    // Fetch history via store action on login/logout
    // The store action itself handles clearing history if logged out
    urlStore.fetchHistory();
  }
);
</script>

<style scoped>
/* Scoped styles if needed */
</style>
