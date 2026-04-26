'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { WordCard } from './word-card'
import type { DbVocabularyWord, DbVocabularyCard } from '@/lib/db/types'

interface Item {
  word: DbVocabularyWord
  card: DbVocabularyCard | null
}

type StateFilter = 'All' | 'New' | 'Learning' | 'Review' | 'Relearning'
type SkillFilter = 'All' | 'Writing' | 'Speaking' | 'Reading' | 'Listening'

interface Props {
  items: Item[]
}

export function WordList({ items: initialItems }: Props) {
  const [items, setItems] = useState(initialItems)
  const [search, setSearch] = useState('')
  const [stateFilter, setStateFilter] = useState<StateFilter>('All')
  const [skillFilter, setSkillFilter] = useState<SkillFilter>('All')

  const filtered = items.filter(({ word, card }) => {
    if (search && !word.word.toLowerCase().includes(search.toLowerCase()) &&
        !word.definition.toLowerCase().includes(search.toLowerCase())) return false
    if (stateFilter !== 'All' && card?.state !== stateFilter) return false
    if (skillFilter !== 'All' && !word.skill_tags.includes(skillFilter)) return false
    return true
  })

  function handleDeleted(wordId: string) {
    setItems((prev) => prev.filter(({ word }) => word.id !== wordId))
  }

  const stateFilters: StateFilter[] = ['All', 'New', 'Learning', 'Review', 'Relearning']
  const skillFilters: SkillFilter[] = ['All', 'Writing', 'Speaking', 'Reading', 'Listening']

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search words or definitions…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
        {/* State filter */}
        <div className="flex flex-wrap gap-1">
          {stateFilters.map((s) => (
            <Button
              key={s}
              variant={stateFilter === s ? 'default' : 'outline'}
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => setStateFilter(s)}
            >
              {s}
            </Button>
          ))}
        </div>
        {/* Skill filter */}
        <div className="flex flex-wrap gap-1">
          {skillFilters.map((s) => (
            <Button
              key={s}
              variant={skillFilter === s ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => setSkillFilter(s)}
            >
              {s}
            </Button>
          ))}
        </div>
      </div>

      {/* Results count */}
      <p className="text-xs text-muted-foreground">
        {filtered.length} of {items.length} words
      </p>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
          No words match your filters
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(({ word, card }) => (
            <WordCard key={word.id} word={word} card={card} onDeleted={handleDeleted} />
          ))}
        </div>
      )}
    </div>
  )
}
