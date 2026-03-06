// IELTS Speaking examiner prompts — question generation for all 3 parts

// ── Part 1 topic pool ─────────────────────────────────────────────────────────

export const PART1_TOPICS = [
  'hometown',
  'work or study',
  'family',
  'hobbies and free time',
  'food and cooking',
  'travel and holidays',
  'weather and seasons',
  'technology',
  'music',
  'reading and books',
  'sports and exercise',
  'friends and socialising',
  'daily routine',
  'shopping',
  'art and culture',
  'transport',
  'the internet',
  'health and fitness',
] as const

/** Pick a random Part 1 topic from the pool */
export function randomPart1Topic(): string {
  return PART1_TOPICS[Math.floor(Math.random() * PART1_TOPICS.length)]
}

// ── Shared examiner persona ───────────────────────────────────────────────────

export const SPEAKING_EXAMINER_SYSTEM = `\
You are an experienced, friendly IELTS Speaking examiner conducting an official test.
Your questions are natural, clear, and appropriate for adult English learners.
You follow the official IELTS Speaking test format exactly.
You NEVER provide any hints, corrections, or encouragement mid-question — that happens only during feedback.
Always respond with valid JSON only. No markdown, no prose — pure JSON.`

// ── Part 1 prompts ────────────────────────────────────────────────────────────

/**
 * Returns a user-role prompt that asks the LLM to generate 5 Part 1 questions.
 * Expected JSON response: string[]  (array of 5 question strings)
 */
export function getPartOnePrompt(topic: string): string {
  return `\
Generate exactly 5 IELTS Speaking Part 1 questions about the topic: "${topic}".

Rules:
- Questions must be short, conversational, and use simple vocabulary
- Mix question types: yes/no follow-ups, "what/where/when/why/how" questions, preference questions
- Questions should progress naturally from simple to slightly more developed
- Do NOT repeat the same question structure twice
- Do NOT include "IELTS" or "Speaking test" in the questions themselves

Return a JSON array of exactly 5 strings. Example format:
["Question one?", "Question two?", "Question three?", "Question four?", "Question five?"]`
}

// ── Part 2 prompts ────────────────────────────────────────────────────────────

/**
 * Returns a user-role prompt that asks the LLM to generate a Part 2 topic card.
 * Expected JSON response: { topic: string, prompt: string, bullets: string[], followUp: string }
 */
export function getPartTwoPrompt(): string {
  return `\
Generate an IELTS Speaking Part 2 topic card.

Rules:
- The topic must be a common everyday experience (a person, place, event, object, or activity)
- The topic must be different from: hometown, work, study, family (those are Part 1)
- The "prompt" field is the main instruction (e.g. "Describe a time when...")
- Provide exactly 3 "bullets" — each starts with "where", "when", "who", "what", or "how"
- The "followUp" is one final bullet starting with "and explain..."
- All language must be B1-C2 appropriate (IELTS candidates)

Return a JSON object in this exact format:
{
  "topic": "Short topic title (max 8 words)",
  "prompt": "Describe a [something] that [context].",
  "bullets": ["where/when/who/what/how ...", "where/when/who/what/how ...", "where/when/who/what/how ..."],
  "followUp": "and explain why this [topic] was memorable/important/interesting to you."
}`
}

// ── Part 3 prompts ────────────────────────────────────────────────────────────

/**
 * Returns a user-role prompt that asks the LLM to generate 5 Part 3 discussion questions.
 * Expected JSON response: string[]  (array of 5 question strings)
 */
export function getPartThreePrompt(part2Topic: string): string {
  return `\
Generate exactly 5 IELTS Speaking Part 3 discussion questions related to the Part 2 topic: "${part2Topic}".

Rules:
- Questions must be abstract, analytical, and require extended answers
- They should move from the personal to the societal/global level
- Use academic vocabulary and complex question structures
- Ask about trends, comparisons, opinions, causes, effects, or future changes
- Questions should be genuinely thought-provoking for an adult English learner
- Do NOT ask personal questions (Part 3 is about society/ideas, not the individual's experience)

Return a JSON array of exactly 5 strings. Example format:
["Discussion question one?", "Discussion question two?", "Discussion question three?", "Discussion question four?", "Discussion question five?"]`
}
