'use client';

import React, { useState } from 'react';
import { UserCheck, Loader2 } from 'lucide-react';
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
import { Label } from '@/components/atoms/label';
import { useTranslation } from '@/locales';

export interface SpeakerRenameDialogProps {
  isOpen: boolean;
  onClose: () => void;
  speakerId: string;
  currentLabel?: string;
  onSave: (speakerId: string, newLabel: string) => Promise<void> | void;
}

interface SpeakerRenameFormProps {
  speakerId: string;
  initialLabel: string;
  onClose: () => void;
  onSave: (speakerId: string, newLabel: string) => Promise<void> | void;
}

const SpeakerRenameForm: React.FC<SpeakerRenameFormProps> = ({
  speakerId,
  initialLabel,
  onClose,
  onSave,
}) => {
  const { t } = useTranslation();
  const [label, setLabel] = useState(initialLabel);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = label.trim();

    if (!trimmed) {
      setError(t('recording.speakerRename.emptyError'));
      return;
    }

    if (trimmed.length > 100) {
      setError(t('recording.speakerRename.maxCharsError'));
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await onSave(speakerId, trimmed);
      onClose();
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : t('recording.speakerRename.genericError')
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <DialogHeader>
        <div className="flex items-center gap-2 text-primary mb-1">
          <UserCheck className="w-5 h-5" />
          <DialogTitle>{t('recording.speakerRename.title')}</DialogTitle>
        </div>
        <DialogDescription>
          {t('recording.speakerRename.description', { speakerId })}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-2 py-2">
        <Label htmlFor="speaker-name-input" className="text-xs font-semibold">
          {t('recording.speakerRename.labelInput')}
        </Label>
        <Input
          id="speaker-name-input"
          data-testid="speaker-name-input"
          type="text"
          value={label}
          onChange={(e) => {
            setLabel(e.target.value);
            if (error) setError(null);
          }}
          placeholder={t('recording.speakerRename.placeholder')}
          autoFocus
          disabled={isSubmitting}
        />
        {error && (
          <p
            data-testid="rename-error-message"
            className="text-xs text-destructive font-medium"
          >
            {error}
          </p>
        )}
      </div>

      <DialogFooter className="gap-2 sm:gap-0">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={isSubmitting}
          data-testid="cancel-rename-button"
        >
          {t('recording.speakerRename.cancelButton')}
        </Button>
        <Button
          type="submit"
          variant="default"
          disabled={isSubmitting}
          data-testid="submit-rename-button"
          className="gap-2"
        >
          {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
          <span>
            {isSubmitting
              ? t('recording.speakerRename.savingButton')
              : t('recording.speakerRename.saveButton')}
          </span>
        </Button>
      </DialogFooter>
    </form>
  );
};

export const SpeakerRenameDialog: React.FC<SpeakerRenameDialogProps> = ({
  isOpen,
  onClose,
  speakerId,
  currentLabel = '',
  onSave,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent data-testid="speaker-rename-dialog" className="sm:max-w-md">
        {isOpen && (
          <SpeakerRenameForm
            key={`${speakerId}-${currentLabel}`}
            speakerId={speakerId}
            initialLabel={currentLabel || speakerId}
            onClose={onClose}
            onSave={onSave}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};
