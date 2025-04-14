<template>
    <div class="max-w-md mx-auto mt-10 p-8 bg-white rounded-lg shadow-xl border border-gray-200 text-start">
      <h2 class="text-2xl font-semibold text-center mb-6 text-gray-700">Login</h2>
  
      <form @submit.prevent="handleLogin">
        <div class="mb-4">
          <label for="login-email" class="block text-sm font-medium text-gray-600 mb-1">Email</label>
          <input
            type="email"
            id="login-email"
            v-model="email"
            required
            class="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            placeholder="you@example.com"
          />
        </div>
  
        <div class="mb-6">
          <label for="login-password" class="block text-sm font-medium text-gray-600 mb-1">Password</label>
          <input
            type="password"
            id="login-password"
            v-model="password"
            required
            class="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            placeholder="••••••••"
          />
        </div>
  
        <div v-if="error" class="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md text-sm" role="alert">
          {{ error }}
        </div>
  
        <button
          type="submit"
          :disabled="isLoading"
          class="w-full py-3 px-4 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-70 transition duration-150 ease-in-out"
        >
          <span v-if="isLoading">Logging in...</span>
          <span v-else>Login</span>
        </button>
      </form>
      <p class="text-center mt-6 text-sm">
        Don't have an account?
        <router-link :to="{ name: 'Register' }" class="text-blue-600 hover:underline">Register here</router-link>
      </p>
    </div>
  </template>
  
  <script setup>
  import { ref } from 'vue';
  import { useRouter } from 'vue-router';
  import { useAuthStore } from '../stores/auth';
  
  const router = useRouter();
  const authStore = useAuthStore();
  
  const email = ref('');
  const password = ref('');
  const error = ref(null);
  const isLoading = ref(false);

  const handleLogin = async () => {
    isLoading.value = true;
    error.value = null;
  
    const result = await authStore.login(email.value, password.value);
  
    isLoading.value = false;

    if (result.success) {
      router.push({ name: 'Home' });
    } else {
      error.value = result.error || 'An unknown error occurred during login.';
    }
  };
  </script>