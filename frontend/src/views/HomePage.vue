// frontend/src/views/HomePage.vue (Ensure this part is present)
<template>
  <div>
    <UrlShortener />
    <HistoryList v-if="authStore.isLoggedIn && authStore.initialCheckDone" class="mt-12"/>
    <HistoryList v-if="authStore.isLoggedIn && authStore.initialCheckDone"/>

    <div v-else-if="!authStore.isLoggedIn && authStore.initialCheckDone" class="text-center mt-12 p-6 bg-blue-50 border border-blue-200 rounded-lg">
        <p class="text-gray-600">
            <router-link :to="{ name: 'Login' }" class="text-blue-600 font-semibold hover:underline">Log in</router-link> or
            <router-link :to="{ name: 'Register' }" class="text-green-600 font-semibold hover:underline">Register</router-link>
            to save and view your URL history.
        </p>
    </div>
  </div>
</template>

<script setup>
import UrlShortener from '../components/UrlShortener.vue';
import HistoryList from '../components/HistoryList.vue';
import { useAuthStore } from '../stores/auth';

const authStore = useAuthStore();
</script>