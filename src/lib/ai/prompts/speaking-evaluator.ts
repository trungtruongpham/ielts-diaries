// IELTS Speaking evaluator prompts — rubric-grounded scoring

/** Expected duration heuristics per part */
const DURATION_HINTS: Record<1 | 2 | 3, string> = {
  1: 'Part 1 answers are typically 30–60 seconds. A very short answer (<15s) suggests limited development.',
  2: 'Part 2 answers should be 1–2 minutes. Shorter answers (<45s) indicate underdevelopment.',
  3: 'Part 3 answers are typically 45–90 seconds. Extended analytical responses score higher.',
}

/**
 * Returns the complete evaluation system prompt and user prompt for judging
 * one spoken answer against the official IELTS Speaking rubric.
 */
export function getEvaluationPrompt(
  part: 1 | 2 | 3,
  question: string,
  transcript: string,
  durationSeconds: number
): { system: string; user: string } {
  const system = `\
You are an expert IELTS Speaking examiner with 10+ years of experience.
You evaluate spoken responses using the official IELTS Speaking Band Descriptors.

SCORING CRITERIA (score each 0–9 in 0.5 increments):

1. FLUENCY & COHERENCE (FC):
   - 9: Speaks fluently with occasional repetition/self-correction, full coherence
   - 7-8: Speaks at length without noticeable effort, mostly coherent
   - 5-6: Willing to speak at length but sometimes loses coherence
   - 3-4: Speaks with long pauses, limited development
   - 1-2: Barely speaks, long silences

2. LEXICAL RESOURCE (LR):
   - 9: Uses a wide vocabulary with full flexibility
   - 7-8: Uses vocabulary with flexibility, uses less common items
   - 5-6: Uses adequate vocabulary for familiar topics
   - 3-4: Only uses basic vocabulary
   - 1-2: Only isolated words or memorised phrases

3. GRAMMATICAL RANGE & ACCURACY (GRA):
   - 9: Structures are accurate and appropriate, errors are rare
   - 7-8: Uses a range of complex structures; most are accurate
   - 5-6: Mix of simple and complex structures, some errors
   - 3-4: Mainly simple sentences, many errors
   - 1-2: Only basic sentence forms or memorised phrases

4. PRONUNCIATION (P):
   - 9: Uses a full range of pronunciation features with precision and subtlety
   - 7-8: Uses a wide range of features; generally easy to understand
   - 5-6: Shows some pronunciation features but inconsistently
   - 3-4: Pronunciation errors cause some difficulty for listener
   - 1-2: Difficult to understand throughout

TIMING NOTE: ${DURATION_HINTS[part]}
Duration of this answer: ${durationSeconds} seconds.

IMPORTANT:
- Be calibrated and honest — do not inflate scores to be encouraging
- Scores must reflect real IELTS examiner standards (e.g., a 7.0 FC means genuinely fluent speech)
- Return ONLY a valid JSON object — no markdown, no preamble, no trailing text`

  const user = `\
IELTS Speaking Part ${part} Question:
"${question}"

Candidate's spoken response (transcript):
"${transcript || '[No transcript available — audio was recorded but could not be transcribed]'}"

Evaluate this response and return a JSON object in EXACTLY this format:
{
  "fluency_coherence": <number 0-9 in 0.5 steps>,
  "lexical_resource": <number 0-9 in 0.5 steps>,
  "grammatical_range": <number 0-9 in 0.5 steps>,
  "pronunciation": <number 0-9 in 0.5 steps>,
  "feedback": "<2-3 sentence overall comment on the response quality>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "improvements": ["<improvement tip 1>", "<improvement tip 2>"]
}`

  return { system, user }
}
