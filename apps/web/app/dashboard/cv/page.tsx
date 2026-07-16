'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { getCv } from '@/lib/api';
import { CVUploader } from '@/components/cv/CVUploader';
import { BaseCv } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, Calendar, CheckCircle2, Building } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function CvPage() {
  const { data: session } = useSession();
  const token = (session as any)?.apiToken;

  const [isReplacing, setIsReplacing] = useState(false);

  const { data: cv, isLoading, refetch } = useQuery<BaseCv>({
    queryKey: ['baseCv'],
    queryFn: () => getCv(token),
    enabled: !!token,
    retry: false, // Don't retry on 404
  });

  const handleSuccess = () => {
    setIsReplacing(false);
    refetch();
  };

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-8 px-8 pt-10 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-display font-medium text-foreground tracking-tight mb-2">Base CV</h1>
          <p className="text-muted-foreground text-sm">Upload your master resume to power AI tailoring for all future applications.</p>
        </div>
        {cv && !isReplacing && (
          <Button variant="outline" onClick={() => setIsReplacing(true)}>
            Replace Master CV
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="w-full h-64 border border-border rounded-md p-8 bg-background flex flex-col gap-4">
          <Skeleton className="h-8 w-1/3 mb-4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      ) : (!cv || isReplacing) ? (
        <CVUploader onSuccess={handleSuccess} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-min">
          
          {/* Header Info - Spans full width */}
          <div className="md:col-span-3 bg-background border border-border p-8 md:p-10 flex flex-col md:flex-row gap-8 justify-between items-start">
            <div className="max-w-2xl">
              <h2 className="text-3xl font-display font-medium text-foreground tracking-tight">{cv.structuredData.name}</h2>
              <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-muted-foreground font-mono">
                {cv.structuredData.email && <span>{cv.structuredData.email}</span>}
                {cv.structuredData.phone && (
                  <>
                    <span className="hidden sm:inline text-border">•</span>
                    <span>{cv.structuredData.phone}</span>
                  </>
                )}
              </div>
              
              {cv.structuredData.summary && (
                <div className="mt-8">
                  <p className="text-foreground leading-relaxed text-sm">
                    {cv.structuredData.summary}
                  </p>
                </div>
              )}
            </div>
            <div className="shrink-0 flex items-center justify-center p-6 border border-border bg-surface rounded-md">
              <FileText className="w-8 h-8 text-brand" />
            </div>
          </div>

          {/* Experience - Spans 2 columns */}
          {cv.structuredData.experience && cv.structuredData.experience.length > 0 && (
            <div className="md:col-span-2 bg-background border border-border p-8">
              <div className="flex items-center gap-3 mb-8 border-b border-border pb-4">
                <Building className="w-5 h-5 text-muted-foreground" />
                <h3 className="text-lg font-display font-medium text-foreground">Experience</h3>
              </div>
              
              <div className="flex flex-col gap-10">
                {cv.structuredData.experience.map((exp, i) => (
                  <div key={i} className="flex flex-col">
                    <div className="flex flex-col sm:flex-row sm:items-baseline justify-between mb-2 gap-2">
                      <h4 className="text-base font-semibold text-foreground tracking-tight">{exp.title}</h4>
                      <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                        {exp.startDate} – {exp.endDate || 'Present'}
                      </span>
                    </div>
                    <div className="font-medium text-sm text-muted-foreground mb-4">{exp.company}</div>
                    
                    {exp.bullets && exp.bullets.length > 0 && (
                      <ul className="space-y-3">
                        {exp.bullets.map((bullet, j) => (
                          <li key={j} className="text-sm text-foreground/80 leading-relaxed flex items-start gap-3">
                            <span className="shrink-0 block w-1.5 h-1.5 mt-2 bg-brand/40" />
                            <span>{bullet}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Right Column Stack (Skills & Education) */}
          <div className="flex flex-col gap-6 md:col-span-1">
            {/* Skills */}
            {cv.structuredData.skills && cv.structuredData.skills.length > 0 && (
              <div className="bg-background border border-border p-8 h-full">
                <div className="flex items-center gap-3 mb-6 border-b border-border pb-4">
                  <CheckCircle2 className="w-5 h-5 text-brand" />
                  <h3 className="text-lg font-display font-medium text-foreground">Skills</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {cv.structuredData.skills.map((skill, i) => (
                    <span key={i} className="px-3 py-1 bg-surface text-foreground text-xs font-mono border border-border hover:border-brand/50 transition-colors cursor-default">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Education */}
            {cv.structuredData.education && cv.structuredData.education.length > 0 && (
              <div className="bg-background border border-border p-8 h-full">
                <div className="flex items-center gap-3 mb-6 border-b border-border pb-4">
                  <Calendar className="w-5 h-5 text-muted-foreground" />
                  <h3 className="text-lg font-display font-medium text-foreground">Education</h3>
                </div>
                
                <div className="flex flex-col gap-6">
                  {cv.structuredData.education.map((edu, i) => (
                    <div key={i} className="flex flex-col gap-1">
                      <h4 className="font-semibold text-foreground text-sm tracking-tight">{edu.degree}</h4>
                      <p className="text-muted-foreground text-sm">{edu.institution}</p>
                      {edu.year && <p className="text-muted-foreground/60 font-mono text-xs mt-1">{edu.year}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
