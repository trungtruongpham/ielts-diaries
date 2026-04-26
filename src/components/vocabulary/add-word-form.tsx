'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Sparkles, Loader2, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { enrichWordAction, addWordAction } from '@/app/dashboard/vocabulary/actions'

const SKILL_TAGS = ['Writing', 'Speaking', 'Reading', 'Listening'] as const
type SkillTag = (typeof SKILL_TAGS)[number]

interface FormState {
  word: string
  phonetic: string
  part_of_speech: string
  definition: string
  example_sentence: string
  synonyms: string[]
  skill_tags: SkillTag[]
  topic_tags: string[]
}

const initialState: FormState = {
  word: '',
  phonetic: '',
  part_of_speech: '',
  definition: '',
  example_sentence: '',
  synonyms: [],
  skill_tags: [],
  topic_tags: [],
}

export function AddWordForm() {
  const [form, setForm] = useState<FormState>(initialState)
  const [topicInput, setTopicInput] = useState('')
  const [synonymInput, setSynonymInput] = useState('')
  const [isEnriching, startEnrich] = useTransition()
  const [isSaving, startSave] = useTransition()

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function handleEnrich() {
    if (!form.word.trim()) {
      toast.error('Enter a word first')
      return
    }
    startEnrich(async () => {
      const result = await enrichWordAction(form.word.trim())
      if (result.error) {
        toast.error(result.error)
        return
      }
      if (result.data) {
        setForm((prev) => ({
          ...prev,
          phonetic: result.data!.phonetic ?? '',
          part_of_speech: result.data!.part_of_speech ?? '',
          definition: result.data!.definition ?? '',
          example_sentence: result.data!.example_sentence ?? '',
          synonyms: result.data!.synonyms ?? [],
        }))
        toast.success('Word enriched with AI')
      }
    })
  }

  function handleSave() {
    if (!form.word.trim()) { toast.error('Word is required'); return }
    if (!form.definition.trim()) { toast.error('Definition is required'); return }

    startSave(async () => {
      const result = await addWordAction({
        word: form.word,
        phonetic: form.phonetic || undefined,
        part_of_speech: form.part_of_speech || undefined,
        definition: form.definition,
        example_sentence: form.example_sentence || undefined,
        synonyms: form.synonyms,
        skill_tags: form.skill_tags,
        topic_tags: form.topic_tags,
      })
      if (result.error) toast.error(result.error)
      // On success, redirect is handled by server action
    })
  }

  function toggleSkillTag(tag: SkillTag) {
    set('skill_tags', form.skill_tags.includes(tag)
      ? form.skill_tags.filter((t) => t !== tag)
      : [...form.skill_tags, tag]
    )
  }

  function addTopicTag() {
    const tag = topicInput.trim()
    if (!tag || form.topic_tags.includes(tag)) { setTopicInput(''); return }
    set('topic_tags', [...form.topic_tags, tag])
    setTopicInput('')
  }

  function removeTopicTag(tag: string) {
    set('topic_tags', form.topic_tags.filter((t) => t !== tag))
  }

  function addSynonym() {
    const s = synonymInput.trim()
    if (!s || form.synonyms.includes(s)) { setSynonymInput(''); return }
    set('synonyms', [...form.synonyms, s])
    setSynonymInput('')
  }

  function removeSynonym(s: string) {
    set('synonyms', form.synonyms.filter((x) => x !== s))
  }

  return (
    <Card>
      <CardContent className="space-y-6 pt-6">
        {/* Word + Enrich */}
        <div className="space-y-2">
          <Label htmlFor="word">Word *</Label>
          <div className="flex gap-2">
            <Input
              id="word"
              placeholder="e.g. unprecedented"
              value={form.word}
              onChange={(e) => set('word', e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleEnrich()}
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleEnrich}
              disabled={isEnriching || !form.word.trim()}
              className="shrink-0 gap-2"
            >
              {isEnriching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {isEnriching ? 'Enriching…' : 'Enrich AI'}
            </Button>
          </div>
        </div>

        {/* Phonetic + Part of speech */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="phonetic">Phonetic (IPA)</Label>
            {isEnriching ? (
              <div className="h-10 animate-pulse rounded-md bg-muted" />
            ) : (
              <Input
                id="phonetic"
                placeholder="/ˌʌnˈprɛsɪdɛntɪd/"
                value={form.phonetic}
                onChange={(e) => set('phonetic', e.target.value)}
              />
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="pos">Part of Speech</Label>
            {isEnriching ? (
              <div className="h-10 animate-pulse rounded-md bg-muted" />
            ) : (
              <Input
                id="pos"
                placeholder="adjective"
                value={form.part_of_speech}
                onChange={(e) => set('part_of_speech', e.target.value)}
              />
            )}
          </div>
        </div>

        {/* Definition */}
        <div className="space-y-2">
          <Label htmlFor="definition">Definition *</Label>
          {isEnriching ? (
            <div className="h-20 animate-pulse rounded-md bg-muted" />
          ) : (
            <Textarea
              id="definition"
              placeholder="Clear IELTS-appropriate definition…"
              value={form.definition}
              onChange={(e) => set('definition', e.target.value)}
              rows={3}
            />
          )}
        </div>

        {/* Example sentence */}
        <div className="space-y-2">
          <Label htmlFor="example">Example Sentence</Label>
          {isEnriching ? (
            <div className="h-16 animate-pulse rounded-md bg-muted" />
          ) : (
            <Textarea
              id="example"
              placeholder="Natural sentence for IELTS Writing or Speaking…"
              value={form.example_sentence}
              onChange={(e) => set('example_sentence', e.target.value)}
              rows={2}
            />
          )}
        </div>

        {/* Synonyms */}
        <div className="space-y-2">
          <Label>Synonyms</Label>
          {isEnriching ? (
            <div className="h-10 animate-pulse rounded-md bg-muted" />
          ) : (
            <>
              <div className="flex flex-wrap gap-2">
                {form.synonyms.map((s) => (
                  <Badge key={s} variant="secondary" className="gap-1 pr-1">
                    {s}
                    <button
                      onClick={() => removeSynonym(s)}
                      className="ml-1 rounded-full hover:bg-muted"
                      aria-label={`Remove synonym ${s}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Add synonym…"
                  value={synonymInput}
                  onChange={(e) => setSynonymInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSynonym())}
                  className="flex-1"
                />
                <Button type="button" variant="outline" size="sm" onClick={addSynonym}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </div>

        {/* Skill tags */}
        <div className="space-y-2">
          <Label>Skill Tags</Label>
          <div className="flex flex-wrap gap-2">
            {SKILL_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleSkillTag(tag)}
                className={[
                  'rounded-full border px-3 py-1 text-sm font-medium transition-colors',
                  form.skill_tags.includes(tag)
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground',
                ].join(' ')}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Topic tags */}
        <div className="space-y-2">
          <Label>Topic Tags</Label>
          <div className="flex flex-wrap gap-2 mb-2">
            {form.topic_tags.map((tag) => (
              <Badge key={tag} variant="outline" className="gap-1 pr-1">
                {tag}
                <button
                  onClick={() => removeTopicTag(tag)}
                  className="ml-1 rounded-full hover:bg-muted"
                  aria-label={`Remove tag ${tag}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="e.g. environment, economics…"
              value={topicInput}
              onChange={(e) => setTopicInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') { e.preventDefault(); addTopicTag() }
                if (e.key === ',') { e.preventDefault(); addTopicTag() }
              }}
              className="flex-1"
            />
            <Button type="button" variant="outline" size="sm" onClick={addTopicTag}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">Press Enter or comma to add</p>
        </div>

        {/* Submit */}
        <Button
          onClick={handleSave}
          disabled={isSaving || !form.word.trim() || !form.definition.trim()}
          className="w-full"
          size="lg"
        >
          {isSaving ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…</>
          ) : (
            'Save Word'
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
