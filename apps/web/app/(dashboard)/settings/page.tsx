'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { AlertCircle, Trash2, Mail } from 'lucide-react';
import { toast } from 'sonner';

export default function SettingsPage() {
  const [ghostedDays, setGhostedDays] = useState('21');

  const handleSavePreferences = () => {
    // Stub for saving preferences
    toast.success('Preferences saved successfully');
  };

  const handleDeleteAccount = () => {
    // Stub for delete account
    if (confirm('Are you absolutely sure you want to delete your account? This cannot be undone.')) {
      toast.success('Account deletion scheduled');
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col gap-10 pb-12">
      <div>
        <h1 className="text-3xl font-display font-bold text-text-pri mb-1">Settings</h1>
        <p className="text-text-sec">Manage your Pipeline account and preferences.</p>
      </div>

      <div className="flex flex-col gap-8">
        
        {/* Tracking Preferences */}
        <section className="bg-surface rounded-xl border border-border overflow-hidden">
          <div className="p-6 border-b border-border bg-base/30">
            <h2 className="text-lg font-display font-bold text-text-pri">Tracking Preferences</h2>
            <p className="text-sm text-text-sec mt-1">Configure how Pipeline manages your application statuses.</p>
          </div>
          
          <div className="p-6 flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <Label htmlFor="ghosted-days" className="text-base font-medium">Ghosted Threshold</Label>
                <p className="text-sm text-text-sec mt-1">
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
                  className="w-20 tabular-nums" 
                />
                <span className="text-sm text-text-sec">days</span>
              </div>
            </div>
            
            <div className="flex justify-end pt-4 border-t border-border/50">
              <Button onClick={handleSavePreferences}>Save Preferences</Button>
            </div>
          </div>
        </section>

        {/* Email Integration */}
        <section className="bg-surface rounded-xl border border-border overflow-hidden">
          <div className="p-6 border-b border-border bg-base/30 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-display font-bold text-text-pri">Email Integration</h2>
              <p className="text-sm text-text-sec mt-1">Automatically track interview invites and rejections.</p>
            </div>
            <span className="px-2.5 py-1 rounded bg-brand/10 text-brand text-xs font-bold uppercase tracking-wider border border-brand/20">
              Coming Soon
            </span>
          </div>
          
          <div className="p-6 flex flex-col gap-6 opacity-60 pointer-events-none">
            <div className="flex items-center justify-between gap-4">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-raised flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5 text-text-sec" />
                </div>
                <div>
                  <Label className="text-base font-medium">Connect Gmail</Label>
                  <p className="text-sm text-text-sec mt-1 max-w-md">
                    Allow Pipeline to scan your inbox for updates from recruiters. We only look for job-related threads.
                  </p>
                </div>
              </div>
              <Switch disabled checked={false} />
            </div>
          </div>
        </section>

        {/* Danger Zone */}
        <section className="bg-surface rounded-xl border border-red-500/20 overflow-hidden relative">
          <div className="absolute inset-0 bg-red-500/5 pointer-events-none" />
          <div className="p-6 border-b border-red-500/10 relative z-10">
            <h2 className="text-lg font-display font-bold text-red-400 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" /> Danger Zone
            </h2>
          </div>
          
          <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
            <div>
              <h3 className="font-medium text-text-pri">Delete Account</h3>
              <p className="text-sm text-text-sec mt-1">
                Permanently remove your account, CV data, and all applications.
              </p>
            </div>
            <Button variant="destructive" onClick={handleDeleteAccount} className="shrink-0 bg-red-500/10 text-red-400 hover:bg-red-500/20 border-red-500/20">
              <Trash2 className="w-4 h-4 mr-2" /> Delete Account
            </Button>
          </div>
        </section>
        
      </div>
    </div>
  );
}
