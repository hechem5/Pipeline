'use client';

import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { StatusBadge } from './StatusBadge';
import { Application } from '@/types';
import { MoreHorizontal, FileText, Trash2, Edit2, ExternalLink } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';

interface ApplicationsTableProps {
  applications: Application[];
  isLoading: boolean;
  onDelete: (id: string) => void;
  onEdit: (app: Application) => void;
  onAddApplication?: () => void;
}

export function ApplicationsTable({ applications, isLoading, onDelete, onEdit, onAddApplication }: ApplicationsTableProps) {
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="rounded-md border border-border">
        <Table>
          <TableHeader>
            <TableRow className="border-border">
              <TableHead className="w-[3px] p-0"></TableHead>
              <TableHead className="text-text-ter text-xs uppercase tracking-wider">Company & Role</TableHead>
              <TableHead className="text-text-ter text-xs uppercase tracking-wider">Status</TableHead>
              <TableHead className="text-text-ter text-xs uppercase tracking-wider">Applied</TableHead>
              <TableHead className="text-text-ter text-xs uppercase tracking-wider">Source</TableHead>
              <TableHead className="text-text-ter text-xs uppercase tracking-wider w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i} className="border-border">
                <TableCell className="p-0"><div className="w-[3px] h-12 bg-raised" /></TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-[150px] mb-2" />
                  <Skeleton className="h-3 w-[100px]" />
                </TableCell>
                <TableCell><Skeleton className="h-5 w-[80px] rounded-full" /></TableCell>
                <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                <TableCell><Skeleton className="h-5 w-[60px] rounded-sm" /></TableCell>
                <TableCell><Skeleton className="h-8 w-8 rounded-md" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (applications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 border border-border border-dashed rounded-lg bg-surface">
        <FileText className="w-12 h-12 text-text-ter mb-4" />
        <h3 className="text-lg font-medium text-text-pri mb-2 font-display">No applications yet</h3>
        <p className="text-text-sec text-center mb-6 max-w-sm">
          Start by installing the Chrome extension to automatically detect your applications, or add one manually.
        </p>
        <Button onClick={onAddApplication}>Add Application</Button>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-border overflow-hidden">
      <Table>
        <TableHeader className="bg-surface/50">
          <TableRow className="border-border hover:bg-transparent">
            <TableHead className="w-[3px] p-0"></TableHead>
            <TableHead className="text-text-ter text-xs uppercase tracking-wider font-medium">Company & Role</TableHead>
            <TableHead className="text-text-ter text-xs uppercase tracking-wider font-medium">Status</TableHead>
            <TableHead className="text-text-ter text-xs uppercase tracking-wider font-medium">Applied</TableHead>
            <TableHead className="text-text-ter text-xs uppercase tracking-wider font-medium">Source</TableHead>
            <TableHead className="text-right text-text-ter text-xs uppercase tracking-wider font-medium">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {applications.map((app) => {
            const isRecent = new Date().getTime() - new Date(app.lastStatusUpdate).getTime() < 24 * 60 * 60 * 1000;
            
            // Map status to color
            let colorClass = 'bg-gray-500';
            if (app.status === 'APPLIED') colorClass = 'bg-amber-500';
            if (app.status === 'INTERVIEW_SCHEDULED') colorClass = 'bg-sky-500';
            if (app.status === 'OFFER') colorClass = 'bg-brand';
            if (app.status === 'REJECTED') colorClass = 'bg-red-500';

            return (
              <TableRow 
                key={app.id}
                className={cn(
                  "border-border group hover:bg-raised/50 transition-colors cursor-pointer",
                  // If it's AI tailored and hasn't been approved yet, give it a slight background tint
                  app.status === 'APPLIED' && app.source === 'AI_TAILORED' ? "bg-brand/5" : ""
                )}
                onClick={() => {
                   if (app.source === 'AI_TAILORED' && app.status === 'APPLIED') {
                     router.push(`/review/${app.id}`);
                   }
                }}
              >
                <TableCell className="p-0">
                  <div 
                    className={cn(
                      "w-[3px] h-full min-h-[4rem] transition-colors",
                      colorClass,
                      isRecent && "animate-pulse-signal"
                    )}
                  />
                </TableCell>
                <TableCell>
                  <div className="font-semibold text-text-pri">{app.company}</div>
                  <div className="text-sm text-text-sec flex items-center gap-2 mt-0.5">
                    <span className="truncate max-w-[200px]">{app.jobTitle}</span>
                    {app.platform && (
                      <>
                        <span>•</span>
                        <span>{app.platform}</span>
                      </>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <StatusBadge status={app.status} />
                </TableCell>
                <TableCell>
                  <div className="font-mono tabular-nums text-text-sec">
                    {format(new Date(app.appliedAt), 'MMM dd, yyyy')}
                  </div>
                </TableCell>
                <TableCell>
                  {app.source === 'AUTO_DETECTED' && (
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-purple-500/10 text-purple-400">Auto</span>
                  )}
                  {app.source === 'MANUAL' && (
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-surface text-text-ter border border-border">Manual</span>
                  )}
                  {app.source === 'AI_TAILORED' && (
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-brand-muted text-brand border border-brand/20">AI Tailored</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[160px]">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      {app.jobUrl && (
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); window.open(app.jobUrl!, '_blank'); }}>
                          <ExternalLink className="mr-2 h-4 w-4" /> View posting
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(app); }}>
                        <Edit2 className="mr-2 h-4 w-4" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDelete(app.id); }} className="text-red-400 focus:text-red-400">
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
