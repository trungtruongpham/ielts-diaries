export interface LLMModel {
  id: string;
  label: string;
  description: string;
  badge?: string;
  /** Whether the model/provider supports response_format: { type: 'json_object' } */
  supportsJsonMode: boolean;
}

export const OPENROUTER_MODELS: LLMModel[] = [
  {
    id: "deepseek/deepseek-v4-pro",
    label: "DeepSeek V4 Pro",
    description:
      "DeepSeek V4 Pro is a powerful AI model that uses advanced reasoning to solve complex problems.",
    badge: "Balanced",
    supportsJsonMode: false, // DeepSeek via SiliconFlow — JSON mode unsupported
  },
  {
    id: "qwen/qwen3.6-plus",
    label: "Qwen 3.6 Plus",
    description: "Qwen advanced reasoning model",
    badge: "Balanced",
    supportsJsonMode: false, // Reasoning model — JSON mode not reliable
  },
  {
    id: "minimax/minimax-m2.7",
    label: "MiniMax 2.7",
    description: "MiniMax long-context model",
    badge: "Fast",
    supportsJsonMode: true,
  },
  {
    id: "openai/gpt-4.1-nano",
    label: "GPT-4.1 Nano",
    description: "Fast and efficient OpenAI model",
    badge: "Fast",
    supportsJsonMode: true,
  },
];

export const DEFAULT_MODEL_ID = "minimax/minimax-m2.5";

/** Returns true if the given model ID supports response_format: json_object. Defaults to true for unknown models. */
export function modelSupportsJsonMode(modelId: string): boolean {
  const model = OPENROUTER_MODELS.find((m) => m.id === modelId);
  return model?.supportsJsonMode ?? true;
}
