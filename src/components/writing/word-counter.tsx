"use client";

import { cn } from "@/lib/utils";

interface WordCounterProps {
  wordCount: number;
  minimum: number; // 150 for Task 1, 250 for Task 2
  className?: string;
}

type WordState = "below" | "near" | "met" | "above";

function getWordState(count: number, min: number): WordState {
  if (count < Math.floor(min * 0.8)) return "below";
  if (count < min) return "near";
  if (count < min + 50) return "met";
  return "above";
}

const STATE_STYLES: Record<
  WordState,
  { bar: string; text: string; badge: string }
> = {
  below: {
    bar: "bg-red-500",
    text: "text-red-600 dark:text-red-400",
    badge: "bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800",
  },
  near: {
    bar: "bg-amber-400",
    text: "text-amber-600 dark:text-amber-400",
    badge:
      "bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800",
  },
  met: {
    bar: "bg-emerald-500",
    text: "text-emerald-600 dark:text-emerald-400",
    badge:
      "bg-emerald-50 border-emerald-200 dark:bg-emerald-950 dark:border-emerald-800",
  },
  above: {
    bar: "bg-emerald-500",
    text: "text-emerald-600 dark:text-emerald-400",
    badge:
      "bg-emerald-50 border-emerald-200 dark:bg-emerald-950 dark:border-emerald-800",
  },
};

function getMessage(count: number, min: number, state: WordState): string {
  const need = min - count;
  switch (state) {
    case "below":
      return `${count} words — need ${need} more to reach minimum`;
    case "near":
      return `${count} words — almost there! ${need} more to go`;
    case "met":
      return `✓ ${count} words · Minimum reached`;
    case "above":
      return `✓ ${count} words · Well done!`;
  }
}

export function WordCounter({
  wordCount,
  minimum,
  className,
}: WordCounterProps) {
  const state = getWordState(wordCount, minimum);
  const styles = STATE_STYLES[state];
  const pct = Math.min(100, (wordCount / minimum) * 100);
  const message = getMessage(wordCount, minimum, state);

  return (
    <div className={cn("rounded-xl border p-3", styles.badge, className)}>
      <div className="flex items-center justify-between gap-3">
        <p className={cn("text-xs font-semibold", styles.text)}>{message}</p>
        <span
          className={cn("shrink-0 text-xs font-bold tabular-nums", styles.text)}
        >
          {minimum} words
        </span>
      </div>
      {/* Progress bar */}
      <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-300",
            styles.bar,
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
