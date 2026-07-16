'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { Plus, Search, SlidersHorizontal } from 'lucide-react'
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
import { toast } from '@/components/ui/toast'
import type { Application, ApplicationStatus } from '@/types'

function StatCard({
  label,
  value,
  color,
  sub,
}: {
  label: string
  value: string | number
  color?: string
  sub?: string
}) {
  return (
    <div className="bg-bg-surface border border-border-col rounded-lg p-5 flex flex-col gap-1.5">
      <span className="text-xs font-medium text-text-ter uppercase tracking-wider font-sans">
        {label}
      </span>
      <span
        className="text-3xl font-mono tabular-nums font-medium leading-none"
        style={{ color: color ?? '#F1F5F9' }}
      >
        {value}
      </span>
      {sub && (
        <span className="text-xs text-text-ter font-sans">{sub}</span>
      )}
    </div>
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
      toast.success('Application deleted')
    },
    onError: () => {
      toast.error('Failed to delete application')
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
    <div className="space-y-8 animate-fade-in">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold text-text-pri text-balance">
            Applications
          </h1>
          <p className="text-text-sec text-sm mt-1 font-sans">
            Track every application, interview, and outcome in one place.
          </p>
        </div>
        <Button
          onClick={() => setAddDialogOpen(true)}
          aria-label="Add a new job application"
          className="gap-2"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add Application
        </Button>
      </div>

      {/* Stat bar */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Applied" value={applied} sub="total sent" />
        <StatCard
          label="Interviews"
          value={interviews}
          color="#38BDF8"
          sub="scheduled"
        />
        <StatCard
          label="Offers"
          value={offers}
          color="#4ADE80"
          sub="received"
        />
        <StatCard
          label="Response Rate"
          value={`${responseRate}%`}
          color={responseRate >= 20 ? '#4ADE80' : responseRate >= 10 ? '#FCD34D' : '#94A3B8'}
          sub="interviews + offers / applied"
        />
      </div>

      {/* Table section */}
      <div className="space-y-4">
        {/* Filters */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-ter pointer-events-none"
              aria-hidden="true"
            />
            <Input
              type="search"
              placeholder="Search company or role…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              aria-label="Search applications by company or role"
            />
          </div>

          <div className="flex items-center gap-2">
            <SlidersHorizontal
              className="h-4 w-4 text-text-ter flex-shrink-0"
              aria-hidden="true"
            />
            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
              aria-label="Filter by status"
            >
              <SelectTrigger className="w-[160px]" aria-label="Status filter">
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
