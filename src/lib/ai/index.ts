// Barrel export for AI lib
export { chatCompletion, parseJsonResponse } from './openrouter'
export { textToSpeech } from './minimax-tts'
export { generatePartQuestions, evaluateAnswer, calculateSpeakingOverall } from './speaking-engine'
export { randomPart1Topic, PART1_TOPICS } from './prompts/speaking-examiner'
export type {
  ChatMessage,
  ChatCompletionOptions,
  ChatCompletionResult,
  TTSOptions,
  TTSResult,
  SpeakingQuestion,
  Part2TopicCard,
  SpeakingEvaluation,
  SpeakingSessionScores,
} from './types'
