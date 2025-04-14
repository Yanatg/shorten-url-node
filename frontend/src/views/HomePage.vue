// frontend/src/views/HomePage.vue (Ensure this part is present)
<template>
  <div>
    <UrlShortener />
    <HistoryList v-if="authStore.isLoggedIn && authStore.initialCheckDone" class="mt-12"/>
  </div>
</template>

<script setup>
import UrlShortener from '../components/UrlShortener.vue';
import HistoryList from '../components/HistoryList.vue'; // Make sure import is correct
import { useAuthStore } from '../stores/auth';

const authStore = useAuthStore();
</script>