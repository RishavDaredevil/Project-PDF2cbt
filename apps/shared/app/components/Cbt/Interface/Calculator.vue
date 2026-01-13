<template>
  <div
    ref="calculatorRef"
    class="fixed top-20 left-20 z-[9999] bg-white border-2 border-slate-600 rounded-lg shadow-2xl w-80 select-none flex flex-col"
    style="touch-action: none;"
  >
    <!-- Header -->
    <div
      ref="dragHandleRef"
      class="bg-slate-200 p-2 flex justify-between items-center cursor-move border-b border-slate-300"
    >
      <span class="font-bold text-slate-700 ml-2">Calculator</span>
      <button
        class="text-slate-500 hover:text-red-500 p-1"
        @click="$emit('close')"
      >
        <Icon name="mdi:close" size="1.2rem" />
      </button>
    </div>

    <!-- Display -->
    <div class="p-3 bg-slate-50">
      <input
        v-model="display"
        readonly
        class="w-full h-12 text-right text-2xl font-mono p-2 border border-slate-300 rounded bg-white"
      />
    </div>

    <!-- Keypad -->
    <div class="grid grid-cols-4 gap-2 p-3 bg-slate-100">
      <button v-for="btn in buttons" :key="btn"
        class="h-10 rounded border shadow-sm font-semibold transition-colors"
        :class="getBtnClass(btn)"
        @click="handleInput(btn)"
      >
        {{ btn }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
const emit = defineEmits<{
  close: []
}>()

const calculatorRef = useTemplateRef('calculatorRef')
const dragHandleRef = useTemplateRef('dragHandleRef')

// Simple Draggable Logic
const { x, y } = useDraggable(calculatorRef, {
  initialValue: { x: 100, y: 100 },
  handle: dragHandleRef,
})

const display = ref('0')
const lastIsOperator = ref(false)

const buttons = [
  'C', '(', ')', '/',
  '7', '8', '9', '*',
  '4', '5', '6', '-',
  '1', '2', '3', '+',
  '0', '.', 'sqrt', '='
]

const getBtnClass = (btn: string) => {
  if (['/', '*', '-', '+', '='].includes(btn)) return 'bg-blue-100 hover:bg-blue-200 text-blue-800 border-blue-200'
  if (btn === 'C') return 'bg-red-100 hover:bg-red-200 text-red-800 border-red-200'
  return 'bg-white hover:bg-slate-50 border-slate-200'
}

const handleInput = (btn: string) => {
  if (btn === 'C') {
    display.value = '0'
    lastIsOperator.value = false
  } else if (btn === '=') {
    try {
      // Safe eval (simple replacement)
      let expr = display.value
      // Handle sqrt?
      // Simple implementation: replace sqrt(x) is hard without parser.
      // Assuming 'sqrt' works on current number?
      // Let's keep it simple: JS eval.
      // Replace 'sqrt' with 'Math.sqrt' but that requires proper syntax.
      // Let's just remove sqrt from buttons if complex, or handle it simply.

      // Basic Eval
      // eslint-disable-next-line no-new-func
      display.value = String(new Function('return ' + expr)())
    } catch {
      display.value = 'Error'
    }
  } else if (btn === 'sqrt') {
      try {
          display.value = String(Math.sqrt(parseFloat(display.value)))
      } catch {
          display.value = 'Error'
      }
  } else {
    if (display.value === '0' || display.value === 'Error') {
      display.value = btn
    } else {
      display.value += btn
    }
  }
}
</script>
