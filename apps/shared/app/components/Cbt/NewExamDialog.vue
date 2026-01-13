<template>
  <div>
    <slot>
      <BaseButton
        label="Make a New Exam For Me"
        size="lg"
        class="text-lg px-8 py-6 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 border-none text-white font-bold"
        icon-name="material-symbols:add-circle-outline-rounded"
        icon-size="1.8rem"
        @click="isOpen = true"
      />
    </slot>

    <UiDialog v-model:open="isOpen">
      <UiDialogContent class="sm:max-w-[500px]">
        <UiDialogHeader>
          <UiDialogTitle>Create Instant Exam</UiDialogTitle>
          <UiDialogDescription>
            Upload your question paper and answer key to start immediately.
          </UiDialogDescription>
        </UiDialogHeader>

        <div class="grid gap-6 py-4">
          <div class="grid gap-2">
            <label for="exam-name" class="text-sm font-medium">Exam Name</label>
            <input
              id="exam-name"
              v-model="examName"
              class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="My Instant Exam"
            />
          </div>

          <div class="grid gap-2">
            <label for="duration" class="text-sm font-medium">Duration (minutes)</label>
            <input
              id="duration"
              v-model="duration"
              type="number"
              min="1"
              class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <div class="grid gap-2">
            <label class="text-sm font-medium">Question Paper (PDF)</label>
            <BaseSimpleFileUpload
              accept=".pdf"
              label="Upload PDF"
              :variant="pdfFile ? 'default' : 'outline'"
              :icon-name="pdfFile ? 'material-symbols:check-circle-outline' : 'material-symbols:upload-file'"
              class="w-full justify-center"
              @upload="handlePdfUpload"
            />
            <p v-if="pdfFile" class="text-xs text-green-600 flex items-center gap-1">
              <Icon name="material-symbols:check" size="1rem" />
              {{ pdfFile.name }}
            </p>
          </div>

          <div class="grid gap-2">
            <label class="text-sm font-medium">Answer Key (CSV)</label>
            <BaseSimpleFileUpload
              accept=".csv"
              label="Upload CSV"
              :variant="csvFile ? 'default' : 'outline'"
              :icon-name="csvFile ? 'material-symbols:table-view' : 'material-symbols:upload-file'"
              class="w-full justify-center"
              @upload="handleCsvUpload"
            />
             <p v-if="csvFile" class="text-xs text-green-600 flex items-center gap-1">
              <Icon name="material-symbols:check" size="1rem" />
              {{ csvFile.name }}
            </p>
            <p class="text-xs text-muted-foreground mt-1">
              Headers: Section, Question No, Type, Key, Marks, Negative
            </p>
          </div>
        </div>

        <UiDialogFooter>
          <BaseButton
            label="Start Test"
            :disabled="!isValid"
            :loading="loading"
            class="w-full sm:w-auto"
            @click="startTest"
          />
        </UiDialogFooter>
      </UiDialogContent>
    </UiDialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
// Assuming auto-imports work for composables and utils
// import { utilParseInstantExam } from '~/utils/utilParseInstantExam'
// import { initializeInstantTest } from '~/composables/useCbtTestData'

const router = useRouter()
const isOpen = ref(false)
const loading = ref(false)

const examName = ref('')
const duration = ref(180)
const pdfFile = ref<File | null>(null)
const csvFile = ref<File | null>(null)

const isValid = computed(() => {
  return examName.value.trim() !== '' && duration.value > 0 && pdfFile.value && csvFile.value
})

const handlePdfUpload = (file: File) => {
  pdfFile.value = file
}

const handleCsvUpload = (file: File) => {
  csvFile.value = file
}

// Get composable
const { initializeInstantTest } = useCbtTestData()

const startTest = async () => {
  if (!isValid.value || !pdfFile.value || !csvFile.value) return

  loading.value = true
  try {
    const parsedData = await utilParseInstantExam(csvFile.value)

    // Initialize test data
    initializeInstantTest(parsedData, pdfFile.value, {
        name: examName.value,
        duration: duration.value * 60
    })

    isOpen.value = false
    await router.push('/cbt/interface')
  } catch (error) {
    console.error('Failed to start test:', error)
    // You might want to show a toast error here
    useNuxtApp().$toast.error('Failed to parse exam data', {
        description: error instanceof Error ? error.message : 'Unknown error'
    })
  } finally {
    loading.value = false
  }
}
</script>
