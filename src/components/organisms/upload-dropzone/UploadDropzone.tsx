'use client';

import React, { useState, useRef } from 'react';
import { SupportedMediaExtensions } from '@/server/constants/recording.constant';
import { TemplateKey, DefaultTemplateKey } from '@/server/constants/template.constant';
import { Button } from '@/components/atoms/button';
import { Input } from '@/components/atoms/input';
import { Label } from '@/components/atoms/label';
import { Progress } from '@/components/atoms/progress';
import {
  UploadCloud,
  FileAudio,
  FileVideo,
  X,
  AlertTriangle,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface UploadDropzoneProps {
  onUploadFile?: (
    file: File,
    options: { title: string; templateCategory: TemplateKey }
  ) => Promise<{ id: string; ownershipToken?: string }>;
  onUploadComplete?: (recordingId: string, ownershipToken?: string) => void;
  maxSizeMB?: number;
  className?: string;
}

export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const unitIndex = Math.min(Math.max(0, i), sizes.length - 1);
  return `${(bytes / Math.pow(k, unitIndex)).toFixed(1)} ${sizes[unitIndex]}`;
}

export function isSupportedExtension(fileName: string): boolean {
  const ext = `.${fileName.split('.').pop()?.toLowerCase()}`;
  return (SupportedMediaExtensions as readonly string[]).includes(ext);
}

export function UploadDropzone({
  onUploadFile,
  onUploadComplete,
  maxSizeMB = 500,
  className,
}: UploadDropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [templateCategory, setTemplateCategory] = useState<TemplateKey>(DefaultTemplateKey);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    setErrorMessage(null);

    const isSupportedType =
      !file.type ||
      file.type.startsWith('audio/') ||
      file.type.startsWith('video/') ||
      file.type.startsWith('application/ogg');

    if (!isSupportedExtension(file.name) || !isSupportedType) {
      setErrorMessage(
        `Format file tidak didukung. Harap unggah salah satu format berikut: ${SupportedMediaExtensions.join(', ')}`
      );
      return;
    }

    const maxBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxBytes) {
      setErrorMessage(`Ukuran file melebihi batas maksimal ${maxSizeMB} MB.`);
      return;
    }

    setSelectedFile(file);
    // Auto-populate title with filename minus extension
    const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
    setTitle(baseName);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.relatedTarget && e.currentTarget.contains(e.relatedTarget as Node)) {
      return;
    }
    setIsDragOver(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      fileInputRef.current?.click();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file) {
        handleFile(file);
        e.target.value = '';
      }
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    setTitle('');
    setErrorMessage(null);
    setUploadProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async () => {
    if (!selectedFile || isUploading) return;

    let uploadResult: { id: string; ownershipToken?: string } | null = null;
    try {
      setIsUploading(true);
      setUploadProgress(15);
      setErrorMessage(null);

      if (onUploadFile) {
        setUploadProgress(50);
        const res = await onUploadFile(selectedFile, {
          title: title.trim() || selectedFile.name,
          templateCategory,
        });
        setUploadProgress(100);
        uploadResult = res;
      } else {
        // Fallback simulation
        setUploadProgress(100);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal mengunggah file rekaman.';
      setErrorMessage(msg);
      return;
    } finally {
      setIsUploading(false);
    }

    if (uploadResult && onUploadComplete) {
      try {
        onUploadComplete(uploadResult.id, uploadResult.ownershipToken);
      } catch (err: unknown) {
        console.error('Error in onUploadComplete callback:', err);
      }
    }
  };

  const isVideo = selectedFile?.type.startsWith('video') || selectedFile?.name.endsWith('.mp4');

  return (
    <div
      data-testid="upload-dropzone"
      className={cn('w-full max-w-xl mx-auto space-y-4', className)}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={SupportedMediaExtensions.join(',')}
        onChange={handleInputChange}
        className="hidden"
        data-testid="file-input"
      />

      {/* Drop Zone Area */}
      {!selectedFile ? (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            'group relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-10 text-center transition-all cursor-pointer',
            isDragOver
              ? 'border-primary bg-primary/10 scale-[1.01]'
              : 'border-border/80 bg-card/40 hover:border-primary/50 hover:bg-card/70'
          )}
          data-testid="drop-target-area"
          role="button"
          tabIndex={0}
          onKeyDown={handleKeyDown}
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 text-primary border border-primary/30 mb-4 group-hover:scale-110 transition-transform">
            <UploadCloud className="h-7 w-7" />
          </div>

          <h3 className="text-base font-bold text-foreground">
            Tarik & Lepas File Rekaman di Sini
          </h3>
          <p className="text-xs text-muted-foreground mt-1.5 max-w-sm">
            atau <span className="font-semibold text-primary underline">pilih dari komputer Anda</span>
          </p>

          <div className="flex flex-wrap items-center justify-center gap-1.5 mt-5">
            {SupportedMediaExtensions.map((ext) => (
              <span
                key={ext}
                className="rounded-md bg-secondary/80 px-2 py-0.5 text-[10px] font-medium text-muted-foreground border border-border/60"
              >
                {ext}
              </span>
            ))}
          </div>

          <p className="text-[11px] text-muted-foreground/70 mt-3">
            Maksimal ukuran file: {maxSizeMB} MB
          </p>
        </div>
      ) : (
        /* Selected File Card & Configuration */
        <div className="rounded-2xl border border-border/80 bg-card/60 p-5 backdrop-blur-md shadow-md space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border/40">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary border border-primary/30 shrink-0">
                {isVideo ? <FileVideo className="h-5 w-5" /> : <FileAudio className="h-5 w-5" />}
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-semibold text-foreground truncate max-w-xs sm:max-w-sm">
                  {selectedFile.name}
                </h4>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={handleClear}
              disabled={isUploading}
              title="Ganti file"
              className="text-muted-foreground hover:text-rose-400"
              data-testid="clear-file-btn"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Title Configuration */}
          <div className="space-y-1.5">
            <Label htmlFor="recording-title" className="text-xs font-semibold text-foreground">
              Judul Rekaman:
            </Label>
            <Input
              id="recording-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isUploading}
              placeholder="Masukkan judul rekaman..."
              className="text-xs"
              data-testid="recording-title-input"
            />
          </div>

          {/* Template Category Picker */}
          <div className="space-y-1.5">
            <Label htmlFor="template-select" className="text-xs font-semibold text-foreground">
              Kerangka Ringkasan Awal:
            </Label>
            <select
              id="template-select"
              value={templateCategory}
              onChange={(e) => setTemplateCategory(e.target.value as TemplateKey)}
              disabled={isUploading}
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
              data-testid="template-select"
            >
              <option value={TemplateKey.GENERAL} className="bg-popover text-foreground">
                Ringkasan Umum (Cornell Notes)
              </option>
              <option value={TemplateKey.MOM} className="bg-popover text-foreground">
                Notula Rapat (MOM - Action Items)
              </option>
              <option value={TemplateKey.ONE_ON_ONE} className="bg-popover text-foreground">
                Percakapan 1-on-1 (Wellbeing & Goals)
              </option>
              <option value={TemplateKey.INTERVIEW} className="bg-popover text-foreground">
                Wawancara Kandidat (STAR Scorecard)
              </option>
              <option value={TemplateKey.TECH_REVIEW} className="bg-popover text-foreground">
                Tinjauan Teknis (RFC / ADR)
              </option>
              <option value={TemplateKey.SALES_DISCOVERY} className="bg-popover text-foreground">
                Sales Discovery (MEDDPICC)
              </option>
              <option value={TemplateKey.DAILY_STANDUP} className="bg-popover text-foreground">
                Daily Standup / Scrum
              </option>
            </select>
          </div>

          {/* Upload Progress Bar if uploading */}
          {isUploading && (
            <div className="space-y-1.5 pt-2" data-testid="upload-progress-container">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5 font-medium text-foreground">
                  <Loader2 className="h-3 w-3 animate-spin text-primary" />
                  Mengunggah ke penyimpanan...
                </span>
                <span className="font-semibold text-primary">{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}

          {/* Action Button */}
          <div className="pt-2">
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isUploading || !title.trim()}
              className="w-full text-xs gap-2"
              data-testid="start-upload-btn"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Memproses Unggahan...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Mulai Transkripsi & Ringkasan</span>
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Error Message Alert */}
      {errorMessage && (
        <div
          data-testid="upload-error-alert"
          className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 flex items-start gap-2.5 text-xs text-rose-300"
        >
          <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
          <span className="leading-relaxed">{errorMessage}</span>
        </div>
      )}
    </div>
  );
}
