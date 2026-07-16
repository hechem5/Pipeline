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
    exact: true,
  },
  {
    label: 'CV & Profile',
    href: '/dashboard/cv',
    icon: FileText,
  },
  {
    label: 'Settings',
    href: '/dashboard/settings',
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

  const activeIndex = navItems.findIndex(item => isActive(item.href, item.exact))

  return (
    <aside
      className="fixed left-0 top-0 h-full w-[240px] flex flex-col bg-background border-r border-border z-40 transition-all duration-300"
      aria-label="Main navigation"
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-border">
        <div className="relative">
          <Radio className="h-5 w-5 text-brand" aria-hidden="true" />
          <span
            className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-brand animate-pulse-signal"
            aria-hidden="true"
          />
        </div>
        <span className="font-display text-lg font-semibold text-foreground tracking-tight">
          Pipeline
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 space-y-1 relative" aria-label="Navigation links">
        {/* Morphing Active Pill */}
        {activeIndex !== -1 && (
          <div 
            className="absolute left-3 right-3 h-10 bg-secondary rounded-md transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
            style={{ transform: `translateY(${activeIndex * 44}px)` }} // 40px height + 4px spacing
            aria-hidden="true"
          />
        )}

        {navItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href, item.exact)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'relative z-10 flex items-center gap-3 px-3 h-10 rounded-md text-sm font-medium font-sans transition-colors duration-150 group',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-1 focus-visible:ring-offset-background',
                active
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              aria-current={active ? 'page' : undefined}
            >
              <Icon
                className={cn(
                  'h-4 w-4 flex-shrink-0 transition-colors',
                  active ? 'text-brand' : 'text-muted-foreground group-hover:text-foreground'
                )}
                aria-hidden="true"
              />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* User info & Sign out */}
      <div className="px-3 py-4 border-t border-border space-y-2">
        {session?.user?.email && (
          <p
            className="px-3 text-xs text-muted-foreground truncate font-mono"
            title={session.user.email}
          >
            {session.user.email}
          </p>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
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
