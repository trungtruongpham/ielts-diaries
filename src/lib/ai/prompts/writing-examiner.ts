// IELTS Writing examiner prompts — prompt generation for all task types

// ── Task type pools ────────────────────────────────────────────────────────────

export const TASK1_ACADEMIC_TYPES = [
  'bar chart', 'line graph', 'pie chart', 'table', 'process diagram',
  'map comparison', 'bar chart and table',
] as const

export const TASK1_GT_LETTER_TYPES = [
  'complaint', 'request', 'apology', 'invitation',
  'recommendation', 'explanation', 'information',
] as const

export const TASK2_ESSAY_TYPES = [
  'opinion', 'discussion', 'problem_solution', 'two_part', 'mixed',
] as const

/** Pick a random entry from an array */
function randomFrom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

export function randomTask1AcademicType(): string {
  return randomFrom(TASK1_ACADEMIC_TYPES)
}

export function randomTask1GTType(): string {
  return randomFrom(TASK1_GT_LETTER_TYPES)
}

export function randomTask2EssayType(): string {
  return randomFrom(TASK2_ESSAY_TYPES)
}

// ── System prompt ─────────────────────────────────────────────────────────────

export const WRITING_EXAMINER_SYSTEM = `\
You are an experienced IELTS Writing examiner creating authentic practice prompts that exactly match official Cambridge IELTS Test books (Tests 1–19).

CRITICAL RULES for Task 1 Academic prompt_text:
1. ALWAYS start with: "You should spend about 20 minutes on this task."
2. THEN one blank line, then: "The [chart type] below shows [specific topic with scope — countries, years, or categories]."
3. THEN one blank line, then EXACTLY this instruction — do NOT paraphrase it:
   "Summarise the information by selecting and reporting the main features, and make comparisons where relevant."
4. THEN one blank line, then: "Write at least 150 words."
5. Do NOT add bullet points, sub-questions, or any extra sentences.
6. Do NOT repeat numbers from the chart data in the prompt_text.

DATA REALISM RULES:
- Use plausible real-world topics: energy consumption, university enrolment, transport usage, employment rates, tourism figures, etc.
- Years must be in range 2015–2024
- Line chart values must form coherent trends (not random noise)
- Pie chart segments must sum to EXACTLY 100
- Table headers must include units where applicable (e.g. "Population (millions)")
- Process diagrams must have 5–8 logically ordered steps
- Bar chart values must be internally consistent and plausible

Always respond with valid JSON only. No markdown, no prose — pure JSON.`

// ── Prompt factories ──────────────────────────────────────────────────────────

/**
 * Generate a Task 1 Academic prompt (describe a chart/table/process).
 */
export function getTask1AcademicPrompt(promptTypeHint?: string): string {
  const type = promptTypeHint ?? randomTask1AcademicType()

  const chartInstructions: Record<string, string> = {
    'bar chart': `Generate a bar chart with:
- 5–7 x-axis labels (years 2015–2024 OR 4–6 categorical groups such as countries or age groups)
- 2–3 named series, each with an array of plausible numerical values that vary realistically
- A meaningful unit (%, million, thousand, kg/person, hours/week, etc.)
- chart_data format: { "type": "bar", "title": "<descriptive title>", "unit": "<unit>", "xLabels": [...], "series": [{ "name": "...", "values": [...] }], "source": "Adapted from ONS/World Bank data" }

prompt_text MUST be EXACTLY this structure (Cambridge format):
"You should spend about 20 minutes on this task.\\n\\nThe bar chart below shows [specific topic, scope, and time period].\\n\\nSummarise the information by selecting and reporting the main features, and make comparisons where relevant.\\n\\nWrite at least 150 words."`,

    'line graph': `Generate a line graph with:
- 6–8 x-axis labels (consecutive years e.g. 2016–2023)
- 2–4 named series, each with values that form a coherent trend (gradual rise, decline, or fluctuation — NOT random noise)
- Values for each series must be internally consistent (e.g. if a trend rises, it should mostly rise)
- A meaningful unit
- chart_data format: { "type": "line", "title": "<descriptive title>", "unit": "<unit>", "xLabels": [...], "series": [{ "name": "...", "values": [...] }], "source": "Adapted from Statista/OECD data" }

prompt_text MUST be EXACTLY this structure (Cambridge format):
"You should spend about 20 minutes on this task.\\n\\nThe line graph below shows [specific topic, countries/categories, and time period].\\n\\nSummarise the information by selecting and reporting the main features, and make comparisons where relevant.\\n\\nWrite at least 150 words."`,

    'pie chart': `Generate a pie chart with:
- 4–6 segments with descriptive labels
- Values MUST sum to EXACTLY 100 — double-check before returning
- No segment should be less than 4 or more than 50 (to keep it interesting)
- chart_data format: { "type": "pie", "title": "<descriptive title>", "segments": [{ "label": "...", "value": <number> }], "source": "Adapted from Eurostat data" }

prompt_text MUST be EXACTLY this structure (Cambridge format):
"You should spend about 20 minutes on this task.\\n\\nThe pie chart below shows [what is being distributed and the year/context].\\n\\nSummarise the information by selecting and reporting the main features, and make comparisons where relevant.\\n\\nWrite at least 150 words."`,

    'table': `Generate a data table with:
- 4–5 column headers; the first column is a row label (e.g. Country, Category)
- Include units in column headers where applicable (e.g. "GDP ($ billion)", "Population (millions)")
- 5–7 rows of data with a mix of numeric values (not all the same magnitude)
- chart_data format: { "type": "table", "title": "<descriptive title>", "headers": [...], "rows": [[...], ...], "source": "Adapted from national statistics" }

prompt_text MUST be EXACTLY this structure (Cambridge format):
"You should spend about 20 minutes on this task.\\n\\nThe table below shows [what is compared, including categories and time period or scope].\\n\\nSummarise the information by selecting and reporting the main features, and make comparisons where relevant.\\n\\nWrite at least 150 words."`,

    'process diagram': `Generate a process diagram with:
- 5–8 ordered steps describing a manufacturing, natural, or recycling process
- Each step has a short label (3–6 words) and a 1-sentence description (max 20 words)
- Steps must be logically sequential — each one leads to the next
- chart_data format: { "type": "process", "title": "<process name>", "steps": [{ "label": "...", "description": "..." }] }

prompt_text MUST be EXACTLY this structure (Cambridge format):
"You should spend about 20 minutes on this task.\\n\\nThe diagram below shows [the name of the process and what it produces or achieves].\\n\\nSummarise the information by selecting and reporting the main features, and make comparisons where relevant.\\n\\nWrite at least 150 words."`,

    'map comparison': `Generate a data table comparing 3–5 locations (towns, cities, or regions) across 3–4 metrics (e.g. area km², population, green space %, transport links).
- Include units in column headers where applicable
- chart_data format: { "type": "table", "title": "<topic> — Comparison", "headers": ["Location", "<Metric 1 (unit)>", "<Metric 2 (unit)>", "<Metric 3>"], "rows": [[...], ...], "source": "Adapted from urban planning survey data" }

prompt_text MUST be EXACTLY this structure (Cambridge format):
"You should spend about 20 minutes on this task.\\n\\nThe maps below show [the location name and what changed — e.g. 'a town in 1990 and 2020'].\\n\\nSummarise the information by selecting and reporting the main features, and make comparisons where relevant.\\n\\nWrite at least 150 words."`,

    'bar chart and table': `Generate a bar chart (primary visual). Return:
- chart_data as the bar chart format (5–7 x-axis labels, 2–3 series, meaningful unit)
- The prompt_text should reference "the bar chart" as the visual type

prompt_text MUST be EXACTLY this structure (Cambridge format):
"You should spend about 20 minutes on this task.\\n\\nThe bar chart below shows [specific topic, scope, and time period].\\n\\nSummarise the information by selecting and reporting the main features, and make comparisons where relevant.\\n\\nWrite at least 150 words."`,
  }

  const chartInstruction = chartInstructions[type] ?? chartInstructions['bar chart']

  return `\
Generate an IELTS Writing Task 1 Academic prompt featuring a ${type}.

## Instructions
${chartInstruction}

## Response format
Return ONLY a JSON object in EXACTLY this format (no markdown, no code fences):
{
  "prompt_type": "${type.replace(/ /g, '_')}",
  "chart_type_label": "${type.split(' ').map((w: string) => w[0].toUpperCase() + w.slice(1)).join(' ')}",
  "prompt_text": "<Cambridge-format task instruction — 4 paragraphs as specified above>",
  "chart_data": { <chart object as specified above> }
}`
}

/**
 * Generate a Task 1 General Training prompt (write a letter).
 */
export function getTask1GTPrompt(letterTypeHint?: string): string {
  const type = letterTypeHint ?? randomTask1GTType()
  return `\
Generate an IELTS Writing Task 1 General Training prompt for a ${type} letter.

Rules:
- The situation must be realistic and relatable (work, neighbourhood, services, travel)
- The task must ask the candidate to write to a specific recipient (friend, manager, local council, etc.)
- The prompt must specify 3 bullet points that the letter must address
- Include a note: "Write at least 150 words."
- The letter type should inform the tone: complaint = formal; invitation = semi-formal; etc.

Return JSON:
{
  "prompt_type": "letter_${type}",
  "prompt_text": "<full prompt shown to candidate — situation + recipient + 3 bullet points + word count note>"
}`
}

/**
 * Generate a Task 2 Essay prompt.
 */
export function getTask2Prompt(essayTypeHint?: string): string {
  const type = essayTypeHint ?? randomTask2EssayType()

  const endingByType: Record<string, string> = {
    opinion: 'To what extent do you agree or disagree?',
    discussion: 'Discuss both views and give your own opinion.',
    problem_solution: 'What are the causes of this problem? What solutions can you suggest?',
    two_part: 'Why is this? What can be done to improve the situation?',
    mixed: 'What are the advantages and disadvantages of this trend?',
  }

  const ending = endingByType[type] ?? endingByType.opinion

  return `\
Generate an IELTS Writing Task 2 essay question of type: ${type}.

Rules:
- Topic must be a contemporary societal issue (technology, environment, education, health, globalisation, work)
- Language must be B2–C2 appropriate, neutral academic register
- End the question with EXACTLY this sentence: "${ending}"
- Include a note: "Write at least 250 words."
- The question must be one clear paragraph (2–3 sentences max before the ending)

Return JSON:
{
  "prompt_type": "essay_${type}",
  "prompt_text": "<full prompt shown to candidate — one paragraph of context + ending + word count note>"
}`
}
