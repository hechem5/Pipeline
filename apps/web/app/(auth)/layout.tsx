import React from 'react';
import { Metadata } from 'next';
import { Activity } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Sign In - Pipeline',
  description: 'Sign in to Pipeline application tracker',
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen w-full flex bg-base">
      {/* Left panel - Brand (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-3/5 bg-base flex-col justify-between p-12 border-r border-border relative overflow-hidden">
        
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-full bg-brand animate-pulse-signal" />
            <h1 className="text-3xl font-display font-bold text-text-pri tracking-tight">Pipeline</h1>
          </div>
          <p className="text-text-sec mt-4 text-lg max-w-md leading-relaxed">
            The passive job application tracker. Detect applications automatically, 
            and let AI tailor your CV to every role.
          </p>
        </div>

        {/* Abstract decorative elements */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-brand-muted/20 via-base to-base z-0" />
        
        <div className="relative z-10 flex flex-col gap-4 max-w-lg mt-20">
          {/* Decorative fake rows */}
          <div className="flex items-center gap-4 bg-surface p-4 rounded-lg border border-border/50 opacity-80 transform -rotate-1 shadow-2xl">
            <div className="w-1 h-12 bg-sky-500 rounded-full" />
            <div className="flex-1">
              <div className="h-4 w-32 bg-text-pri/80 rounded mb-2" />
              <div className="h-3 w-48 bg-text-sec/60 rounded" />
            </div>
            <div className="h-6 w-24 bg-sky-500/10 border border-sky-500/20 rounded-full" />
          </div>
          
          <div className="flex items-center gap-4 bg-surface p-4 rounded-lg border border-border opacity-100 shadow-2xl z-10 translate-x-4">
            <div className="w-1 h-12 bg-brand animate-pulse-signal rounded-full" />
            <div className="flex-1">
              <div className="h-4 w-40 bg-text-pri rounded mb-2" />
              <div className="h-3 w-32 bg-text-sec rounded" />
            </div>
            <div className="h-6 w-20 bg-brand/10 border border-brand/20 rounded-full" />
          </div>
        </div>

        <div className="relative z-10 text-sm text-text-ter font-mono flex items-center gap-2">
          <Activity className="w-4 h-4" /> System operational
        </div>
      </div>

      {/* Right panel - Form */}
      <div className="w-full lg:w-2/5 flex flex-col items-center justify-center p-8 sm:p-12 bg-surface">
        <div className="w-full max-w-[400px]">
          {/* Mobile brand header */}
          <div className="lg:hidden flex items-center gap-3 mb-12 justify-center">
            <div className="w-4 h-4 rounded-full bg-brand animate-pulse-signal" />
            <h1 className="text-3xl font-display font-bold text-text-pri tracking-tight">Pipeline</h1>
          </div>
          
          {children}
        </div>
      </div>
    </div>
  );
}
