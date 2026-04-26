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

// ── Task 1 Academic model answer spec ────────────────────────────────────────

const TASK1_ACADEMIC_MODEL_ANSWER_SPEC = `\
Band 7–8 Academic report for the EXACT same prompt. Follow these requirements precisely:

STRUCTURE (4 paragraphs, 170–200 words total):
- Paragraph 1 – Introduction (1 sentence): Paraphrase the prompt using synonyms and different grammar. NEVER copy the prompt wording verbatim.
- Paragraph 2 – Overview (2 sentences): Summarise the 2–3 most significant overall trends, comparisons, or stages. Do NOT include any specific figures or data here. Start with "Overall," or "In general,".
- Paragraph 3 – Body 1 (3–4 sentences): Describe the first key feature group with precise supporting data (percentages, figures, years). Make accurate comparisons using collocations.
- Paragraph 4 – Body 2 (3–4 sentences): Describe the second key feature group with precise supporting data. Reference notable exceptions or turning points where relevant.

VOCABULARY requirements:
- Use a varied range of data-reporting collocations: "rose sharply", "declined steadily", "remained relatively stable", "peaked at", "accounted for", "experienced a dramatic increase", "saw a gradual fall", "fluctuated between", "was significantly higher/lower than", "reached a high/low of".
- Avoid repeating the same verb more than once. Do not use vague words like "went up" or "went down".
- Use precise quantifiers: "approximately", "nearly", "just over", "roughly".

GRAMMAR requirements:
- Mix active and passive voice naturally.
- Include at least one relative clause (e.g., "which represented...") and one participial phrase (e.g., "rising from X to Y").
- Use comparative and superlative structures accurately.

COHESION requirements:
- Use logical connectors appropriate to data description: "By contrast,", "Meanwhile,", "Similarly,", "In addition,", "However,", "Notably,".

CRITICAL RULES:
- Do NOT write "In conclusion" — Task 1 Academic does not have a conclusion.
- All data figures in the model answer MUST match the original prompt exactly.
- No bullet points or numbered lists — continuous prose only.`

// ── Task 1 General Training model answer spec ─────────────────────────────────

const TASK1_GT_MODEL_ANSWER_SPEC = `\
Band 7–8 General Training letter for the EXACT same prompt. Follow these requirements precisely:

STRUCTURE (150–180 words total):
- Opening salutation: Appropriate greeting (e.g. "Dear Mr Smith," for formal; "Dear John," for informal). Choose based on the addressee in the prompt.
- Paragraph 1 – Purpose (1–2 sentences): Clearly state why you are writing. Reference the situation from the prompt naturally.
- Paragraph 2 – Bullet point 1 (2–3 sentences): Address the first bullet point in FULL with specific relevant detail. Do not merely mention it — develop it.
- Paragraph 3 – Bullet point 2 (2–3 sentences): Address the second bullet point in FULL with specific relevant detail.
- Paragraph 4 – Bullet point 3 (2–3 sentences): Address the third bullet point in FULL with specific relevant detail.
- Closing: Appropriate sign-off matched to the register (e.g. "Yours sincerely," for formal to named person; "Yours faithfully," for formal to unknown; "Best wishes," / "Kind regards," for informal).

REGISTER requirements:
- Determine register from the prompt's addressee (employer/official = formal; friend/neighbour = informal/semi-formal) and apply it CONSISTENTLY throughout.
- Formal: avoid contractions, use polite modal verbs (would, could, should), full grammatical sentences.
- Informal: contractions acceptable, natural idiomatic expressions, friendly tone.

VOCABULARY requirements:
- Natural collocations appropriate to the genre (e.g. "I am writing to express my concern regarding...", "I would be grateful if you could...", "I look forward to hearing from you.").
- Avoid repeating the same phrases. Use varied expressions for requests, suggestions, and explanations.

GRAMMAR requirements:
- Mix sentence structures: simple statements, complex sentences with subordinate clauses, modal verbs for politeness/suggestion.
- Include at least one conditional structure (e.g. "If it would be possible...", "Should you require...").

CRITICAL RULES:
- ALL three bullet points from the prompt must be addressed — omitting one results in a significant Task Achievement penalty.
- No bullet points or numbered lists in the answer — continuous prose only.
- The letter must feel authentic, not templated.`

// ── Task 2 model answer spec ──────────────────────────────────────────────────

const TASK2_MODEL_ANSWER_SPEC = `\
Band 7–8 essay for the EXACT same Task 2 prompt. Follow these requirements precisely:

STRUCTURE (4 paragraphs, 270–300 words total):
- Paragraph 1 – Introduction (2 sentences): Sentence 1: paraphrase the topic/context using synonyms and different grammar (NEVER copy the prompt). Sentence 2: clear thesis statement expressing your position or the essay's scope — make it specific, not vague.
- Paragraph 2 – Body 1 (4–5 sentences): Topic sentence stating the main idea → Explanation of WHY/HOW → Concrete, specific real-world example → Analysis linking example back to the argument → Optional: concise acknowledgement of a counter-perspective.
- Paragraph 3 – Body 2 (4–5 sentences): Topic sentence stating a second distinct main idea → Explanation → Concrete example → Analysis → Link to the overall argument.
- Paragraph 4 – Conclusion (2 sentences): Restate position using different words (do NOT simply copy the introduction). Summarise the two key points. Do NOT introduce any new ideas.

VOCABULARY requirements:
- Use academic collocations and less common lexical items: "detrimental consequences", "exacerbate the issue", "a growing body of evidence suggests", "undermine", "facilitate", "is contingent upon", "have far-reaching implications".
- Avoid repeating key nouns from the prompt — use synonyms and paraphrases.
- No informal language: avoid "a lot of", "kids", "big", "good/bad" — use formal equivalents.

GRAMMAR requirements:
- Include at least: one complex sentence with a subordinate clause, one passive construction, one conditional (Type 1, 2, or 3), and one relative clause.
- Vary sentence length — alternate short punchy sentences with longer complex ones.

COHESION requirements:
- Use signposting language naturally: "Furthermore,", "Nevertheless,", "As a result,", "In contrast,", "This suggests that", "Consequently,", "In particular,".
- Each paragraph must have a clear topic sentence and a closing sentence that links back to the thesis.

CRITICAL RULES:
- The essay must take and maintain ONE clear position throughout.
- No bullet points or numbered lists — continuous prose only.
- The conclusion must NOT start with "In conclusion, ..." alone — vary the phrasing (e.g. "To summarise,", "All things considered,", "In light of the above,").
- Word count must be 270–300 words — not shorter.`

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
  const modelAnswerSpec = testType === 'general' ? TASK1_GT_MODEL_ANSWER_SPEC : TASK1_ACADEMIC_MODEL_ANSWER_SPEC

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
- Poor paragraph organisation or no overview (Academic) / missing bullet points (GT)
- Limited or repeated vocabulary
- Frequent grammatical errors

MODEL ANSWER INSTRUCTIONS:
${modelAnswerSpec}

Return JSON in EXACTLY this format:
{
  "${criterionName}": <number 0-9 in 0.5 steps>,
  "coherence_cohesion": <number 0-9 in 0.5 steps>,
  "lexical_resource": <number 0-9 in 0.5 steps>,
  "grammatical_range": <number 0-9 in 0.5 steps>,
  "feedback": "<2-3 sentence overall assessment>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "improvements": ["<improvement 1>", "<improvement 2>"],
  "model_answer": "<Write the full Band 7-8 model answer here following the MODEL ANSWER INSTRUCTIONS above>",
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

MODEL ANSWER INSTRUCTIONS:
${TASK2_MODEL_ANSWER_SPEC}

Return JSON in EXACTLY this format:
{
  "task_response": <number 0-9 in 0.5 steps>,
  "coherence_cohesion": <number 0-9 in 0.5 steps>,
  "lexical_resource": <number 0-9 in 0.5 steps>,
  "grammatical_range": <number 0-9 in 0.5 steps>,
  "feedback": "<2-3 sentence overall assessment>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "improvements": ["<improvement 1>", "<improvement 2>"],
  "model_answer": "<Write the full Band 7-8 model essay here following the MODEL ANSWER INSTRUCTIONS above>",
  "band_breakdown": [
    { "criterion": "Task Response", "score": <number>, "explanation": "<2 sentences>" },
    { "criterion": "Coherence & Cohesion", "score": <number>, "explanation": "<2 sentences>" },
    { "criterion": "Lexical Resource", "score": <number>, "explanation": "<2 sentences>" },
    { "criterion": "Grammatical Range & Accuracy", "score": <number>, "explanation": "<2 sentences>" }
  ]
}`

  return { system: WRITING_EVALUATOR_SYSTEM, user }
}
