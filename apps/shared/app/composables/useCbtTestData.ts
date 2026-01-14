import { CbtUseState } from '#layers/shared/shared/enums'
import type { ParsedInstantExamData } from '#layers/shared/app/utils/utilParseInstantExam'

const sectionsPrevQuestion: Record<string, number> = {}

const getTestDummyData = () => {
  let questionNum = 1
  const testSectionsdummyData: TestSessionSectionsData = {}
  const testQuestionsDummyData: Map<number, TestSessionQuestionData> = new Map()

  for (const subjectNum of utilRange(1, 4)) {
    const subject = 'Subject' + subjectNum

    for (const sectionNum of utilRange(1, 3)) {
      const section = `${subject} Section ${sectionNum}`

      testSectionsdummyData[section] = {}
      const questionsRange = sectionNum === 1 ? 20 : 5
      const recentQuestion = questionNum
      sectionsPrevQuestion[section] = recentQuestion

      for (const secQueId of utilRange(1, questionsRange + 1)) {
        const questionData: TestSessionQuestionData = {
          secQueId,
          queId: questionNum,
          que: questionNum,
          section,
          type: sectionNum === 1 ? 'mcq' : 'nat',
          answerOptions: '4',
          answer: null,
          status: 'notVisited',
          timeSpent: 0,
        }

        testSectionsdummyData[section][questionNum] = questionData
        testQuestionsDummyData.set(questionNum, questionData)
        questionNum++
      }

      if (subjectNum === 1 && sectionNum === 1) {
        testSectionsdummyData[section][recentQuestion]!.status = 'notAnswered'
      }
    }
  }

  const statusArray: QuestionStatus[] = ['answered', 'notAnswered', 'marked', 'markedAnswered']
  const dummyStatusArray = [...statusArray, ...statusArray] // Duplicate the statuses

  for (const status of dummyStatusArray) {
    const randomQuestion = 1 + Math.max(1, Math.floor(Math.random() * 20)) // random from 2 to 20

    if (testSectionsdummyData['Subject1 Section 1']) {
      testSectionsdummyData['Subject1 Section 1'][randomQuestion]!.status = status
    }
  }

  return { testSectionsdummyData, testQuestionsDummyData }
}

const { testQuestionsDummyData, testSectionsdummyData } = getTestDummyData()

export default () => {
  const testSectionsList = useState<TestSectionListItem[]>(
    CbtUseState.TestSectionsList,
    () => {
      const dummyData = []
      for (const subjectNum of utilRange(1, 4)) {
        const subject = 'Subject' + subjectNum

        for (const sectionNum of utilRange(1, 3)) {
          const name = subject + ' Section ' + sectionNum
          const sectionsItem: TestSectionListItem = { name, subject, id: 0 }

          dummyData.push(sectionsItem)
        }
      }
      dummyData.forEach((item, idx) => item.id = idx + 1)
      return dummyData
    },
  )

  const cropperSectionsData = useState<CropperSectionsData>(
    CbtUseState.CropperSectionsData,
    () => {
      let questionNum = 1
      const dummyData: CropperSectionsData = {}
      for (const subjectNum of utilRange(1, 4)) {
        const subject = 'Subject' + subjectNum

        for (const sectionNum of utilRange(1, 3)) {
          const section = subject + ' Section ' + sectionNum
          dummyData[section] = {}
          const questionsRange = sectionNum === 1 ? 20 : 5

          for (const _ of utilRange(1, questionsRange + 1)) {
            dummyData[section][questionNum] = {
              que: questionNum,
              type: sectionNum === 1 ? 'mcq' : 'nat',
              marks: { cm: 4, im: -1 },
              pdfData: [
                { page: 1, x1: 0, y1: 0, x2: 0, y2: 0 },
              ],
            }

            questionNum++
          }
        }
      }

      return dummyData
    },
  )

  const testSectionsData = useState<TestSessionSectionsData>(
    CbtUseState.TestSectionsData,
    () => testSectionsdummyData,
  )

  const testQuestionsData = useState<Map<number, TestSessionQuestionData>>(
    CbtUseState.TestQuestionsData,
    () => testQuestionsDummyData,
  )

  const testSectionsSummary = useState<TestSectionsSummary>(
    CbtUseState.TestSectionsSummary,
    () => new Map(),
  )

  const currentTestState = useState<CurrentTestState>(
    CbtUseState.CurrentTestState,
    () => {
      return {
        section: 'Subject1 Section 1',
        question: 1,
        queId: 1,
        testDuration: 180 * 60,
        remainingSeconds: null,
        testName: 'Mock Test 1',
        currentQuestionStartTime: 180 * 60,
        testStatus: 'notStarted',
        currentAnswerBuffer: null,
        questionsNumberingOrderType: 'original',
        saveTestData: true,
        sectionsPrevQuestion: sectionsPrevQuestion,
      }
    },
  )

  const testQuestionsUrls = useState<QuestionsImageUrls>(
    CbtUseState.TestSectionsImgUrls,
    () => ({}),
  )

  const lastLoggedAnswer = useState<QuestionAnswer>(
    CbtUseState.LastLoggedAnswer,
    () => null,
  )

  const instantExamPdf = useState<File | null>('instantExamPdf', () => null)
  const instantExamData = useState<ParsedInstantExamData | null>('instantExamData', () => null)

  const initializeInstantTest = (parsedData: ParsedInstantExamData, pdfFile: File, examDetails: { name: string, duration: number }) => {
    instantExamPdf.value = pdfFile
    instantExamData.value = parsedData

    // 1. Sections List
    const newSectionsList: TestSectionListItem[] = []
    const sectionNames = Object.keys(parsedData.sections)
    sectionNames.forEach((name, idx) => {
         newSectionsList.push({ name, subject: name, id: idx + 1 })
    })
    testSectionsList.value = newSectionsList

    // 2. Data
    const newSectionsData: TestSessionSectionsData = {}
    const newQuestionsData: Map<number, TestSessionQuestionData> = new Map()
    const newCropperData: CropperSectionsData = {}
    const newSectionsPrevQuestion: Record<string, number> = {}

    let globalQueId = 1

    sectionNames.forEach(section => {
        newSectionsData[section] = {}
        newCropperData[section] = {}

        const questions = parsedData.sections[section]
        questions.sort((a, b) => a.queNo - b.queNo)

        if (questions.length > 0) {
             newSectionsPrevQuestion[section] = questions[0].queNo
        }

        questions.forEach(q => {
            const queNum = q.queNo

            // Cropper Data
            newCropperData[section][queNum] = {
                que: queNum,
                type: q.type,
                marks: q.marks,
                pdfData: [{ page: 1, x1: 0, y1: 0, x2: 0, y2: 0 }],
                answerOptions: '4', // Default
            }

            // Question Data
            const questionData: TestSessionQuestionData = {
                secQueId: queNum,
                queId: globalQueId,
                que: queNum,
                section,
                type: q.type,
                answerOptions: '4',
                answer: null,
                status: 'notVisited',
                timeSpent: 0
            }

            newSectionsData[section][queNum] = questionData
            newQuestionsData.set(globalQueId, questionData)
            globalQueId++
        })
    })

    testSectionsData.value = newSectionsData
    testQuestionsData.value = newQuestionsData
    cropperSectionsData.value = newCropperData

    // 3. Current Test State
    const firstSection = sectionNames[0] || ''
    const firstQuestion = newSectionsPrevQuestion[firstSection] || 1
    const firstQueId = newSectionsData[firstSection]?.[firstQuestion]?.queId || 1

    currentTestState.value = {
        section: firstSection,
        question: firstQuestion,
        queId: firstQueId,
        testName: examDetails.name,
        testDuration: examDetails.duration,
        remainingSeconds: null,
        currentQuestionStartTime: examDetails.duration,
        testStatus: 'notStarted',
        currentAnswerBuffer: null,
        questionsNumberingOrderType: 'original',
        saveTestData: true,
        sectionsPrevQuestion: newSectionsPrevQuestion
    }
  }

  return {
    testSectionsList,
    cropperSectionsData,
    currentTestState,
    testSectionsData,
    testQuestionsData,
    lastLoggedAnswer,
    testQuestionsUrls,
    testSectionsSummary,
    instantExamPdf,
    instantExamData,
    initializeInstantTest
  }
}
