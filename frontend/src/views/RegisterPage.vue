<template>
  <div
    class="max-w-md mx-auto mt-10 p-8 bg-white rounded-lg shadow-xl border border-gray-200 text-start"
  >
    <h2 class="text-2xl font-semibold text-center mb-6 text-gray-700">
      Register New Account
    </h2>

    <form @submit.prevent="handleRegister">
      <div class="mb-4">
        <label
          for="register-email"
          class="block text-sm font-medium text-gray-600 mb-1"
          >Email</label
        >
        <input
          type="email"
          id="register-email"
          v-model="email"
          required
          class="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
          placeholder="you@example.com"
        />
      </div>

      <div class="mb-4">
        <label
          for="register-password"
          class="block text-sm font-medium text-gray-600 mb-1"
          >Password</label
        >
        <input
          type="password"
          id="register-password"
          v-model="password"
          required
          minlength="6"
          class="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
          placeholder="Minimum 6 characters"
        />
      </div>

      <div class="mb-6">
        <label
          for="register-confirm-password"
          class="block text-sm font-medium text-gray-600 mb-1"
          >Confirm Password</label
        >
        <input
          type="password"
          id="register-confirm-password"
          v-model="confirmPassword"
          required
          minlength="6"
          class="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
          placeholder="Re-enter password"
        />
      </div>

      <div
        v-if="error"
        class="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md text-sm"
        role="alert"
      >
        {{ error }}
      </div>

      <div
        v-if="successMessage"
        class="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-md text-sm"
        role="alert"
      >
        {{ successMessage }} Redirecting to login...
      </div>

      <button
        type="submit"
        :disabled="isLoading"
        class="w-full py-3 px-4 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-70 transition duration-150 ease-in-out"
      >
        <span v-if="isLoading">Registering...</span>
        <span v-else>Register</span>
      </button>
    </form>
    <p class="text-center mt-6 text-sm">
      Already have an account?
      <router-link :to="{ name: 'Login' }" class="text-blue-600 hover:underline"
        >Login here</router-link
      >
    </p>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth";

const router = useRouter();
const authStore = useAuthStore();

const email = ref("");
const password = ref("");
const confirmPassword = ref("");
const error = ref(null);
const successMessage = ref(null);
const isLoading = ref(false);

// Function to handle form submission
const handleRegister = async () => {
  isLoading.value = true;
  error.value = null;
  successMessage.value = null;

  if (password.value.length < 6) {
    error.value = "Password must be at least 6 characters long.";
    isLoading.value = false;
    return;
  }
  if (password.value !== confirmPassword.value) {
    error.value = "Passwords do not match.";
    isLoading.value = false;
    return;
  }

  const result = await authStore.register(email.value, password.value);

  isLoading.value = false;

  if (result.success) {
    successMessage.value = result.message || "Registration successful!";
    email.value = "";
    password.value = "";
    confirmPassword.value = "";

    setTimeout(() => {
      router.push({ name: "Login" });
    }, 2500);
  } else {
    error.value =
      result.error || "An unknown error occurred during registration.";
  }
};
</script>
