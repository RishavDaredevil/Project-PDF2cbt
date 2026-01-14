<template>
  <div class="flex flex-col h-full w-full relative">
    <!-- Zoom Controls Overlay -->
    <div class="absolute top-4 right-6 z-10 flex gap-2 items-center bg-white/90 p-1.5 rounded shadow border border-gray-300">
      <BaseButton
        variant="ghost"
        size="icon"
        icon-name="mdi:minus"
        :disabled="scale <= 0.5"
        @click="scale = Math.max(0.5, scale - 0.25)"
      />
      <span class="text-sm font-medium min-w-[3ch] text-center">{{ Math.round(scale * 100) }}%</span>
      <BaseButton
        variant="ghost"
        size="icon"
        icon-name="mdi:plus"
        :disabled="scale >= 3"
        @click="scale = Math.min(3, scale + 0.25)"
      />
    </div>

    <UiScrollArea class="h-full w-full" type="auto">
      <div class="flex flex-col items-center gap-4 py-4 min-h-full bg-gray-100">
        <div v-if="loading" class="flex flex-col items-center justify-center mt-20 gap-2">
            <Icon name="line-md:loading-twotone-loop" class="text-4xl text-primary" />
            <span class="text-gray-500">Loading Question Paper...</span>
        </div>
        <div v-else-if="errorMessage" class="flex flex-col items-center justify-center mt-20 gap-2 text-red-500">
             <Icon name="mdi:alert-circle" class="text-4xl" />
             <span>{{ errorMessage }}</span>
        </div>
        <div v-else-if="pages.length === 0" class="flex flex-col items-center justify-center mt-20 gap-2 text-gray-500">
             <Icon name="mdi:file-document-outline" class="text-4xl" />
             <span>No pages to display</span>
        </div>
        <template v-else>
            <div
                v-for="page in pages"
                :key="page.pageNum"
                class="bg-white shadow-md relative"
                :style="{
                    width: `${page.width * scale}px`,
                    height: `${page.height * scale}px`
                }"
            >
                <img
                    v-if="page.url"
                    :src="page.url"
                    class="w-full h-full object-contain"
                    loading="lazy"
                />
                <div v-else class="w-full h-full flex items-center justify-center text-gray-300">
                     Loading Page {{ page.pageNum }}...
                </div>
            </div>
        </template>
      </div>
    </UiScrollArea>
  </div>
</template>

<script setup lang="ts">
import { wrap as comlinkWrap } from 'comlink'
import type { MuPdfProcessor } from '#layers/shared/app/src/worker/mupdf.worker'
import mupdfWorkerFile from '#layers/shared/app/src/worker/mupdf.worker?worker'

const props = defineProps<{
  pdfFile: Uint8Array | null
}>()

const scale = ref(1.0)
const loading = ref(false)
const errorMessage = ref('')
const pages = reactive<{pageNum: number, width: number, height: number, url?: string}[]>([])

let mupdfWorker: ReturnType<typeof comlinkWrap<MuPdfProcessor>> | null = null
const { pixelRatio: devicePixelRatio } = useDevicePixelRatio()

watch(() => props.pdfFile, async (file) => {
    if (file && file.length > 0) {
        await initPdf(file)
    } else {
        pages.length = 0
        errorMessage.value = ''
        loading.value = false
    }
}, { immediate: true })

const initPdf = async (file: Uint8Array) => {
    loading.value = true
    errorMessage.value = ''
    pages.length = 0 
    
    mupdfWorker?.close()
    
    try {
        mupdfWorker = comlinkWrap<MuPdfProcessor>(new mupdfWorkerFile())
    } catch (e) {
        console.error('Failed to initialize worker:', e)
        errorMessage.value = 'Failed to initialize PDF worker.'
        loading.value = false
        return
    }
    
    const config = useRuntimeConfig()
    const isBuildForWebsite = config.public.isBuildForWebsite
    const preferLocal = isBuildForWebsite !== 'true' && isBuildForWebsite !== true

    const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout loading PDF')), 15000))

    try {
        const pagesCount = await Promise.race([
             mupdfWorker.loadPdf(file, preferLocal, true),
             timeout
        ]) as number
        
        if (pagesCount) {
             const dims = await mupdfWorker.getAllPagesDimensionsData()
             
             for(let i=1; i<=pagesCount; i++) {
                 pages.push({
                     pageNum: i,
                     width: dims[i].width,
                     height: dims[i].height
                 })
             }
             
             renderPages()
        } else {
             errorMessage.value = 'No pages found in PDF.'
        }
    } catch (e) {
        console.error("Failed to load PDF", e)
        errorMessage.value = 'Error loading PDF. Please try again.'
    } finally {
        loading.value = false
    }
}

watchDebounced(scale, () => {
    renderPages()
}, { debounce: 300 })

const renderPages = async () => {
    if (!mupdfWorker) return
    
    const dpr = devicePixelRatio.value || 1
    const currentScale = scale.value * dpr
    
    for (const page of pages) {
        try {
            if (page.url) URL.revokeObjectURL(page.url)
            
            const blob = await mupdfWorker.getPageImage(page.pageNum, currentScale)
            page.url = URL.createObjectURL(blob)
        } catch (e) {
            console.error(`Error rendering page ${page.pageNum}`, e)
        }
    }
}

onBeforeUnmount(() => {
    pages.forEach(p => {
        if(p.url) URL.revokeObjectURL(p.url)
    })
    mupdfWorker?.close()
})
</script>
