'use client';

import React, { useState, useRef } from 'react';
import { UploadCloud, File as FileIcon, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { StructuredCv } from '@/types';
import { uploadCv } from '@/lib/api';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';

import { BaseCv } from '@/types';

interface CVUploaderProps {
  onSuccess: (cv: BaseCv) => void;
}

export function CVUploader({ onSuccess }: CVUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { data: session } = useSession();
  const token = (session as any)?.apiToken;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === 'application/pdf') {
        setFile(droppedFile);
        await processUpload(droppedFile);
      } else {
        toast.error('Please upload a PDF file');
      }
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type === 'application/pdf') {
        setFile(selectedFile);
        await processUpload(selectedFile);
      } else {
        toast.error('Please upload a PDF file');
      }
    }
  };

  const processUpload = async (uploadFile: File) => {
    if (!token) return;
    setIsUploading(true);
    
    try {
      const response = await uploadCv(token, uploadFile);
      toast.success('CV uploaded and parsed successfully');
      onSuccess(response.baseCv);
    } catch (err: any) {
      toast.error('Failed to process CV', { description: err.message });
      setFile(null);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-xl bg-surface transition-colors",
        isDragging ? "border-brand bg-brand/5" : "border-border hover:bg-raised/50",
        isUploading && "opacity-50 pointer-events-none"
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        type="file"
        ref={fileInputRef}
        accept=".pdf,application/pdf"
        className="hidden"
        onChange={handleFileChange}
      />

      {isUploading ? (
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 rounded-full border-4 border-raised border-t-brand animate-spin mb-4" />
          <h3 className="text-lg font-medium text-text-pri font-display">Parsing your CV...</h3>
          <p className="text-text-sec text-center max-w-sm mt-2">
            Extracting skills, experience, and structuring your profile for AI tailoring.
          </p>
        </div>
      ) : file ? (
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-brand-muted flex items-center justify-center mb-4">
            <FileIcon className="w-8 h-8 text-brand" />
          </div>
          <h3 className="text-lg font-medium text-text-pri mb-1 font-display">{file.name}</h3>
          <p className="text-text-sec mb-4">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
          <Button variant="outline" onClick={() => setFile(null)}>Cancel</Button>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-raised flex items-center justify-center mb-4">
            <UploadCloud className="w-8 h-8 text-text-ter" />
          </div>
          <h3 className="text-lg font-medium text-text-pri mb-2 font-display">Upload your base CV</h3>
          <p className="text-text-sec text-center mb-6 max-w-sm">
            Drag and drop your PDF here, or click to browse. We'll use this to automatically tailor applications.
          </p>
          <Button onClick={() => fileInputRef.current?.click()}>
            Browse Files
          </Button>
        </div>
      )}
    </div>
  );
}
