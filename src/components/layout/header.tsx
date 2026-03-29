'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  Calculator, LayoutDashboard, LogOut,
  Menu, X, Target, ClipboardList, Mic, PenLine,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import { cn } from '@/lib/utils'

/** Get initials from email or name — e.g. "Trung Truong" → "TT" */
function getInitials(user: User): string {
  const name = user.user_metadata?.full_name as string | undefined
  if (name) {
    const parts = name.trim().split(' ')
    return parts.length >= 2
      ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
      : parts[0][0].toUpperCase()
  }
  return (user.email?.[0] ?? '?').toUpperCase()
}

function getAvatarUrl(user: User): string | undefined {
  return user.user_metadata?.avatar_url as string | undefined
}

function UserAvatar({ user, size = 'md' }: { user: User; size?: 'sm' | 'md' }) {
  const initials = getInitials(user)
  const avatarUrl = getAvatarUrl(user)
  const sizeClass = size === 'sm' ? 'h-8 w-8 text-xs' : 'h-9 w-9 text-sm'

  return (
    <Avatar className={cn(sizeClass, 'ring-2 ring-primary/20 transition-[box-shadow] hover:ring-primary/50')}>
      {avatarUrl && (
        <AvatarImage src={avatarUrl} alt={initials} referrerPolicy="no-referrer" />
      )}
      <AvatarFallback className="bg-primary text-primary-foreground font-bold">
        {initials}
      </AvatarFallback>
    </Avatar>
  )
}

function UserMenu({ user, onLogout }: { user: User; onLogout: () => void }) {
  const name = user.user_metadata?.full_name as string | undefined

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {/* button wrapping Avatar — aria-label required for icon-only button */}
        <button
          className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          aria-label="Open user menu"
        >
          <UserAvatar user={user} />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-60" align="end" sideOffset={8}>
        <DropdownMenuLabel className="py-3">
          <div className="flex items-center gap-3">
            <UserAvatar user={user} size="sm" />
            <div className="min-w-0">
              {name && <p className="truncate text-sm font-semibold">{name}</p>}
              <p className="truncate text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/dashboard" className="flex cursor-pointer items-center gap-2">
              <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
              Dashboard
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/dashboard/results" className="flex cursor-pointer items-center gap-2">
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
              My Results
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/dashboard/speaking" className="flex cursor-pointer items-center gap-2">
              <Mic className="h-4 w-4 text-muted-foreground" />
              Speaking History
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/dashboard/writing" className="flex cursor-pointer items-center gap-2">
              <PenLine className="h-4 w-4 text-muted-foreground" />
              Writing History
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/dashboard/goal" className="flex cursor-pointer items-center gap-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              My Goal
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={onLogout}
          className="flex cursor-pointer items-center gap-2 text-destructive focus:text-destructive"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function Header() {
  const [user, setUser] = useState<User | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const isConfigured =
      url && key && !url.includes('placeholder') && !key.includes('placeholder')
    if (!isConfigured) return

    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
    })
    return () => listener.subscription.unsubscribe()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  // Only public nav items — Dashboard lives in the user avatar dropdown
  const navLinks = [
    { href: '/calculator', label: 'Calculator', icon: Calculator },
    { href: '/speaking', label: 'Speaking', icon: Mic },
    { href: '/writing', label: 'Writing', icon: PenLine },
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card/80 backdrop-blur-md">
      {/*
        Layout: [Logo + Nav] ··· [Auth]
        Logo & nav are left-grouped; auth is pushed right with ml-auto.
        This prevents the nav from floating to the absolute center.
      */}
      <div className="container mx-auto flex h-16 max-w-6xl items-center gap-6 px-4">

        {/* Logo — left anchor */}
        <Link href="/" className="flex shrink-0 items-center gap-2 font-bold text-foreground">
          <Image
            src="/icon.png"
            alt="IELTS Diaries icon"
            width={32}
            height={32}
            className="rounded-lg shadow-sm"
            priority
          />
          <span className="text-lg">
            IELTS <span className="text-primary">Diaries</span>
          </span>
        </Link>

        {/* Spacer — pushes nav + auth to the right */}
        <div className="flex-1" />

        {/* Desktop Nav — right side, adjacent to auth */}
        <nav className="hidden items-center gap-1 md:flex" aria-label="Main navigation">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'rounded-lg px-4 py-2 text-sm font-medium transition-colors duration-150',
                pathname === href
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              )}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Desktop Auth — right side */}
        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <UserMenu user={user} onLogout={handleLogout} />
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">Sign In</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/register">Get Started</Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile Hamburger */}
        <button
          className="ml-auto rounded-lg p-2 text-muted-foreground transition-colors duration-150 hover:bg-accent md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="border-t border-border bg-card px-4 py-3 md:hidden">
          <nav className="flex flex-col gap-1" aria-label="Mobile navigation">
            {navLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150',
                  pathname === href
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}

            <div className="mt-2 flex flex-col gap-1 border-t border-border pt-2">
              {user ? (
                <>
                  {/* Mobile user identity */}
                  <div className="flex items-center gap-3 px-3 py-2">
                    <UserAvatar user={user} size="sm" />
                    <div className="min-w-0">
                      {user.user_metadata?.full_name && (
                        <p className="truncate text-sm font-semibold">
                          {user.user_metadata.full_name as string}
                        </p>
                      )}
                      <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <Link
                    href="/dashboard/results"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors duration-150 hover:bg-accent hover:text-foreground"
                  >
                    <ClipboardList className="h-4 w-4" />
                    My Results
                  </Link>
                  <Link
                    href="/dashboard/goal"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors duration-150 hover:bg-accent hover:text-foreground"
                  >
                    <Target className="h-4 w-4" />
                    My Goal
                  </Link>
                  <button
                    onClick={() => { setMobileOpen(false); handleLogout() }}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-destructive transition-colors duration-150 hover:bg-destructive/5"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Button variant="ghost" size="sm" asChild className="justify-start">
                    <Link href="/login" onClick={() => setMobileOpen(false)}>Sign In</Link>
                  </Button>
                  <Button size="sm" asChild className="justify-start">
                    <Link href="/register" onClick={() => setMobileOpen(false)}>Get Started</Link>
                  </Button>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
