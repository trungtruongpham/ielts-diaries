# Phase 5 — Database Schema & Data Layer

## Overview
- **Priority**: P1
- **Status**: Pending
- **Effort**: 3h
- **Depends on**: Phase 1, Phase 4

Create Supabase PostgreSQL tables (`user_goals`, `test_results`), configure Row Level Security (RLS), create TypeScript types from schema, and build data access utilities.

## Files to Create

```
supabase/
├── migrations/
│   └── 001_create_tables.sql       # Initial schema migration

src/lib/supabase/
├── database.types.ts               # Generated types from Supabase schema
└── queries/
    ├── test-results.ts             # CRUD operations for test_results
    └── user-goals.ts               # CRUD operations for user_goals

src/types/
└── database.ts                     # App-level database types
```

## Implementation Steps

### 1. Create SQL migration

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create test_type enum
CREATE TYPE test_type AS ENUM ('academic', 'general');

-- Create user_goals table (1:1 with auth.users)
CREATE TABLE user_goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  target_listening DECIMAL(2,1) NOT NULL DEFAULT 0,
  target_reading DECIMAL(2,1) NOT NULL DEFAULT 0,
  target_writing DECIMAL(2,1) NOT NULL DEFAULT 0,
  target_speaking DECIMAL(2,1) NOT NULL DEFAULT 0,
  target_overall DECIMAL(2,1) NOT NULL DEFAULT 0,
  target_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_user_goal UNIQUE (user_id)
);

-- Create test_results table (1:N with auth.users)
CREATE TABLE test_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  test_date DATE NOT NULL DEFAULT CURRENT_DATE,
  test_type test_type NOT NULL DEFAULT 'academic',
  listening_correct INTEGER CHECK (listening_correct >= 0 AND listening_correct <= 40),
  listening_band DECIMAL(2,1),
  reading_correct INTEGER CHECK (reading_correct >= 0 AND reading_correct <= 40),
  reading_band DECIMAL(2,1),
  writing_band DECIMAL(2,1),
  speaking_band DECIMAL(2,1),
  overall_band DECIMAL(2,1) NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_test_results_user_id ON test_results(user_id);
CREATE INDEX idx_test_results_test_date ON test_results(user_id, test_date);

-- RLS Policies
ALTER TABLE user_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_results ENABLE ROW LEVEL SECURITY;

-- user_goals: users can only access their own row
CREATE POLICY "Users can view own goal"
  ON user_goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own goal"
  ON user_goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own goal"
  ON user_goals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own goal"
  ON user_goals FOR DELETE USING (auth.uid() = user_id);

-- test_results: users can only access their own rows
CREATE POLICY "Users can view own results"
  ON test_results FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own results"
  ON test_results FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own results"
  ON test_results FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own results"
  ON test_results FOR DELETE USING (auth.uid() = user_id);

-- Updated_at trigger for user_goals
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_goals_updated_at
  BEFORE UPDATE ON user_goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 2. Run migration in Supabase
- Option A: Paste SQL in Supabase Dashboard → SQL Editor
- Option B: Use Supabase CLI (`supabase db push`)

### 3. Generate TypeScript types
```bash
npx supabase gen types typescript --project-id <project-id> > src/lib/supabase/database.types.ts
```

### 4. Create data access queries

**`src/lib/supabase/queries/test-results.ts`**:
```typescript
export async function getTestResults(supabase: SupabaseClient) {
  return supabase
    .from('test_results')
    .select('*')
    .order('test_date', { ascending: true })
}

export async function createTestResult(supabase: SupabaseClient, data: InsertTestResult) {
  return supabase.from('test_results').insert(data).select().single()
}

export async function deleteTestResult(supabase: SupabaseClient, id: string) {
  return supabase.from('test_results').delete().eq('id', id)
}
```

**`src/lib/supabase/queries/user-goals.ts`**:
```typescript
export async function getUserGoal(supabase: SupabaseClient) {
  return supabase.from('user_goals').select('*').single()
}

export async function upsertUserGoal(supabase: SupabaseClient, data: UpsertUserGoal) {
  return supabase.from('user_goals').upsert(data).select().single()
}
```

## Todo List

- [ ] Write SQL migration (tables, indexes, RLS, trigger)
- [ ] Execute migration in Supabase
- [ ] Generate TypeScript types
- [ ] Create test results query utilities
- [ ] Create user goals query utilities
- [ ] Verify RLS: unauthenticated user cannot read data
- [ ] Verify RLS: user A cannot read user B's data

## Success Criteria

- Tables created in Supabase with correct schema
- RLS policies active and enforced
- TypeScript types generated and importable
- Query utilities compile without errors

## Security Considerations

- RLS enforced on both tables — no data leaks between users
- `ON DELETE CASCADE` ensures cleanup when user is deleted
- CHECK constraints prevent invalid score ranges

## Next Steps

→ Phase 6: Build test result management UI (create, list, delete)
