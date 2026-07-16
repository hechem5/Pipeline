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
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-text-pri mb-1">Your CV</h1>
          <p className="text-text-sec">Upload your master resume to power AI tailoring.</p>
        </div>
        {cv && !isReplacing && (
          <Button variant="outline" onClick={() => setIsReplacing(true)}>
            Replace CV
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="w-full h-64 border border-border rounded-xl p-8 bg-surface flex flex-col gap-4">
          <Skeleton className="h-8 w-1/3 mb-4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      ) : (!cv || isReplacing) ? (
        <CVUploader onSuccess={handleSuccess} />
      ) : (
        <div className="flex flex-col gap-6">
          
          {/* Header Info */}
          <div className="bg-surface rounded-xl border border-border p-6 shadow-sm">
            <h2 className="text-2xl font-display font-bold text-text-pri">{cv.structuredData.name}</h2>
            <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-text-sec">
              {cv.structuredData.email && <span>{cv.structuredData.email}</span>}
              {cv.structuredData.phone && (
                <>
                  <span className="hidden sm:inline">•</span>
                  <span>{cv.structuredData.phone}</span>
                </>
              )}
            </div>
            
            {cv.structuredData.summary && (
              <div className="mt-6 pt-6 border-t border-border">
                <p className="text-text-pri leading-relaxed text-sm">
                  {cv.structuredData.summary}
                </p>
              </div>
            )}
          </div>

          {/* Skills */}
          {cv.structuredData.skills && cv.structuredData.skills.length > 0 && (
            <div className="bg-surface rounded-xl border border-border p-6 shadow-sm">
              <h3 className="text-lg font-display font-bold text-text-pri mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-brand" /> Skills
              </h3>
              <div className="flex flex-wrap gap-2">
                {cv.structuredData.skills.map((skill, i) => (
                  <span key={i} className="px-3 py-1.5 rounded-full bg-brand-muted/30 text-brand text-xs font-medium border border-brand/20">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Experience */}
          {cv.structuredData.experience && cv.structuredData.experience.length > 0 && (
            <div className="bg-surface rounded-xl border border-border p-6 shadow-sm">
              <h3 className="text-lg font-display font-bold text-text-pri mb-6 flex items-center gap-2">
                <Building className="w-5 h-5 text-text-ter" /> Experience
              </h3>
              
              <div className="flex flex-col gap-8">
                {cv.structuredData.experience.map((exp, i) => (
                  <div key={i} className="relative pl-6 border-l-2 border-raised">
                    <div className="absolute w-3 h-3 bg-raised rounded-full -left-[7px] top-1.5 border-2 border-surface" />
                    
                    <h4 className="text-base font-bold text-text-pri">{exp.title}</h4>
                    <div className="flex items-center gap-2 mt-1 text-sm text-text-sec">
                      <span className="font-medium text-text-pri">{exp.company}</span>
                      <span>•</span>
                      <span className="font-mono text-xs uppercase tracking-wider">{exp.startDate} – {exp.endDate || 'Present'}</span>
                    </div>
                    
                    {exp.bullets && exp.bullets.length > 0 && (
                      <ul className="mt-4 space-y-2">
                        {exp.bullets.map((bullet, j) => (
                          <li key={j} className="text-sm text-text-sec leading-relaxed flex items-start gap-2">
                            <span className="text-brand mt-1.5 shrink-0 block w-1 h-1 rounded-full bg-brand" />
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

          {/* Education */}
          {cv.structuredData.education && cv.structuredData.education.length > 0 && (
            <div className="bg-surface rounded-xl border border-border p-6 shadow-sm">
              <h3 className="text-lg font-display font-bold text-text-pri mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-text-ter" /> Education
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {cv.structuredData.education.map((edu, i) => (
                  <div key={i} className="p-4 rounded-lg bg-base border border-border">
                    <h4 className="font-bold text-text-pri text-sm">{edu.degree}</h4>
                    <p className="text-text-sec text-sm mt-1">{edu.institution}</p>
                    {edu.year && <p className="text-text-ter font-mono text-xs mt-2">{edu.year}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
