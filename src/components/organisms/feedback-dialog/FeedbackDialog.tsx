'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/atoms/dialog';
import { Button } from '@/components/atoms/button';
import { Input } from '@/components/atoms/input';
import { Textarea } from '@/components/atoms/textarea';
import { Label } from '@/components/atoms/label';
import { Checkbox } from '@/components/atoms/checkbox';
import {
  Star,
  Bug,
  Lightbulb,
  Rocket,
  Heart,
  MessageSquare,
  Loader2,
  Send,
  User,
  ShieldCheck,
  Sparkles,
  Paperclip,
  UploadCloud,
  X,
  Image as ImageIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/auth.store';
import { useUiStore } from '@/stores/ui.store';
import { useTranslation } from '@/locales';
import { apiFetch, ApiClientError } from '@/lib/api-client';
import {
  FeedbackCategory,
  FeedbackAttachment,
  FeedbackPresignResponse,
} from '@/server/dtos/feedback.dto';
import { ApiResponse } from '@/server/dtos/response.dto';

export interface FeedbackDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultCategory?: FeedbackCategory;
}

interface CategoryOption {
  key: FeedbackCategory;
  labelKey: string;
  icon: React.ComponentType<{ className?: string }>;
  activeBg: string;
  activeBorder: string;
  activeText: string;
}

const CATEGORY_OPTIONS: CategoryOption[] = [
  {
    key: 'feature',
    labelKey: 'feedback.categories.feature',
    icon: Lightbulb,
    activeBg: 'bg-amber-500/10 dark:bg-amber-500/20',
    activeBorder: 'border-amber-500/50',
    activeText: 'text-amber-600 dark:text-amber-400',
  },
  {
    key: 'bug',
    labelKey: 'feedback.categories.bug',
    icon: Bug,
    activeBg: 'bg-rose-500/10 dark:bg-rose-500/20',
    activeBorder: 'border-rose-500/50',
    activeText: 'text-rose-600 dark:text-rose-400',
  },
  {
    key: 'improvement',
    labelKey: 'feedback.categories.improvement',
    icon: Rocket,
    activeBg: 'bg-blue-500/10 dark:bg-blue-500/20',
    activeBorder: 'border-blue-500/50',
    activeText: 'text-blue-600 dark:text-blue-400',
  },
  {
    key: 'praise',
    labelKey: 'feedback.categories.praise',
    icon: Heart,
    activeBg: 'bg-pink-500/10 dark:bg-pink-500/20',
    activeBorder: 'border-pink-500/50',
    activeText: 'text-pink-600 dark:text-pink-400',
  },
  {
    key: 'general',
    labelKey: 'feedback.categories.general',
    icon: MessageSquare,
    activeBg: 'bg-primary/10 dark:bg-primary/20',
    activeBorder: 'border-primary/50',
    activeText: 'text-primary',
  },
];

interface UploadingAttachment {
  id: string;
  filename: string;
  content_type: string;
  file_size_bytes: number;
  previewUrl: string;
  isUploading: boolean;
  url?: string;
}

const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_ATTACHMENTS = 5;

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function generateIdempotencyKey(): string {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : 'idemp-' + Date.now();
}

export const FeedbackDialog: React.FC<FeedbackDialogProps> = ({
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  defaultCategory = 'feature',
}) => {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const activeModal = useUiStore((s) => s.activeModal);
  const closeModal = useUiStore((s) => s.closeModal);

  // Support both controlled props and store-driven state
  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : activeModal === 'feedback';

  const [category, setCategory] = useState<FeedbackCategory>(defaultCategory);
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [idempotencyKey, setIdempotencyKey] = useState<string>(generateIdempotencyKey);
  const [attachments, setAttachments] = useState<UploadingAttachment[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      attachments.forEach((att) => {
        if (att.previewUrl.startsWith('blob:')) {
          URL.revokeObjectURL(att.previewUrl);
        }
      });
    };
  }, [attachments]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setIdempotencyKey(generateIdempotencyKey());
    }
    if (isControlled) {
      controlledOnOpenChange?.(nextOpen);
    } else {
      if (!nextOpen) {
        closeModal();
      }
    }
  };

  const activeRating = hoverRating ?? rating;

  const getRatingDescription = (starCount: number) => {
    switch (starCount) {
      case 1:
        return t('feedback.ratingDesc.1');
      case 2:
        return t('feedback.ratingDesc.2');
      case 3:
        return t('feedback.ratingDesc.3');
      case 4:
        return t('feedback.ratingDesc.4');
      case 5:
        return t('feedback.ratingDesc.5');
      default:
        return '';
    }
  };

  const uploadFile = async (file: File) => {
    if (!ALLOWED_MIME_TYPES.includes(file.type.toLowerCase())) {
      toast.error(t('feedback.attachments.invalidType'));
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error(t('feedback.attachments.tooLarge'));
      return;
    }
    if (attachments.length >= MAX_ATTACHMENTS) {
      toast.error(t('feedback.attachments.maxCount'));
      return;
    }

    const tempId = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : 'att-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);

    const previewUrl = typeof URL !== 'undefined' && URL.createObjectURL
      ? URL.createObjectURL(file)
      : '';

    const newAttachment: UploadingAttachment = {
      id: tempId,
      filename: file.name,
      content_type: file.type,
      file_size_bytes: file.size,
      previewUrl,
      isUploading: true,
    };

    setAttachments((prev) => [...prev, newAttachment]);

    try {
      // 1. Request presigned URL from BFF
      const presignRes = await apiFetch<ApiResponse<FeedbackPresignResponse>>(
        '/api/feedback/presign',
        {
          method: 'POST',
          body: JSON.stringify({
            filename: file.name,
            content_type: file.type,
            file_size_bytes: file.size,
          }),
        }
      );

      const presignData = presignRes.data;
      if (!presignData?.upload_url) {
        throw new Error('Upload URL missing from presign response');
      }
      const uploadUrl = presignData.upload_url;
      const finalUrl = presignData.download_url || uploadUrl.split('?')[0];

      // 2. Direct PUT to S3
      const s3Res = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type,
        },
        body: file,
      });

      if (!s3Res.ok) {
        throw new Error(`S3 upload error: ${s3Res.status}`);
      }

      // 3. Mark as uploaded
      setAttachments((prev) =>
        prev.map((att) =>
          att.id === tempId ? { ...att, isUploading: false, url: finalUrl } : att
        )
      );
    } catch {
      setAttachments((prev) => prev.filter((att) => att.id !== tempId));
      toast.error(t('feedback.attachments.uploadFailed'));
    }
  };

  const handleFilesSelected = (files: FileList | File[] | null) => {
    if (!files) return;
    const fileArray = Array.from(files);
    fileArray.slice(0, MAX_ATTACHMENTS - attachments.length).forEach(uploadFile);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments((prev) => {
      const target = prev.find((att) => att.id === id);
      if (target && target.previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((att) => att.id !== id);
    });
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          e.preventDefault();
          const ext = item.type.split('/')[1] || 'png';
          const screenshotFile = new File([file], `screenshot-${Date.now()}.${ext}`, {
            type: item.type,
          });
          uploadFile(screenshotFile);
        }
      }
    }
  };

  const isTitleValid = title.trim().length >= 4;
  const isMessageValid = message.trim().length >= 10;
  const isAnyAttachmentUploading = attachments.some((att) => att.isUploading);
  const canSubmit = isTitleValid && isMessageValid && rating >= 1 && !isSubmitting && !isAnyAttachmentUploading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setIsSubmitting(true);
    try {
      const resolvedName = isAnonymous
        ? undefined
        : user
          ? user.full_name || undefined
          : guestName.trim() || undefined;

      const resolvedEmail = isAnonymous
        ? undefined
        : user
          ? user.email || undefined
          : guestEmail.trim() || undefined;

      const validAttachments: FeedbackAttachment[] = attachments
        .filter((att) => att.url && !att.isUploading)
        .map((att) => ({
          url: att.url as string,
          filename: att.filename,
          content_type: att.content_type,
          file_size_bytes: att.file_size_bytes,
        }));

      const payload = {
        title: title.trim(),
        category,
        rating,
        message: message.trim(),
        user_name: resolvedName,
        user_email: resolvedEmail,
        idempotency_key: idempotencyKey,
        attachments: validAttachments,
        metadata: {
          page: typeof window !== 'undefined' ? window.location.pathname : '',
          user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
          screen_size:
            typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : '',
          timestamp: new Date().toISOString(),
        },
      };

      await apiFetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify(payload),
      });

      toast.success(t('feedback.successTitle'), {
        description: t('feedback.successDescription'),
      });

      // Clear form
      setTitle('');
      setMessage('');
      setCategory(defaultCategory);
      setRating(5);
      setGuestName('');
      setGuestEmail('');
      setIsAnonymous(false);
      setAttachments([]);
      handleOpenChange(false);
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        if (err.status === 429) {
          toast.error(t('feedback.rateLimitExceeded'));
          return;
        }
        toast.error(err.message || t('feedback.errorTitle'));
      } else {
        toast.error(t('feedback.errorTitle'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-xl max-h-[90vh] overflow-y-auto border-border/80 bg-background/95 backdrop-blur-md shadow-2xl"
        data-testid="feedback-dialog"
        onPaste={handlePaste}
      >
        <DialogHeader className="space-y-1.5">
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
              <Sparkles className="h-4 w-4" />
            </span>
            {t('feedback.dialogTitle')}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {t('feedback.dialogDescription')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pt-2">
          {/* Category Selector */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-foreground">
              {t('feedback.categoryLabel')}
            </Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {CATEGORY_OPTIONS.map((opt) => {
                const isSelected = category === opt.key;
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setCategory(opt.key)}
                    disabled={isSubmitting}
                    data-testid={`feedback-category-${opt.key}`}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-all text-left cursor-pointer',
                      isSelected
                        ? cn(opt.activeBg, opt.activeBorder, opt.activeText, 'ring-1 ring-primary/30 shadow-xs')
                        : 'border-border/60 bg-card/40 text-muted-foreground hover:bg-secondary/40 hover:text-foreground'
                    )}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{t(opt.labelKey)}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Star Rating */}
          <div className="space-y-2 rounded-xl bg-secondary/30 p-3.5 border border-border/50">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-foreground">
                {t('feedback.ratingLabel')}
              </Label>
              <span className="text-xs font-semibold text-amber-500 dark:text-amber-400">
                {getRatingDescription(activeRating)}
              </span>
            </div>
            <div className="flex items-center gap-2" role="group" aria-label="Rating">
              {[1, 2, 3, 4, 5].map((starNum) => {
                const isFilled = starNum <= activeRating;
                return (
                  <button
                    key={starNum}
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => setRating(starNum)}
                    onMouseEnter={() => setHoverRating(starNum)}
                    onMouseLeave={() => setHoverRating(null)}
                    data-testid={`feedback-rating-star-${starNum}`}
                    aria-label={`${starNum} Star`}
                    className="p-1 rounded-md transition-transform hover:scale-125 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
                  >
                    <Star
                      className={cn(
                        'h-6 w-6 transition-colors',
                        isFilled
                          ? 'text-amber-400 fill-amber-400 drop-shadow-[0_2px_8px_rgba(251,191,36,0.4)]'
                          : 'text-muted-foreground/40 hover:text-amber-300'
                      )}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Feedback Title */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="feedback-title" className="text-xs font-semibold text-foreground">
                {t('feedback.titleLabel')}
              </Label>
              <span
                className={cn(
                  'text-[10px] font-medium',
                  title.length > 0 && !isTitleValid ? 'text-rose-500 font-bold' : 'text-muted-foreground'
                )}
              >
                {title.length} / 200
              </span>
            </div>
            <Input
              id="feedback-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isSubmitting}
              placeholder={t('feedback.titlePlaceholder')}
              maxLength={200}
              className="text-xs"
              data-testid="feedback-title-input"
            />
            {title.length > 0 && !isTitleValid && (
              <p className="text-[11px] text-rose-500 font-medium">
                {t('feedback.validation.titleMin')}
              </p>
            )}
          </div>

          {/* Feedback Message */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="feedback-message" className="text-xs font-semibold text-foreground">
                {t('feedback.messageLabel')}
              </Label>
              <span
                className={cn(
                  'text-[10px] font-medium',
                  message.length > 0 && !isMessageValid ? 'text-rose-500 font-bold' : 'text-muted-foreground'
                )}
              >
                {message.length} / 3000
              </span>
            </div>
            <Textarea
              id="feedback-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={isSubmitting}
              placeholder={t('feedback.messagePlaceholder')}
              rows={4}
              maxLength={3000}
              className="text-xs resize-none"
              data-testid="feedback-message-input"
            />
            {message.length > 0 && !isMessageValid && (
              <p className="text-[11px] text-rose-500 font-medium">
                {t('feedback.validation.messageMin')}
              </p>
            )}
          </div>

          {/* Attachments Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Paperclip className="h-3.5 w-3.5 text-primary" />
                <span>{t('feedback.attachments.label')}</span>
              </Label>
              <span className="text-[10px] text-muted-foreground">
                {attachments.length} / {MAX_ATTACHMENTS}
              </span>
            </div>

            {/* Dropzone */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
              multiple
              className="hidden"
              data-testid="feedback-file-input"
              onChange={(e) => handleFilesSelected(e.target.files)}
            />

            {attachments.length < MAX_ATTACHMENTS && (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragOver(false);
                  handleFilesSelected(e.dataTransfer.files);
                }}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  'group flex flex-col items-center justify-center p-4 border border-dashed rounded-xl cursor-pointer transition-all duration-200 text-center select-none',
                  isDragOver
                    ? 'border-primary bg-primary/10 shadow-xs'
                    : 'border-border/70 hover:border-primary/50 hover:bg-secondary/20 bg-card/20'
                )}
                data-testid="feedback-dropzone"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary/60 text-primary mb-2 group-hover:scale-110 transition-transform">
                  <UploadCloud className="h-5 w-5" />
                </div>
                <p className="text-xs font-medium text-foreground">
                  {t('feedback.attachments.dropzoneText')}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {t('feedback.attachments.hint')}
                </p>
                <p className="text-[10px] text-primary/80 mt-1 font-medium flex items-center gap-1">
                  <span>✨</span>
                  <span>{t('feedback.attachments.pasteHint')}</span>
                </p>
              </div>
            )}

            {/* Attachments List */}
            {attachments.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1" data-testid="feedback-attachments-list">
                {attachments.map((att) => (
                  <div
                    key={att.id}
                    data-testid={`feedback-attachment-item-${att.id}`}
                    className="relative flex items-center gap-2.5 p-2 rounded-lg border border-border/60 bg-secondary/20 group hover:border-border transition-all"
                  >
                    {/* Thumbnail preview */}
                    <div className="relative h-11 w-11 rounded-md overflow-hidden bg-secondary/80 border border-border/40 shrink-0 flex items-center justify-center">
                      {att.previewUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={att.previewUrl}
                          alt={att.filename}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <ImageIcon className="h-5 w-5 text-muted-foreground" />
                      )}
                      {att.isUploading && (
                        <div className="absolute inset-0 bg-background/80 flex items-center justify-center backdrop-blur-xs">
                          <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        </div>
                      )}
                    </div>

                    {/* Metadata */}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-foreground truncate" title={att.filename}>
                        {att.filename}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {att.isUploading ? (
                          <span className="text-primary font-medium flex items-center gap-1">
                            <Loader2 className="h-2.5 w-2.5 animate-spin" />
                            {t('feedback.attachments.uploading')}
                          </span>
                        ) : (
                          formatBytes(att.file_size_bytes)
                        )}
                      </p>
                    </div>

                    {/* Remove button */}
                    <button
                      type="button"
                      onClick={() => handleRemoveAttachment(att.id)}
                      data-testid={`feedback-attachment-remove-${att.id}`}
                      aria-label={t('feedback.attachments.remove')}
                      className="p-1 rounded-md text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* User Identity Section */}
          <div className="rounded-xl border border-border/60 bg-card/30 p-3.5 space-y-3">
            {user ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="h-8 w-8 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-xs shrink-0">
                      {user.full_name ? user.full_name[0].toUpperCase() : 'U'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">
                        {isAnonymous
                          ? t('feedback.userSection.anonymousToggle')
                          : user.full_name || user.email}
                      </p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {isAnonymous ? 'Anonim' : user.email}
                      </p>
                    </div>
                  </div>
                  <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
                </div>

                <div className="flex items-center gap-2 pt-1 border-t border-border/40">
                  <Checkbox
                    id="feedback-anonymous-user"
                    checked={isAnonymous}
                    onCheckedChange={(checked) => setIsAnonymous(Boolean(checked))}
                    data-testid="feedback-anonymous-toggle"
                  />
                  <Label
                    htmlFor="feedback-anonymous-user"
                    className="text-xs text-muted-foreground cursor-pointer font-normal"
                  >
                    {t('feedback.userSection.anonymousToggle')}
                  </Label>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-start gap-2 text-xs text-muted-foreground">
                  <User className="h-3.5 w-3.5 shrink-0 mt-0.5 text-muted-foreground" />
                  <span>{t('feedback.userSection.guestNote')}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="feedback-guest-name" className="text-[11px] text-muted-foreground">
                      {t('feedback.userSection.nameLabel')}
                    </Label>
                    <Input
                      id="feedback-guest-name"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      disabled={isSubmitting}
                      placeholder={t('feedback.userSection.namePlaceholder')}
                      className="text-xs h-8"
                      data-testid="feedback-name-input"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="feedback-guest-email" className="text-[11px] text-muted-foreground">
                      {t('feedback.userSection.emailLabel')}
                    </Label>
                    <Input
                      id="feedback-guest-email"
                      type="email"
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                      disabled={isSubmitting}
                      placeholder={t('feedback.userSection.emailPlaceholder')}
                      className="text-xs h-8"
                      data-testid="feedback-email-input"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="pt-2 sm:justify-between gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
              className="text-xs"
              data-testid="feedback-cancel-btn"
            >
              {t('feedback.cancelButton')}
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={!canSubmit}
              className="text-xs gap-1.5"
              data-testid="feedback-submit-btn"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>{t('feedback.submitting')}</span>
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
                  <span>{t('feedback.submitButton')}</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
