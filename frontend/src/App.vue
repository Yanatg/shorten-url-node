<template>
  <div id="app" class="min-w-[1122px] container mx-auto px-4 py-8 min-h-screen flex flex-col">

    <header class="mb-10 border-b border-gray-200 pb-4">
      <nav class="flex flex-wrap items-center justify-between gap-4">
        <router-link :to="{ name: 'Home' }" class="flex-shrink-0">
          <h1 class="text-3xl sm:text-4xl font-bold text-gray-800 inline-block hover:text-blue-700 transition-colors">
            Short URL Service
          </h1>
        </router-link>

        <div class="text-sm flex-shrink-0">
          <div v-if="authStore.initialCheckDone" class="flex items-center gap-3">
            <div v-if="authStore.isLoggedIn" class="flex items-center gap-3">
              <span class="text-gray-600 hidden sm:inline">Welcome, {{ authStore.user?.email }}</span>
               <span class="text-gray-600 sm:hidden">Hi, {{ authStore.user?.email?.split('@')[0] }}</span> <button
                @click="handleLogout"
                class="px-3 py-1.5 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition-colors"
              >
                Logout
              </button>
            </div>
            <div v-else class="flex items-center gap-2">
              <router-link
                :to="{ name: 'Login' }"
                class="px-3 py-1.5 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
              >
                Login
              </router-link>
              <router-link
                :to="{ name: 'Register' }"
                class="px-3 py-1.5 bg-green-500 text-white text-xs rounded hover:bg-green-600 transition-colors"
              >
                Register
              </router-link>
            </div>
          </div>
          <div v-else class="text-gray-400">
            Loading...
          </div>
        </div>
      </nav>
    </header>
    <main class="flex-grow">
      <router-view />
    </main>
  </div>
</template>

<script setup>
// --- Keep the existing script setup section ---
import { onMounted } from 'vue';
import { useAuthStore } from './stores/auth';
import { useRouter } from 'vue-router';

const authStore = useAuthStore();
const router = useRouter();

onMounted(() => {
  if (!authStore.initialCheckDone) {
     authStore.checkAuthStatus();
  }
});

const handleLogout = async () => {
  await authStore.logout();
  router.push({ name: 'Home' });
};
</script>
