export interface ParsedInstantExamQuestion {
  section: string
  queNo: number
  type: 'mcq' | 'msq' | 'nat'
  // Storing original key for now, composable will convert to internal format if needed
  // or I can do it here. Let's do it here.
  // MCQ: string (index '0', '1', etc)
  // MSQ: string[] (indices ['0', '1'])
  // NAT: { min: number, max: number }
  key: any
  marks: { cm: number, im: number, pm?: number }
}

export interface ParsedInstantExamData {
  sections: Record<string, ParsedInstantExamQuestion[]>
}

export const utilParseInstantExam = (file: File): Promise<ParsedInstantExamData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const text = e.target?.result as string
        if (!text) {
            reject(new Error('Empty file'))
            return
        }

        const lines = text.split(/\r?\n/).filter(line => line.trim() !== '')
        if (lines.length < 2) {
            reject(new Error('Invalid CSV format: Too few lines'))
            return
        }

        const headerLine = lines[0].toLowerCase()
        const headers = headerLine.split(',').map(h => h.trim())

        const requiredHeaders = ['section', 'question no', 'type', 'key', 'marks', 'negative']
        const headerIndices: Record<string, number> = {}

        for (const req of requiredHeaders) {
            const idx = headers.findIndex(h => h === req)
            if (idx === -1) {
                reject(new Error(`Missing header: ${req}`))
                return
            }
            headerIndices[req] = idx
        }

        const result: ParsedInstantExamData = { sections: {} }

        // Start from line 1 (skip header)
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i]
            const cols = line.split(',').map(c => c.trim())

            if (cols.length < requiredHeaders.length) continue // Skip incomplete lines

            const section = cols[headerIndices['section']]
            const queNo = parseInt(cols[headerIndices['question no']])
            const typeRaw = cols[headerIndices['type']].toUpperCase()
            const keyRaw = cols[headerIndices['key']]
            const marks = parseFloat(cols[headerIndices['marks']])
            const negative = parseFloat(cols[headerIndices['negative']])

            if (!section || isNaN(queNo) || !typeRaw) continue

            let type: 'mcq' | 'msq' | 'nat' = 'mcq' // default
            let key: any = null

            if (typeRaw === 'MCQ') {
                type = 'mcq'
                key = mapKeyToindex(keyRaw)
            } else if (typeRaw === 'MSQ') {
                type = 'msq'
                const keys = keyRaw.split(';')
                key = keys.map(k => mapKeyToindex(k)).filter(k => k !== null)
            } else if (typeRaw === 'NAT') {
                type = 'nat'
                if (keyRaw.includes(':')) {
                    const [min, max] = keyRaw.split(':').map(Number)
                    key = { min, max }
                } else {
                    const val = Number(keyRaw)
                    key = { min: val, max: val }
                }
            }

            // Ensure negative marks is treated correctly.
            // Usually 'Negative' column implies the value to deduct.
            // In system, 'im' (incorrect marks) is usually negative (e.g., -1).
            // If CSV says '1', it likely means deduct 1, so im = -1.
            const im = negative > 0 ? -negative : negative

            const question: ParsedInstantExamQuestion = {
                section,
                queNo,
                type,
                key,
                marks: { cm: marks, im, pm: 0 } // pm defaults to 0 for now
            }

            if (!result.sections[section]) {
                result.sections[section] = []
            }
            result.sections[section].push(question)
        }

        resolve(result)

      } catch (err) {
        reject(err)
      }
    }

    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsText(file)
  })
}

function mapKeyToindex(key: string): string | null {
    if (!key) return null
    // If it's a letter A-Z
    if (/^[A-Za-z]$/.test(key)) {
        return (key.toUpperCase().charCodeAt(0) - 65).toString()
    }
    // If it's a number 1-infinity
    if (/^\d+$/.test(key)) {
        return (parseInt(key) - 1).toString()
    }
    return null
}
