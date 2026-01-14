<template>
  <div
    class="flex flex-col grow min-h-0 py-8 overflow-auto border-t-2 justify-center items-center"
  >
    <h1 class="text-3xl font-bold text-center text-green-500 mb-4">
      Instant CBT Engine
    </h1>
    <p class="text-lg text-center text-muted-foreground mb-12 max-w-2xl px-4">
      Turn any PDF Question Paper into an interactive Computer Based Test instantly.
      Just upload your PDF and Answer Key CSV.
    </p>

    <CbtNewExamDialog />

    <div class="mt-16 text-sm text-gray-400">
      <p>Powered by PDF2CBT</p>
    </div>
  </div>
</template>

<script setup lang="ts">
useSeoMeta({
  title: 'Instant CBT - PDF2CBT',
})
</script>
