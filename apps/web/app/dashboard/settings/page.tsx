'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { AlertCircle, Trash2, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function SettingsPage() {
  const [ghostedDays, setGhostedDays] = useState('21');
  const { toast } = useToast();

  const handleSavePreferences = () => {
    // Stub for saving preferences
    toast({
      title: 'Preferences saved',
      description: 'Your tracking preferences have been updated successfully.',
    });
  };

  const handleDeleteAccount = () => {
    // Stub for delete account
    if (confirm('Are you absolutely sure you want to delete your account? This cannot be undone.')) {
      toast({
        title: 'Account deletion scheduled',
        description: 'Your account and all associated data will be removed.',
      });
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-10 px-8 pt-10 pb-12">
      <div>
        <h1 className="text-4xl font-display font-medium text-foreground tracking-tight mb-2">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your Pipeline account and preferences.</p>
      </div>

      <div className="flex flex-col gap-8">
        
        {/* Tracking Preferences */}
        <section className="bg-background border border-border">
          <div className="p-6 md:p-8 border-b border-border">
            <h2 className="text-xl font-display font-medium text-foreground tracking-tight">Tracking Preferences</h2>
            <p className="text-sm text-muted-foreground mt-1">Configure how Pipeline manages your application statuses.</p>
          </div>
          
          <div className="p-6 md:p-8 flex flex-col gap-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div>
                <Label htmlFor="ghosted-days" className="text-base font-medium">Ghosted Threshold</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Mark applications as "Ghosted" after this many days of silence.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Input 
                  id="ghosted-days" 
                  type="number" 
                  min="7" 
                  max="90" 
                  value={ghostedDays}
                  onChange={(e) => setGhostedDays(e.target.value)}
                  className="w-24 tabular-nums" 
                />
                <span className="text-sm text-muted-foreground font-mono">days</span>
              </div>
            </div>
            
            <div className="flex justify-end pt-6 border-t border-border">
              <Button onClick={handleSavePreferences}>Save Preferences</Button>
            </div>
          </div>
        </section>

        {/* Email Integration */}
        <section className="bg-background border border-border opacity-70 cursor-not-allowed">
          <div className="p-6 md:p-8 border-b border-border flex items-center justify-between">
            <div>
              <h2 className="text-xl font-display font-medium text-foreground tracking-tight">Email Integration</h2>
              <p className="text-sm text-muted-foreground mt-1">Automatically track interview invites and rejections.</p>
            </div>
            <span className="px-3 py-1 rounded-sm bg-brand/10 text-brand text-[10px] font-bold uppercase tracking-wider border border-brand/20">
              Coming Soon
            </span>
          </div>
          
          <div className="p-6 md:p-8 flex flex-col gap-6 pointer-events-none">
            <div className="flex items-start justify-between gap-6">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-sm bg-surface border border-border flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="pt-1">
                  <Label className="text-base font-medium">Connect Gmail</Label>
                  <p className="text-sm text-muted-foreground mt-1 max-w-md leading-relaxed">
                    Allow Pipeline to scan your inbox for updates from recruiters. We only look for job-related threads.
                  </p>
                </div>
              </div>
              <div className="pt-2">
                <Switch disabled checked={false} />
              </div>
            </div>
          </div>
        </section>

        {/* Danger Zone */}
        <section className="bg-background border border-destructive/20 relative">
          <div className="absolute inset-0 bg-destructive/5 pointer-events-none" />
          <div className="p-6 md:p-8 border-b border-destructive/10 relative z-10">
            <h2 className="text-xl font-display font-medium text-destructive tracking-tight flex items-center gap-2">
              <AlertCircle className="w-5 h-5" /> Danger Zone
            </h2>
          </div>
          
          <div className="p-6 md:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
            <div>
              <h3 className="font-medium text-foreground">Delete Account</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Permanently remove your account, CV data, and all applications.
              </p>
            </div>
            <Button variant="destructive" onClick={handleDeleteAccount} className="shrink-0">
              <Trash2 className="w-4 h-4 mr-2" /> Delete Account
            </Button>
          </div>
        </section>
        
      </div>
    </div>
  );
}
