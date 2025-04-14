<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60"
    @click.self="$emit('close')"
  >
    <div class="bg-white p-6 sm:p-8 rounded-lg shadow-xl max-w-xs w-full mx-4">
      <div class="flex justify-between items-center mb-4 sm:mb-6">
        <h3 class="text-xl font-semibold text-gray-800">Scan QR Code</h3>
        <button
          @click="$emit('close')"
          class="text-gray-500 hover:text-gray-800 text-2xl leading-none"
          aria-label="Close modal"
        >
          &times;
        </button>
      </div>

      <div class="flex justify-center">
        <qrcode-vue
          v-if="url"
          :value="url"
          :size="qrSize"
          level="H"
          render-as="svg"
        />
        <p v-else class="text-red-500 text-sm">
          Error: No URL provided for QR code.
        </p>
      </div>

      <p class="mt-4 text-center text-xs text-gray-500 break-all">{{ url }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import QrcodeVue from "qrcode.vue";

const props = defineProps({
  url: {
    type: String,
    required: true,
  },
  size: {
    type: Number,
    default: 200,
  },
});

const emit = defineEmits(["close"]);

const qrSize = computed(() => props.size);
</script>
