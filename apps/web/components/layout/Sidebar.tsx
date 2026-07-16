'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import {
  LayoutDashboard,
  Briefcase,
  FileText,
  Settings,
  LogOut,
  Radio,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

const navItems = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'Applications',
    href: '/dashboard',
    icon: Briefcase,
    exact: true,
  },
  {
    label: 'CV & Profile',
    href: '/cv',
    icon: FileText,
  },
  {
    label: 'Settings',
    href: '/settings',
    icon: Settings,
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href
    return pathname.startsWith(href)
  }

  return (
    <aside
      className="fixed left-0 top-0 h-full w-[240px] flex flex-col bg-bg-surface border-r border-border-col z-40"
      aria-label="Main navigation"
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-border-col">
        <div className="relative">
          <Radio className="h-5 w-5 text-brand" aria-hidden="true" />
          <span
            className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-brand animate-pulse-signal"
            aria-hidden="true"
          />
        </div>
        <span className="font-display text-lg font-semibold text-text-pri tracking-tight">
          Pipeline
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 space-y-0.5" aria-label="Navigation links">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href, item.exact)
          return (
            <Link
              key={item.href + item.label}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium font-sans transition-all duration-150 group',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-1 focus-visible:ring-offset-bg-surface',
                active
                  ? 'bg-brand-muted text-brand border-l-2 border-brand pl-[10px]'
                  : 'text-text-sec hover:bg-bg-raised hover:text-text-pri border-l-2 border-transparent'
              )}
              aria-current={active ? 'page' : undefined}
            >
              <Icon
                className={cn(
                  'h-4 w-4 flex-shrink-0 transition-colors',
                  active ? 'text-brand' : 'text-text-ter group-hover:text-text-sec'
                )}
                aria-hidden="true"
              />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* User info & Sign out */}
      <div className="px-3 py-4 border-t border-border-col space-y-2">
        {session?.user?.email && (
          <p
            className="px-3 text-xs text-text-ter truncate font-mono"
            title={session.user.email}
          >
            {session.user.email}
          </p>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-text-ter hover:text-red-400 hover:bg-red-500/10"
          onClick={() => signOut({ callbackUrl: '/login' })}
          aria-label="Sign out of Pipeline"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          Sign out
        </Button>
      </div>
    </aside>
  )
}
