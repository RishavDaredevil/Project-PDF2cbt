<template>
  <UiScrollArea
    ref="scrollAreaRef"
    class="grow h-full group"
    type="auto"
    viewport-class="grow h-full w-full [&>div]:flex [&>div]:w-full [&>div]:pl-3 [&>div]:pt-1.5"
    scroll-bar-class="w-3"
  >
    <div
      ref="imageContainerElem"
      class="flex flex-col pb-12 grow gap-12"
    >
      <div
        v-for="question in questionsInSection"
        :key="question.queId"
        :id="`question-${question.queId}`"
        class="flex flex-col question-block"
        :data-que-id="question.queId"
      >
        <div class="flex items-center gap-2 mb-2 border-b pb-1">
             <span class="font-bold text-lg">Q.{{ question.que }}</span>
             <span class="text-xs text-gray-500">({{ question.type.toUpperCase() }})</span>
        </div>

        <img
            v-for="(url, index) in getQuestionImgUrls(question.queId)"
            :key="`${question.queId}-${index}`"
            :src="url"
            draggable="false"
            :style="{
            width: getQuestionImgWidth(question.queId, index) + 'px',
            objectFit: 'contain',
            }"
            class="mb-4"
            @load="(e) => handleImageLoad(e, question.queId, index)"
        >

        <CbtInterfaceAnswerOptionsDiv
            v-show="question.type === 'mcq' || question.type === 'msq'"
            :model-value="getAnswer(question)"
            :question-type="question.type"
            :total-options="question.answerOptions || '4'"
            :answer-options-counter-type="getCounterType(question)"
            class="ml-5 mt-1"
            @update:model-value="(val) => setAnswer(question, val)"
        />
        <CbtInterfaceMsmAnswerOptionsDiv
            v-show="question.type === 'msm'"
            :model-value="getMsmAnswer(question)"
            :question-type="question.type"
            :total-options="question.answerOptions || '4'"
            :answer-options-counter-type="getCounterType(question)"
            class="ml-5 mt-1"
            @answer-changed="(val) => setAnswer(question, val)"
        />
        <CbtInterfaceAnswerNumericDiv
            v-show="question.type === 'nat'"
            :model-value="getNatAnswer(question)"
            :current-que-id="question.queId"
            :question-type="question.type"
            :last-logged-answer="lastLoggedAnswer"
            class="ml-5 mt-2"
            @update:model-value="(val) => setAnswer(question, val)"
        />
      </div>
    </div>
    <div
      v-if="uiSettings.mainLayout.showScrollToTopAndBottomBtns"
      class="flex flex-col justify-between shrink-0 w-[2.2rem] mr-3 pb-7 fixed right-4 bottom-20 z-50"
    >
      <Icon
        name="mdi:arrow-down-circle"
        class="text-blue-600 bg-white hover:cursor-pointer shadow-lg rounded-full"
        size="2.2rem"
        @click="handleScrollToBtns('bottom')"
      />
      <Icon
        name="mdi:arrow-up-circle"
        class="text-blue-600 bg-white hover:cursor-pointer shadow-lg rounded-full"
        size="2.2rem"
        @click="handleScrollToBtns('top')"
      />
    </div>
  </UiScrollArea>
</template>

<script lang="ts" setup>
type QuestionsImgWidths = {
  [questionNum: string | number]: {
    [imageIndex: number | string]: number
  }
}

const props = defineProps<{
  isQuestionPalleteCollapsed: boolean
  cropperSectionsData: CropperSectionsData
}>()

const scrollAreaRef = useTemplateRef('scrollAreaRef')
const imageContainerElem = useTemplateRef('imageContainerElem')
const { width: containerWidth } = useElementSize(imageContainerElem)

const { testQuestionsData, currentTestState, testQuestionsUrls, lastLoggedAnswer, testSectionsData } = useCbtTestData()
const { uiSettings } = useCbtSettings()

const questionsImgWidths = reactive<QuestionsImgWidths>({})

// Get all questions in current section, sorted by sequence
const questionsInSection = computed(() => {
    const sectionData = testSectionsData.value[currentTestState.value.section] || {}
    return Object.values(sectionData).sort((a, b) => a.secQueId - b.secQueId)
})

const questionImgMaxSize = computed(() => {
  if (props.isQuestionPalleteCollapsed) {
    return uiSettings.value.questionPanel.questionImgMaxWidth.maxWidthWhenQuestionPaletteClosed
  }
  else {
    return uiSettings.value.questionPanel.questionImgMaxWidth.maxWidthWhenQuestionPaletteOpened
  }
})

const getQuestionImgUrls = (queId: number) => {
  const questionImgs = testQuestionsUrls.value?.[queId]
  return questionImgs || []
}

const getQuestionImgWidth = (queId: number, index: number | string) => {
  const containerW = containerWidth.value
  const maxPercent = questionImgMaxSize.value
  const queImgsWidths = questionsImgWidths[queId]

  if (!queImgsWidths || containerW === 0) {
    return undefined // let it be natural or max-width
  }

  const w = queImgsWidths[index]
  if (!w) return undefined

  // Calculate scaling
  // We need the max width of ANY image in this question to scale them uniformly?
  // Or scale individually? The original code calculated global scale based on maxOriginalWidth.
  const maxOriginalWidth = Math.max(...Object.values(queImgsWidths))
  const maxAllowedWidth = (containerW * maxPercent) / 100
  const globalScale = maxAllowedWidth / maxOriginalWidth

  return Math.floor(w * globalScale)
}

const handleImageLoad = (e: Event, queId: string | number, imgindex: number | string) => {
  const img = e.target as HTMLImageElement | null
  if (img) {
     questionsImgWidths[queId] ??= {}
     questionsImgWidths[queId]![imgindex] = img.naturalWidth || 0
  }
}

// Helpers for Answer Options
const getCounterType = (question: TestSessionQuestionData) => {
    return props.cropperSectionsData[question.section]?.[question.que]?.answerOptionsCounterType
}

const getAnswer = (question: TestSessionQuestionData) => {
    if (question.type === 'mcq') return question.answer ?? ''
    if (question.type === 'msq') return question.answer ?? []
    return ''
}

const getMsmAnswer = (question: TestSessionQuestionData) => {
    // Need logic to parse MSM answer buffer
    // For now assuming it matches the type expected by component
     const buffAnswer = question.answer
      if (buffAnswer)
        return buffAnswer as QuestionMsmAnswerType

      return getNewMsmAnswerObject(question.answerOptions || '4')
}

const getNatAnswer = (question: TestSessionQuestionData) => {
    return (question.answer ?? '') as string
}

const testLogger = useCbtLogger()

const setAnswer = (question: TestSessionQuestionData, val: any) => {
    // We update the question data directly?
    // Usually we update currentTestState.currentAnswerBuffer.
    // But now we have multiple questions visible.
    // We should probably update the question data directly AND update currentTestState if it's the "active" question.

    // Actually, `changeCurrentQuestion` and `saveCurrentAnswer` in interface.vue handle saving.
    // But here we are binding directly to the inputs.
    // We should update the `question.answer` (ref to object in map).

    // Wait, the original code used `currentTestState.currentAnswerBuffer`.
    // If we want "Instant Exam" feel, we probably want auto-save on change?

    // Let's update the question.answer directly.
    // And also log it.

    // Handling specific types
    let newAnswer = val
    if (question.type === 'msq') {
        if (!Array.isArray(val) || val.length === 0) newAnswer = null
    } else if (val === '') {
        newAnswer = null
    }

    const prevAnswer = question.answer
    const prevStatus = question.status

    question.answer = newAnswer

    // Update status
    if (newAnswer !== null) {
        question.status = 'answered'
    } else if (question.status === 'answered') {
        question.status = 'notAnswered'
    }

    // Log
    // testLogger.currentAnswer(newAnswer) // This logs for "current" question.
    // We might need to set this question as current first?

    if (currentTestState.value.queId !== question.queId) {
        currentTestState.value.queId = question.queId
        currentTestState.value.question = question.que
        // currentTestState.value.section = question.section // Should be same
    }
}

function getNewMsmAnswerObject(answerOption: string) {
  const rows = parseInt(answerOption || '4')
  const answerObj: QuestionMsmAnswerType = {}
  utilRange(1, rows + 1).forEach(r => answerObj[r] = [])
  return answerObj
}

const handleScrollToBtns = (dir: 'top' | 'bottom') => {
  scrollAreaRef.value?.viewport?.scrollTo({
    top: dir === 'bottom'
      ? scrollAreaRef.value.viewport.scrollHeight
      : 0,
    behavior: 'smooth',
  })
}

// Intersection Observer to track active question
let observer: IntersectionObserver | null = null

onMounted(() => {
    const options = {
        root: scrollAreaRef.value?.$el || null, // ScrollArea root?
        // UiScrollArea renders a div with class 'viewport'. We need that.
        // scrollAreaRef.value.viewport is the element.
        rootMargin: '-50% 0px -50% 0px', // Trigger when element is in middle
        threshold: 0
    }

    observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const queId = parseInt(entry.target.getAttribute('data-que-id') || '0')
                if (queId && queId !== currentTestState.value.queId) {
                     currentTestState.value.queId = queId
                     const q = testQuestionsData.value.get(queId)
                     if (q) {
                         currentTestState.value.question = q.que
                     }
                }
            }
        })
    }, options)

    // Observe elements
    // We need to wait for DOM update
    watch(questionsInSection, () => {
        nextTick(() => {
            document.querySelectorAll('.question-block').forEach(el => observer?.observe(el))
        })
    }, { immediate: true })
})

onUnmounted(() => {
    observer?.disconnect()
})

// Scroll to top when section changes
watch(
  () => currentTestState.value.section,
  () => scrollAreaRef.value?.viewport?.scrollTo({ top: 0, behavior: 'instant' }),
)
</script>
