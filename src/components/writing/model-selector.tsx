"use client";

import { Cpu } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { OPENROUTER_MODELS, DEFAULT_MODEL_ID } from "@/lib/ai/models";
import type { LLMModel } from "@/lib/ai/models";

interface ModelSelectorProps {
  value: string;
  onChange: (modelId: string) => void;
  className?: string;
  disabled?: boolean;
}

const BADGE_VARIANT_MAP: Record<string, string> = {
  Smart:
    "bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300",
  Balanced: "bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300",
  Fast: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300",
};

function ModelBadge({ badge }: { badge: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-1.5 py-0 text-[10px] font-semibold leading-4",
        BADGE_VARIANT_MAP[badge] ?? "bg-muted text-muted-foreground",
      )}
    >
      {badge}
    </span>
  );
}

function getModelById(id: string): LLMModel | undefined {
  return OPENROUTER_MODELS.find((m) => m.id === id);
}

export function ModelSelector({
  value,
  onChange,
  className,
  disabled,
}: ModelSelectorProps) {
  const selectedModel = getModelById(value) ?? getModelById(DEFAULT_MODEL_ID);

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <label className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
        <Cpu className="h-3 w-3" aria-hidden />
        AI Model
      </label>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger
          className="h-9 w-full gap-2 rounded-xl border-border bg-card text-sm shadow-sm"
          aria-label="Select AI model"
        >
          <SelectValue>
            <span className="flex items-center gap-2">
              <span className="font-medium">
                {selectedModel?.label ?? value}
              </span>
              {selectedModel?.badge && (
                <ModelBadge badge={selectedModel.badge} />
              )}
            </span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="rounded-xl">
          {OPENROUTER_MODELS.map((model) => (
            <SelectItem
              key={model.id}
              value={model.id}
              className="cursor-pointer rounded-lg py-2"
            >
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{model.label}</span>
                  {model.badge && <ModelBadge badge={model.badge} />}
                </div>
                <span className="text-[11px] text-muted-foreground">
                  {model.description}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
