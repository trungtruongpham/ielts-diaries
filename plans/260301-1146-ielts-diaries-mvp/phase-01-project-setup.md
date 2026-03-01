# Phase 1 — Project Setup & Foundation

## Overview
- **Priority**: P1 (blocking all other phases)
- **Status**: Pending
- **Effort**: 3h

Initialize Next.js 15 project with App Router, configure shadcn/ui + Tailwind CSS, set up Supabase client, establish project structure and design system.

## Requirements

### Functional
- Next.js 15 App Router project with TypeScript
- shadcn/ui components installed and themed
- Supabase client configured for SSR
- Responsive layout shell (header, footer, main content area)
- Landing page with app overview

### Non-Functional
- TypeScript strict mode
- ESLint + Prettier configured
- Path aliases (`@/` for `src/`)

## Files to Create

```
src/
├── app/
│   ├── layout.tsx              # Root layout with providers, fonts, metadata
│   ├── page.tsx                # Landing page
│   ├── globals.css             # Tailwind + custom design tokens
│   └── favicon.ico
├── components/
│   ├── ui/                     # shadcn/ui components (auto-generated)
│   ├── layout/
│   │   ├── header.tsx          # App header with nav + auth buttons
│   │   └── footer.tsx          # Footer
│   └── providers.tsx           # Client providers wrapper
├── lib/
│   ├── supabase/
│   │   ├── client.ts           # Browser Supabase client
│   │   ├── server.ts           # Server Supabase client
│   │   └── middleware.ts       # Auth session refresh middleware
│   └── utils.ts                # shadcn cn() utility
├── types/
│   └── index.ts                # Shared TypeScript types
└── middleware.ts               # Next.js middleware (auth redirect)
```

## Implementation Steps

### 1. Initialize Next.js project
```bash
npx -y create-next-app@latest ./ --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
```

### 2. Install dependencies
```bash
npm install @supabase/supabase-js @supabase/ssr
npm install recharts zod
npm install -D @types/node
```

### 3. Initialize shadcn/ui
```bash
npx -y shadcn@latest init
```
- Style: Default
- Base color: Neutral or Zinc
- CSS variables: Yes

Install initial components:
```bash
npx -y shadcn@latest add button card tabs input label form toast sonner
```

### 4. Set up Supabase clients

**`src/lib/supabase/client.ts`** — Browser client:
```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

**`src/lib/supabase/server.ts`** — Server client:
```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options))
        },
      },
    }
  )
}
```

### 5. Set up middleware for session refresh
**`src/middleware.ts`**:
```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options))
        },
      },
    }
  )
  await supabase.auth.getUser()
  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
```

### 6. Create environment file
**`.env.local`**:
```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 7. Create root layout with providers
- Import Inter font from Google Fonts
- Set up metadata (title, description)
- Include header/footer layout components
- Wrap with Toaster (sonner) for notifications

### 8. Create landing page
- Hero section: App name, tagline, CTA buttons ("Calculate Score" → /calculator, "Sign Up" → /register)
- Feature cards: Calculator, Goal Tracking, Dashboard
- Mobile responsive

## Todo List

- [ ] Initialize Next.js project
- [ ] Install all dependencies
- [ ] Initialize shadcn/ui with theme
- [ ] Create Supabase client utilities (browser + server)
- [ ] Set up middleware for session refresh
- [ ] Create `.env.local` with Supabase keys
- [ ] Create root layout with metadata + fonts
- [ ] Create header component with navigation
- [ ] Create footer component
- [ ] Create landing page
- [ ] Verify `npm run dev` works

## Success Criteria

- `npm run dev` starts without errors
- Landing page renders with header, hero section, footer
- Supabase client initializes without errors (check browser console)
- Responsive on mobile viewport

## Risk Assessment

| Risk | Mitigation |
|---|---|
| Supabase project not created yet | User must create Supabase project first and add keys to `.env.local` |
| shadcn/ui version conflicts | Use `@latest` and follow official docs |

## Next Steps

→ Phase 2: Implement IELTS score calculation logic
