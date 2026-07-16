import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium font-sans border transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-bg-raised text-text-sec border-border-col',
        applied:
          'bg-amber-500/10 text-amber-400 border-amber-500/20',
        interview:
          'bg-sky-500/10 text-sky-400 border-sky-500/20',
        offer:
          'bg-green-500/10 text-brand border-green-500/20',
        rejected:
          'bg-red-500/10 text-red-400 border-red-500/20',
        ghosted:
          'bg-gray-500/10 text-gray-400 border-gray-500/20',
        auto:
          'bg-purple-500/10 text-purple-400 border-purple-500/20',
        ai:
          'bg-brand-muted/60 text-brand border-brand/20',
        comingSoon:
          'bg-bg-raised text-text-ter border-border-col text-[10px] uppercase tracking-wider',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props}>
      {children}
    </span>
  )
}

export { Badge, badgeVariants }
