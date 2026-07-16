'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { Plus, Search, SlidersHorizontal, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ApplicationsTable } from '@/components/applications/ApplicationsTable'
import { AddApplicationDialog } from '@/components/applications/AddApplicationDialog'
import { getApplications, deleteApplication } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import type { Application } from '@/types'

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

function StatCard({
  label,
  value,
  color,
  highlight = false,
}: {
  label: string
  value: string | number
  color?: string
  highlight?: boolean
}) {
  return (
    <Card className={`rounded-none border-t-0 border-b-0 border-r first:border-l shadow-none ${highlight ? 'bg-secondary border-brand/20' : 'bg-card'}`}>
      <CardHeader className="pb-2 pt-6 px-6">
        <CardTitle className="text-sm font-medium text-muted-foreground font-sans">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        <div
          className={`text-4xl font-mono tracking-tight ${highlight ? 'font-bold' : 'font-medium'}`}
          style={{ color: color ?? 'var(--foreground)' }}
        >
          {value}
        </div>
      </CardContent>
    </Card>
  )
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const token = (session as { apiToken?: string })?.apiToken ?? ''
  const queryClient = useQueryClient()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editingApp, setEditingApp] = useState<Application | null>(null)
  const { toast } = useToast()

  const { data: applications = [], isLoading } = useQuery({
    queryKey: ['applications', token, statusFilter, search],
    queryFn: () =>
      getApplications(token, {
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        search: search || undefined,
      }),
    enabled: !!token,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteApplication(token, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] })
      toast({ title: 'Application deleted', description: 'The application has been removed from your pipeline.' })
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to delete application', variant: 'destructive' })
    },
  })

  // Stats
  const applied = applications.filter((a) => a.status === 'APPLIED').length
  const interviews = applications.filter(
    (a) => a.status === 'INTERVIEW_SCHEDULED'
  ).length
  const offers = applications.filter((a) => a.status === 'OFFER').length
  const total = applications.length
  const responseRate =
    total > 0
      ? Math.round(((interviews + offers) / total) * 100)
      : 0

  return (
    <div className="flex flex-col flex-1 h-full">
      {/* Header */}
      <div className="flex items-start justify-between px-8 py-8 border-b border-border bg-background">
        <div>
          <h1 className="font-display text-3xl font-semibold text-foreground tracking-tight">
            Pipeline
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Overview of your active applications and outcomes.
          </p>
        </div>
        <Button
          onClick={() => setAddDialogOpen(true)}
          aria-label="Add a new job application"
        >
          <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
          Add Application
        </Button>
      </div>

      {/* Stats row - Edge to edge styling for Workbench feel */}
      <div className="grid grid-cols-4 border-b border-border bg-card">
        <StatCard label="Total Applications" value={total} />
        <StatCard
          label="Interviews"
          value={interviews}
          color="oklch(var(--status-interview))"
        />
        <StatCard
          label="Offers"
          value={offers}
          color="oklch(var(--status-offer))"
          highlight={true}
        />
        <StatCard
          label="Response Rate"
          value={`${responseRate}%`}
          color={responseRate >= 20 ? 'oklch(var(--status-offer))' : responseRate >= 10 ? 'oklch(var(--status-applied))' : 'oklch(var(--status-ghosted))'}
        />
      </div>

      {/* Table section */}
      <div className="flex flex-col flex-1 bg-background">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-center gap-4 p-4 md:px-8 border-b border-border bg-card">
          <div className="relative flex-1 w-full max-w-sm">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none"
              aria-hidden="true"
            />
            <Input
              type="search"
              placeholder="Search company or role…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-background h-10"
              aria-label="Search applications"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
              aria-label="Filter by status"
            >
              <SelectTrigger className="w-[180px] bg-background h-10" aria-label="Status filter">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All statuses</SelectItem>
                <SelectItem value="APPLIED">Applied</SelectItem>
                <SelectItem value="INTERVIEW_SCHEDULED">Interview</SelectItem>
                <SelectItem value="OFFER">Offer</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
                <SelectItem value="GHOSTED">Ghosted</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <ApplicationsTable
          applications={applications}
          isLoading={isLoading}
          onDelete={(id) => deleteMutation.mutate(id)}
          onEdit={(app) => setEditingApp(app)}
          onAddApplication={() => setAddDialogOpen(true)}
        />
      </div>

      <AddApplicationDialog
        open={addDialogOpen || editingApp !== null}
        onOpenChange={(open) => {
          if (!open) {
            setAddDialogOpen(false)
            setEditingApp(null)
          }
        }}
        editingApp={editingApp}
      />
    </div>
  )
}
