// AI prompt builder for vocabulary word enrichment
export function buildVocabularyEnrichmentPrompt(word: string): string {
  return `Given the English word "${word}", return a JSON object with these exact fields:
- phonetic: IPA pronunciation string (e.g. "/ˈɛksəmpəl/")
- part_of_speech: one of noun|verb|adjective|adverb|phrase
- definition: clear concise definition (1-2 sentences, IELTS-appropriate)
- example_sentence: natural sentence suitable for IELTS Writing or Speaking
- synonyms: array of exactly 3 synonyms for academic English

Return ONLY valid JSON, no markdown, no extra text.`
}
