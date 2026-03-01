# Phase 4 — Supabase Auth Integration

## Overview
- **Priority**: P1
- **Status**: Pending
- **Effort**: 3h
- **Depends on**: Phase 1

Implement email/password registration + login, Google OAuth, session management, and protected route middleware using Supabase Auth.

## Requirements

### Functional
- Register with email + password
- Login with email + password
- Login with Google OAuth
- Logout
- Session persistence (cookie-based via `@supabase/ssr`)
- Protected routes: `/dashboard/*` redirects to `/login` if unauthenticated
- Auth state reflected in header (show user email or "Login" button)

### Non-Functional
- Secure: no tokens in localStorage (cookie-based only)
- Error handling: clear messages for invalid credentials, duplicate email, etc.

## Files to Create

```
src/app/(auth)/
├── login/
│   └── page.tsx                # Login page
├── register/
│   └── page.tsx                # Register page
├── callback/
│   └── route.ts                # OAuth callback handler
└── layout.tsx                  # Auth pages layout (centered card)

src/components/auth/
├── login-form.tsx              # Email/password login form
├── register-form.tsx           # Registration form
├── google-auth-button.tsx      # Google OAuth button
└── auth-provider.tsx           # Client-side auth state context
```

## Files to Modify

```
src/middleware.ts               # Add protected route checks
src/components/layout/header.tsx # Show auth state (user email or login button)
```

## Implementation Steps

### 1. Create login page
- shadcn `<Card>` with `<Form>` (email + password fields)
- "Login" submit button
- Google OAuth button below
- Link to register page
- Error display for failed login

### 2. Create register page
- shadcn `<Card>` with `<Form>` (email + password + confirm password)
- Zod validation schema
- "Create Account" submit button
- Google OAuth button below
- Link to login page

### 3. Implement login action
```typescript
// Server Action or client-side
const { error } = await supabase.auth.signInWithPassword({
  email,
  password,
})
// On success → redirect to /dashboard
// On error → show error message
```

### 4. Implement register action
```typescript
const { error } = await supabase.auth.signUp({
  email,
  password,
})
// On success → redirect to /dashboard (or show email confirmation message)
// On error → show error message
```

### 5. Implement Google OAuth
```typescript
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: `${origin}/callback`,
  },
})
```

### 6. Create OAuth callback handler
**`src/app/(auth)/callback/route.ts`**:
```typescript
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  if (code) {
    const supabase = await createClient()
    await supabase.auth.exchangeCodeForSession(code)
  }
  return NextResponse.redirect(`${origin}/dashboard`)
}
```

### 7. Update middleware for protected routes
```typescript
// In middleware.ts, after refreshing session:
const { data: { user } } = await supabase.auth.getUser()
const isProtectedRoute = request.nextUrl.pathname.startsWith('/dashboard')
if (isProtectedRoute && !user) {
  return NextResponse.redirect(new URL('/login', request.url))
}
```

### 8. Update header to show auth state
- If logged in: show user email/avatar + "Dashboard" link + "Logout" button
- If not logged in: show "Login" + "Sign Up" buttons

### 9. Implement logout
```typescript
await supabase.auth.signOut()
// Redirect to /
```

## Supabase Dashboard Setup (Manual)

1. Go to Supabase Dashboard → Authentication → Providers
2. Enable Email provider (already default)
3. Enable Google provider:
   - Get OAuth Client ID + Secret from Google Cloud Console
   - Set authorized redirect URI: `https://<project-ref>.supabase.co/auth/v1/callback`
4. Optional: Disable email confirmation for MVP (Settings → Auth → Email → turn off "Confirm email")

## Todo List

- [ ] Create auth pages layout (centered card)
- [ ] Build login form with Zod validation
- [ ] Build register form with Zod validation
- [ ] Implement email/password login
- [ ] Implement email/password registration
- [ ] Build Google OAuth button
- [ ] Implement Google OAuth flow
- [ ] Create OAuth callback route
- [ ] Update middleware for protected routes (`/dashboard/*`)
- [ ] Update header with auth-aware navigation
- [ ] Implement logout
- [ ] Test full auth flow: register → login → dashboard → logout

## Success Criteria

- Can register with email/password, then login
- Can login with Google OAuth
- `/dashboard` redirects to `/login` when not authenticated
- Header shows user state correctly
- Logout works and redirects to home

## Security Considerations

- Passwords handled by Supabase (bcrypt hashed, never exposed)
- Cookies are httpOnly, secure, sameSite
- No tokens in client-side storage
- PKCE flow for OAuth

## Risk Assessment

| Risk | Mitigation |
|---|---|
| Google OAuth setup complexity | Follow Supabase docs step-by-step |
| Email confirmation blocks testing | Disable email confirmation for MVP |

## Next Steps

→ Phase 5: Set up database schema (tables, RLS policies)
