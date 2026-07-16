import { type ApplicationStatus } from '@/types'
import { cn } from '@/lib/utils'

const statusConfig: Record<
  ApplicationStatus,
  { label: string; dotColor: string; className: string }
> = {
  APPLIED: {
    label: 'Applied',
    dotColor: 'bg-amber-400',
    className: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  },
  INTERVIEW_SCHEDULED: {
    label: 'Interview',
    dotColor: 'bg-sky-400',
    className: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  },
  OFFER: {
    label: 'Offer',
    dotColor: 'bg-brand',
    className: 'bg-green-500/10 text-brand border-green-500/20',
  },
  REJECTED: {
    label: 'Rejected',
    dotColor: 'bg-red-400',
    className: 'bg-red-500/10 text-red-400 border-red-500/20',
  },
  GHOSTED: {
    label: 'Ghosted',
    dotColor: 'bg-gray-500',
    className: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  },
}

interface StatusBadgeProps {
  status: ApplicationStatus
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium font-sans border',
        config.className,
        className
      )}
    >
      <span
        className={cn('h-1.5 w-1.5 rounded-full flex-shrink-0', config.dotColor)}
        aria-hidden="true"
      />
      {config.label}
    </span>
  )
}

export function getStatusColor(status: ApplicationStatus): string {
  const colors: Record<ApplicationStatus, string> = {
    APPLIED: '#FCD34D',
    INTERVIEW_SCHEDULED: '#38BDF8',
    OFFER: '#4ADE80',
    REJECTED: '#F87171',
    GHOSTED: '#6B7280',
  }
  return colors[status]
}
