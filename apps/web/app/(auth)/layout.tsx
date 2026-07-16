import React from 'react';
import { Metadata } from 'next';
import { Radio } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Pipeline',
  description: 'The passive job application tracker.',
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen w-full bg-background flex flex-col md:flex-row">
      {/* Letter structural left column */}
      <div className="w-full md:w-[480px] lg:w-[600px] flex flex-col justify-between p-8 md:p-16 xl:p-24 border-b md:border-b-0 md:border-r border-border shrink-0">
        <div>
          <Link href="/" className="inline-flex items-center gap-3 mb-16 group outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm">
            <div className="relative">
              <Radio className="h-6 w-6 text-brand" aria-hidden="true" />
              <span
                className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-brand animate-pulse-signal"
                aria-hidden="true"
              />
            </div>
            <span className="font-display text-2xl font-semibold text-foreground tracking-tight">Pipeline</span>
          </Link>
          
          <h1 className="text-4xl md:text-5xl font-display font-medium text-foreground tracking-tight leading-[1.1] text-balance mb-6">
            The passive application tracker.
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed max-w-sm">
            Detect applications automatically. Let AI tailor your CV to every role. Zero manual data entry.
          </p>
        </div>

        <div className="hidden md:block">
          <p className="text-sm font-mono text-muted-foreground/60 uppercase tracking-widest">
            v1.0.0 // Operational
          </p>
        </div>
      </div>

      {/* Right panel - Form */}
      <div className="flex-1 flex items-center p-8 md:p-16 xl:p-24 bg-surface">
        <div className="w-full max-w-[400px]">
          {children}
        </div>
      </div>
    </div>
  );
}
