import { type ApplicationStatus } from '@/types'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

const statusConfig: Record<
  ApplicationStatus,
  { label: string; dotColor: string; className: string }
> = {
  APPLIED: {
    label: 'Applied',
    dotColor: 'bg-status-applied',
    className: 'bg-status-applied/10 text-status-applied border-status-applied/20 hover:bg-status-applied/20',
  },
  INTERVIEW_SCHEDULED: {
    label: 'Interview',
    dotColor: 'bg-status-interview',
    className: 'bg-status-interview/10 text-status-interview border-status-interview/20 hover:bg-status-interview/20',
  },
  OFFER: {
    label: 'Offer',
    dotColor: 'bg-status-offer',
    className: 'bg-status-offer/10 text-status-offer border-status-offer/20 hover:bg-status-offer/20',
  },
  REJECTED: {
    label: 'Rejected',
    dotColor: 'bg-status-rejected',
    className: 'bg-status-rejected/10 text-status-rejected border-status-rejected/20 hover:bg-status-rejected/20',
  },
  GHOSTED: {
    label: 'Ghosted',
    dotColor: 'bg-status-ghosted',
    className: 'bg-status-ghosted/10 text-status-ghosted border-status-ghosted/20 hover:bg-status-ghosted/20',
  },
}

interface StatusBadgeProps {
  status: ApplicationStatus
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status]
  return (
    <Badge
      variant="outline"
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium font-sans border transition-colors',
        config.className,
        className
      )}
    >
      <span
        className={cn('h-1.5 w-1.5 rounded-full flex-shrink-0', config.dotColor)}
        aria-hidden="true"
      />
      {config.label}
    </Badge>
  )
}
