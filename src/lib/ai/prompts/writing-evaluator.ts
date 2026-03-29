// IELTS Writing evaluator prompts — rubric-grounded scoring

export const WRITING_EVALUATOR_SYSTEM = `\
You are a Senior IELTS Writing examiner certified by Cambridge English.
You mark strictly against the official 4-criterion Public Band Descriptors (0–9, 0.5 increments):
- Task 1 Academic: Task Achievement, Coherence & Cohesion, Lexical Resource, Grammatical Range & Accuracy
- Task 1 General: Task Achievement, Coherence & Cohesion, Lexical Resource, Grammatical Range & Accuracy
- Task 2: Task Response, Coherence & Cohesion, Lexical Resource, Grammatical Range & Accuracy

Scoring calibration:
- Band 9: Expert, near-flawless across all criteria
- Band 7–8: Competent; good range, flexibility, and accuracy with minor lapses
- Band 5–6: Has notable limitations; basic development, restricted vocabulary or errors
- Band 3–4: Serious difficulties; limited development, frequent errors
- Below 3: Inadequate; fails to address task minimally

Be calibrated and honest — do not inflate scores to be encouraging.
Always respond with valid JSON only. No markdown, no prose — pure JSON.`

/**
 * Task 1 evaluation prompt (Academic or General Training).
 */
export function getTask1EvaluationPrompt(
  promptType: string,
  promptText: string,
  userAnswer: string,
  wordCount: number,
  testType: 'academic' | 'general'
): { system: string; user: string } {
  const criterionName = 'task_achievement'
  const criterionLabel = 'Task Achievement'

  const user = `\
Evaluate this IELTS Writing Task 1 ${testType === 'general' ? 'General Training' : 'Academic'} answer.

Prompt type: ${promptType}
Task prompt given to candidate:
"""
${promptText}
"""

Candidate's answer (${wordCount} words):
"""
${userAnswer || '[No answer provided]'}
"""

Score each criterion 0–9 in 0.5 increments. Be strict. Apply penalties for:
- Word count < 150: significant penalty on Task Achievement
- Off-topic or missing key features
- Poor paragraph organisation or no overview
- Limited or repeated vocabulary
- Frequent grammatical errors

Return JSON in EXACTLY this format:
{
  "${criterionName}": <number 0-9 in 0.5 steps>,
  "coherence_cohesion": <number 0-9 in 0.5 steps>,
  "lexical_resource": <number 0-9 in 0.5 steps>,
  "grammatical_range": <number 0-9 in 0.5 steps>,
  "feedback": "<2-3 sentence overall assessment>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "improvements": ["<improvement 1>", "<improvement 2>"],
  "model_answer": "<Band 7-8 sample answer for the exact same prompt, ~180-200 words, well-structured with overview>",
  "band_breakdown": [
    { "criterion": "${criterionLabel}", "score": <number>, "explanation": "<2 sentences>" },
    { "criterion": "Coherence & Cohesion", "score": <number>, "explanation": "<2 sentences>" },
    { "criterion": "Lexical Resource", "score": <number>, "explanation": "<2 sentences>" },
    { "criterion": "Grammatical Range & Accuracy", "score": <number>, "explanation": "<2 sentences>" }
  ]
}`

  return { system: WRITING_EVALUATOR_SYSTEM, user }
}

/**
 * Task 2 Essay evaluation prompt.
 */
export function getTask2EvaluationPrompt(
  essayType: string,
  promptText: string,
  userAnswer: string,
  wordCount: number
): { system: string; user: string } {
  const user = `\
Evaluate this IELTS Writing Task 2 answer.

Essay type: ${essayType}
Task prompt given to candidate:
"""
${promptText}
"""

Candidate's answer (${wordCount} words):
"""
${userAnswer || '[No answer provided]'}
"""

Score each criterion 0–9 in 0.5 increments. Be strict. Apply penalties for:
- Word count < 250: significant penalty on Task Response
- Not addressing all parts of the question
- Lack of clear position or irrelevant ideas
- Weak paragraph structure or minimal cohesive devices
- Repeated or limited vocabulary
- Frequent grammatical errors

Return JSON in EXACTLY this format:
{
  "task_response": <number 0-9 in 0.5 steps>,
  "coherence_cohesion": <number 0-9 in 0.5 steps>,
  "lexical_resource": <number 0-9 in 0.5 steps>,
  "grammatical_range": <number 0-9 in 0.5 steps>,
  "feedback": "<2-3 sentence overall assessment>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "improvements": ["<improvement 1>", "<improvement 2>"],
  "model_answer": "<Band 7-8 sample essay for the exact same prompt, ~280-320 words, with clear intro/body/conclusion>",
  "band_breakdown": [
    { "criterion": "Task Response", "score": <number>, "explanation": "<2 sentences>" },
    { "criterion": "Coherence & Cohesion", "score": <number>, "explanation": "<2 sentences>" },
    { "criterion": "Lexical Resource", "score": <number>, "explanation": "<2 sentences>" },
    { "criterion": "Grammatical Range & Accuracy", "score": <number>, "explanation": "<2 sentences>" }
  ]
}`

  return { system: WRITING_EVALUATOR_SYSTEM, user }
}
