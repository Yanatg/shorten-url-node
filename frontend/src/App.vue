<template>
  <div id="app" class="container mx-auto px-4 py-8">
    <header class="text-center mb-12">
      <h1 class="text-4xl font-bold text-gray-800">My Short URL Service</h1>
       </header>
    <main>
      <UrlShortener />
      </main>
     <footer class="text-center mt-16 text-gray-500 text-sm">
        Short URL Service &copy; {{ new Date().getFullYear() }}
     </footer>
  </div>
</template>

<script setup>
import UrlShortener from './components/UrlShortener.vue';
// TODO: Import History component when created
</script>

<style>
/* Keep global non-Tailwind styles minimal, prefer Tailwind utilities */
/* Example: If you needed a specific font not easily handled by Tailwind config */
/* body { font-family: 'Your Custom Font', sans-serif; } */
</style>