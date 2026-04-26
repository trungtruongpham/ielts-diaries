// Add word page — RSC wrapper
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AddWordForm } from "@/components/vocabulary/add-word-form";

export default function AddVocabularyPage() {
  return (
    <div className="container mx-auto max-w-2xl space-y-6 px-4 py-8">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm" className="gap-1">
          <Link href="/dashboard/vocabulary">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Add New Word</h1>
          <p className="text-sm text-muted-foreground">
            Enter a word and use AI to enrich it automatically
          </p>
        </div>
        ``
      </div>
      <AddWordForm />
    </div>
  );
}
