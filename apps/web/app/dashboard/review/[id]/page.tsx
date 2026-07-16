'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { getApplication, approveAndSend, updateApplication } from '@/lib/api';
import { Application } from '@/types';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { ArrowRight, CheckCircle2, ChevronLeft, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

export default function ReviewPage() {
  const { id } = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const token = (session as any)?.apiToken;

  const [coverLetter, setCoverLetter] = useState('');
  const [hasInitLetter, setHasInitLetter] = useState(false);

  const { data: app, isLoading } = useQuery<Application>({
    queryKey: ['application', id],
    queryFn: () => getApplication(token, id as string),
    enabled: !!token && !!id,
  });

  // Initialize cover letter state once loaded
  if (app && app.coverLetterText && !hasInitLetter) {
    setCoverLetter(app.coverLetterText);
    setHasInitLetter(true);
  }

  const approveMutation = useMutation({
    mutationFn: () => approveAndSend(token, id as string, { coverLetterText: coverLetter }),
    onSuccess: () => {
      toast.success('Ready to apply', {
        description: 'Auto-fill data has been primed. Please click the submit button on the platform to complete.'
      });
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      router.push('/dashboard');
    },
    onError: (err: any) => {
      toast.error('Failed to approve', { description: err.message });
    }
  });

  const discardMutation = useMutation({
    mutationFn: () => updateApplication(token, id as string, { status: 'REJECTED' }),
    onSuccess: () => {
      toast.success('Application discarded');
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      router.push('/dashboard');
    }
  });

  if (isLoading || !app) {
    return (
      <div className="flex flex-col lg:flex-row h-[calc(100vh-2rem)] gap-6 p-6">
        <div className="w-full lg:w-2/5 flex flex-col gap-4">
          <Skeleton className="h-[200px] w-full rounded-xl" />
          <Skeleton className="h-[300px] w-full rounded-xl" />
        </div>
        <div className="w-full lg:w-3/5">
          <Skeleton className="h-full w-full rounded-xl" />
        </div>
      </div>
    );
  }

  const score = app.fitScore || 0;
  const scoreColor = score >= 80 ? 'text-brand' : score >= 60 ? 'text-amber-400' : 'text-red-400';

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-2rem)] gap-6 p-4 md:p-6 overflow-hidden">
      
      {/* Left Column: Job & Score Summary */}
      <div className="w-full lg:w-2/5 flex flex-col gap-6 overflow-y-auto pr-2 pb-24 lg:pb-0 hide-scrollbar">
        
        <Button variant="ghost" className="w-fit -ml-4 text-text-sec hover:text-text-pri" onClick={() => router.push('/dashboard')}>
          <ChevronLeft className="w-4 h-4 mr-1" /> Back to dashboard
        </Button>
        
        <div className="bg-surface rounded-xl border border-border p-6 shadow-sm">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-12 h-12 rounded-md bg-raised flex items-center justify-center shrink-0">
              <Building2 className="w-6 h-6 text-text-sec" />
            </div>
            <div>
              <h2 className="text-xl font-display font-bold text-text-pri leading-tight">{app.jobTitle}</h2>
              <p className="text-text-sec mt-1">{app.company}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 mt-4 text-sm text-text-sec">
            {app.platform && <span className="px-2 py-1 bg-raised rounded-md">{app.platform}</span>}
            {app.jobUrl && (
              <a href={app.jobUrl} target="_blank" rel="noreferrer" className="text-brand hover:underline px-2 py-1">
                View posting ↗
              </a>
            )}
          </div>
        </div>

        <div className="bg-surface rounded-xl border border-border p-6 shadow-sm flex flex-col items-center text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand/20 to-transparent" />
          
          <h3 className="text-sm font-medium text-text-sec uppercase tracking-widest mb-6">AI Fit Score</h3>
          
          <div className="relative flex items-center justify-center mb-6">
            <svg className="w-32 h-32 transform -rotate-90">
              <circle cx="64" cy="64" r="60" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-raised" />
              <circle 
                cx="64" cy="64" r="60" 
                stroke="currentColor" 
                strokeWidth="6" 
                fill="transparent" 
                strokeDasharray="377"
                strokeDashoffset={377 - (377 * score) / 100}
                strokeLinecap="round"
                className={`${scoreColor} transition-all duration-1000 ease-out`} 
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center flex-col">
              <span className={`text-4xl font-display font-bold tabular-nums ${scoreColor}`}>{score}</span>
            </div>
          </div>
          
          <div className="bg-raised/50 rounded-lg p-4 w-full text-left text-sm text-text-sec leading-relaxed">
            {/* The rationale should ideally come from the DB, but since we didn't store it in the Application model directly, 
                we might rely on notes or just show the score. Let's assume we stored it in notes or it's just general info */}
            {app.notes || 'Based on your CV and the job description, this score reflects keyword alignment, experience overlap, and required skills.'}
          </div>
        </div>

      </div>

      {/* Right Column: CV & Cover Letter preview */}
      <div className="w-full lg:w-3/5 flex flex-col bg-surface rounded-xl border border-border overflow-hidden relative shadow-sm">
        
        <Tabs defaultValue="cover-letter" className="w-full h-full flex flex-col">
          <div className="border-b border-border bg-base/50 p-2">
            <TabsList className="w-full justify-start bg-transparent">
              <TabsTrigger value="cover-letter" className="flex-1 data-[state=active]:bg-raised">Cover Letter</TabsTrigger>
              <TabsTrigger value="cv" className="flex-1 data-[state=active]:bg-raised">Tailored CV Data</TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="cover-letter" className="flex-1 p-0 m-0 overflow-hidden outline-none flex flex-col">
            <div className="flex-1 p-6">
              <Textarea
                className="w-full h-full min-h-[400px] resize-none border-0 focus-visible:ring-0 bg-transparent p-0 text-text-pri leading-relaxed font-sans"
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                placeholder="Cover letter text..."
              />
            </div>
          </TabsContent>
          
          <TabsContent value="cv" className="flex-1 p-6 overflow-y-auto hide-scrollbar outline-none">
            <div className="p-4 border border-brand/20 bg-brand/5 rounded-lg text-brand mb-6 text-sm flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <p>Your CV has been parsed. The extension will automatically use this tailored data to fill in the platform's forms when you approve.</p>
            </div>
            
            {/* We don't render the full CV here to save space, just a placeholder indicating readiness */}
            <h3 className="font-display font-medium text-lg mb-4 text-text-pri">Extracted Data Ready</h3>
            <p className="text-text-sec text-sm leading-relaxed max-w-lg">
              The AI has mapped your work history, skills, and education into the required formats for autofill.
              If you approve this application, the Chrome extension will detect the platform's form fields and populate them for you.
            </p>
          </TabsContent>
        </Tabs>

        {/* Action Footer */}
        <div className="border-t border-border bg-base p-4 lg:p-6 flex flex-col gap-3 shrink-0">
          <div className="flex items-center gap-3 w-full">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => discardMutation.mutate()}
              disabled={discardMutation.isPending || approveMutation.isPending}
            >
              Discard
            </Button>
            <Button 
              className="flex-[2] bg-brand hover:bg-brand-muted text-bg-base font-bold shadow-lg shadow-brand/20"
              onClick={() => approveMutation.mutate()}
              disabled={approveMutation.isPending || discardMutation.isPending}
            >
              {approveMutation.isPending ? 'Preparing...' : 'Approve & Send'} <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
          <p className="text-xs text-text-ter text-center font-medium">
            After clicking, fill in any remaining fields on the job platform, then click their submit button.
          </p>
        </div>
      </div>
      
    </div>
  );
}
