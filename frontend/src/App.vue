<template>
  <div id="app" class="container mx-auto px-4 py-8">
    <header class="text-center mb-12">
      <h1 class="text-4xl font-bold text-gray-800">My Short URL Service</h1>
       </header>
    <main>
      <UrlShortener />
      </main>
  </div>
</template>

<script setup>
import UrlShortener from './components/UrlShortener.vue';
</script>
