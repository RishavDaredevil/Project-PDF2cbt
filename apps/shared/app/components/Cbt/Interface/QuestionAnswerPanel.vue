<template>
  <div class="flex flex-col p-4 bg-white border-t-2 border-slate-300 h-full overflow-y-auto">
     <div class="flex items-center justify-between mb-4">
        <span class="text-lg font-bold">
            Q.{{ currentQuestion?.que || currentTestState.queId }}
            <span class="text-sm font-normal text-gray-500 ml-2">({{ currentQuestion?.type.toUpperCase() }})</span>
        </span>
     </div>

     <div v-if="currentQuestion" class="flex flex-col">
        <CbtInterfaceAnswerOptionsDiv
            v-if="currentQuestion.type === 'mcq' || currentQuestion.type === 'msq'"
            :model-value="currentAnswer"
            :question-type="currentQuestion.type"
            :total-options="currentQuestion.answerOptions || '4'"
            :answer-options-counter-type="getCounterType(currentQuestion)"
            @update:model-value="setAnswer"
        />
        <CbtInterfaceMsmAnswerOptionsDiv
            v-else-if="currentQuestion.type === 'msm'"
            :model-value="getMsmAnswer(currentQuestion)"
            :question-type="currentQuestion.type"
            :total-options="currentQuestion.answerOptions || '4'"
            :answer-options-counter-type="getCounterType(currentQuestion)"
            @answer-changed="setAnswer"
        />
        <CbtInterfaceAnswerNumericDiv
            v-else-if="currentQuestion.type === 'nat'"
            :model-value="getNatAnswer(currentQuestion)"
            :current-que-id="currentQuestion.queId"
            :question-type="currentQuestion.type"
            :last-logged-answer="lastLoggedAnswer"
            @update:model-value="setAnswer"
        />
     </div>
  </div>
</template>

<script setup lang="ts">
import utilRange from '#layers/shared/app/utils/utilRange'

const props = defineProps<{
    cropperSectionsData: CropperSectionsData
}>()

const { testQuestionsData, currentTestState, lastLoggedAnswer } = useCbtTestData()

const currentQuestion = computed(() => {
    return testQuestionsData.value.get(currentTestState.value.queId)
})

const currentAnswer = computed(() => {
    const q = currentQuestion.value
    if (!q) return ''
    if (q.type === 'mcq') return q.answer ?? ''
    if (q.type === 'msq') return q.answer ?? []
    return ''
})

const getCounterType = (question: TestSessionQuestionData) => {
    return props.cropperSectionsData[question.section]?.[question.que]?.answerOptionsCounterType
}

const getNatAnswer = (question: TestSessionQuestionData) => {
    return (question.answer ?? '') as string
}

const getMsmAnswer = (question: TestSessionQuestionData) => {
     const buffAnswer = question.answer
      if (buffAnswer)
        return buffAnswer as QuestionMsmAnswerType

      return getNewMsmAnswerObject(question.answerOptions || '4')
}

function getNewMsmAnswerObject(answerOption: string) {
  const rows = parseInt(answerOption || '4')
  const answerObj: QuestionMsmAnswerType = {}
  utilRange(1, rows + 1).forEach(r => answerObj[r] = [])
  return answerObj
}

const setAnswer = (val: any) => {
    const question = currentQuestion.value
    if(!question) return

    let newAnswer = val
    if (question.type === 'msq') {
        if (!Array.isArray(val) || val.length === 0) newAnswer = null
    } else if (val === '') {
        newAnswer = null
    }
    
    question.answer = newAnswer
    
    if (newAnswer !== null) {
        question.status = 'answered'
    } else if (question.status === 'answered') {
        question.status = 'notAnswered'
    }
}
</script>
