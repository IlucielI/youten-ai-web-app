'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useMeetingBotStore } from '@/stores/meeting-bot.store';
import { BotProvider } from '@/server/constants/recording.constant';
import { TemplateKey, DefaultTemplateKey } from '@/server/constants/template.constant';
import { ProviderSelector } from '@/components/molecules/provider-selector';
import { SearchableSelect, SearchableSelectOption } from '@/components/molecules/searchable-select';
import { Button } from '@/components/atoms/button';
import { Input } from '@/components/atoms/input';
import { Label } from '@/components/atoms/label';
import {
  Bot,
  AlertCircle,
  Loader2,
  Link as LinkIcon,
  ShieldCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface MeetingBotFormProps {
  onSuccess?: (sessionId: string) => void;
  className?: string;
}

export function MeetingBotForm({ onSuccess, className }: MeetingBotFormProps) {
  const {
    selectedProvider,
    setProvider,
    capabilities,
    fetchCapabilities,
    isDispatching,
    dispatchBot,
    error: storeError,
    clearError,
  } = useMeetingBotStore();

  const [meetingUrl, setMeetingUrl] = useState('');
  const [guildId, setGuildId] = useState('');
  const [channelId, setChannelId] = useState('');
  const [title, setTitle] = useState('');
  const [template, setTemplate] = useState<TemplateKey>(DefaultTemplateKey);
  const [language, setLanguage] = useState('id');
  const [validationError, setValidationError] = useState<string | null>(null);

  const templateOptions: SearchableSelectOption[] = useMemo(
    () => [
      { value: 'MOM', label: 'Minutes of Meeting (MOM)', description: 'Ringkasan formal & poin pembahasan' },
      { value: 'EXECUTIVE', label: 'Executive Summary', description: 'Ikhtisar tingkat tinggi bagi manajemen' },
      { value: 'ACTION_ITEMS', label: 'Action Items & Tasks', description: 'Daftar penugasan dan tindak lanjut' },
      { value: 'STANDUP', label: 'Daily Standup', description: 'Status harian dan hambatan tim' },
    ],
    []
  );

  const languageOptions: SearchableSelectOption[] = useMemo(
    () => [
      { value: 'id', label: 'Bahasa Indonesia', description: 'Transkripsi ujaran bahasa Indonesia' },
      { value: 'en', label: 'English', description: 'English speech transcription' },
    ],
    []
  );

  useEffect(() => {
    fetchCapabilities();
  }, [fetchCapabilities]);

  const handleProviderChange = (provider: BotProvider) => {
    setProvider(provider);
    setValidationError(null);
    clearError();
  };

  const validate = (): boolean => {
    setValidationError(null);

    if (selectedProvider === BotProvider.DISCORD) {
      if (!guildId.trim()) {
        setValidationError('Server ID / Guild ID Discord wajib diisi');
        return false;
      }
      if (!channelId.trim()) {
        setValidationError('Voice Channel ID Discord wajib diisi');
        return false;
      }
      return true;
    }

    if (!meetingUrl.trim()) {
      setValidationError('Tautan rapat (Meeting URL) wajib diisi');
      return false;
    }

    try {
      const parsed = new URL(meetingUrl.trim());
      const host = parsed.hostname.toLowerCase();

      if (selectedProvider === BotProvider.GOOGLE_MEET && host !== 'meet.google.com') {
        setValidationError('Tautan harus berupa alamat resmi Google Meet (meet.google.com)');
        return false;
      }

      if (
        selectedProvider === BotProvider.ZOOM &&
        host !== 'zoom.us' &&
        host !== 'zoom.com' &&
        !host.endsWith('.zoom.us') &&
        !host.endsWith('.zoom.com')
      ) {
        setValidationError('Tautan harus berupa alamat resmi Zoom Meetings (zoom.us)');
        return false;
      }

      if (
        selectedProvider === BotProvider.MS_TEAMS &&
        host !== 'teams.microsoft.com' &&
        host !== 'teams.live.com' &&
        !host.endsWith('.teams.microsoft.com') &&
        !host.endsWith('.teams.live.com')
      ) {
        setValidationError('Tautan harus berupa alamat resmi Microsoft Teams');
        return false;
      }
    } catch {
      setValidationError('Format tautan tidak valid, sertakan http:// atau https://');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      const sessionId = await dispatchBot({
        meeting_url: selectedProvider !== BotProvider.DISCORD ? meetingUrl.trim() : undefined,
        guild_id: selectedProvider === BotProvider.DISCORD ? guildId.trim() : undefined,
        channel_id: selectedProvider === BotProvider.DISCORD ? channelId.trim() : undefined,
        title: title.trim() || undefined,
        template,
        language,
      });

      if (onSuccess) {
        onSuccess(sessionId);
      }
    } catch {
      // Error handled by store
    }
  };

  const activeError = validationError || storeError;

  return (
    <form
      onSubmit={handleSubmit}
      data-testid="meeting-bot-form"
      className={cn('space-y-6 text-left', className)}
    >
      <ProviderSelector
        selectedProvider={selectedProvider}
        onSelectProvider={handleProviderChange}
        capabilities={capabilities}
        disabled={isDispatching}
      />

      {/* Dynamic Input based on provider */}
      <div className="space-y-4 pt-1">
        {selectedProvider === BotProvider.DISCORD ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" data-testid="discord-inputs-container">
            <div className="space-y-1.5">
              <Label htmlFor="discord-guild-id" className="text-xs font-medium text-foreground">
                Discord Server ID (Guild ID) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="discord-guild-id"
                data-testid="discord-guild-id-input"
                placeholder="misal: 102938475610293847"
                value={guildId}
                onChange={(e) => {
                  setGuildId(e.target.value);
                  setValidationError(null);
                }}
                disabled={isDispatching}
                className="text-xs h-9"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="discord-channel-id" className="text-xs font-medium text-foreground">
                Voice Channel ID <span className="text-destructive">*</span>
              </Label>
              <Input
                id="discord-channel-id"
                data-testid="discord-channel-id-input"
                placeholder="misal: 987654321098765432"
                value={channelId}
                onChange={(e) => {
                  setChannelId(e.target.value);
                  setValidationError(null);
                }}
                disabled={isDispatching}
                className="text-xs h-9"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-1.5" data-testid="meeting-url-container">
            <Label htmlFor="meeting-url" className="text-xs font-medium text-foreground flex items-center gap-1.5">
              <LinkIcon className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Tautan Rapat (Meeting URL)</span>
              <span className="text-destructive">*</span>
            </Label>
            <Input
              id="meeting-url"
              data-testid="meeting-url-input"
              placeholder={
                selectedProvider === BotProvider.GOOGLE_MEET
                  ? 'https://meet.google.com/abc-defg-hij'
                  : selectedProvider === BotProvider.ZOOM
                  ? 'https://zoom.us/j/123456789?pwd=...'
                  : 'https://teams.microsoft.com/l/meetup-join/...'
              }
              value={meetingUrl}
              onChange={(e) => {
                setMeetingUrl(e.target.value);
                setValidationError(null);
              }}
              disabled={isDispatching}
              className="text-xs h-9"
            />
          </div>
        )}

        {/* Optional Title & Settings */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="space-y-1.5 sm:col-span-1">
            <Label htmlFor="meeting-title" className="text-xs font-medium text-foreground">
              Judul Notula (Opsional)
            </Label>
            <Input
              id="meeting-title"
              data-testid="meeting-title-input"
              placeholder="e.g. All-Hands Q4"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isDispatching}
              className="text-xs h-9"
            />
          </div>

          <div className="space-y-1.5 sm:col-span-1">
            <Label htmlFor="meeting-template" className="text-xs font-medium text-foreground">
              Template Notula
            </Label>
            <SearchableSelect
              id="meeting-template"
              data-testid="meeting-template-select"
              value={template}
              onValueChange={(val) => setTemplate(val as TemplateKey)}
              options={templateOptions}
              disabled={isDispatching}
              placeholder="Pilih template..."
              searchPlaceholder="Cari template notula..."
            />
          </div>

          <div className="space-y-1.5 sm:col-span-1">
            <Label htmlFor="meeting-language" className="text-xs font-medium text-foreground">
              Bahasa Rapat
            </Label>
            <SearchableSelect
              id="meeting-language"
              data-testid="meeting-language-select"
              value={language}
              onValueChange={setLanguage}
              options={languageOptions}
              disabled={isDispatching}
              placeholder="Pilih bahasa..."
              searchPlaceholder="Cari bahasa..."
            />
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {activeError && (
        <div
          data-testid="meeting-bot-error-alert"
          className="flex items-center gap-2 p-3 text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-lg animate-in fade-in"
        >
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{activeError}</span>
        </div>
      )}

      {/* Bot Joining Privacy Note */}
      <div className="rounded-lg border border-border/50 bg-muted/20 p-3 flex items-start gap-2.5 text-xs text-muted-foreground">
        <ShieldCheck className="h-4 w-4 text-primary shrink-0 mt-0.5" />
        <span className="leading-relaxed">
          Bot akan bergabung dengan nama <strong>YouTen AI Notetaker</strong>. Pastikan host memberikan izin masuk jika ruang rapat dikunci dengan ruang tunggu (*waiting room*).
        </span>
      </div>

      {/* Submit Action */}
      <Button
        type="submit"
        data-testid="meeting-bot-submit-btn"
        disabled={isDispatching}
        className="w-full h-10 gap-2 text-xs font-semibold"
      >
        {isDispatching ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Mengirim Bot ke Rapat...</span>
          </>
        ) : (
          <>
            <Bot className="h-4 w-4" />
            <span>
              {selectedProvider === BotProvider.DISCORD
                ? 'Kirim Bot ke Voice Channel'
                : 'Undang Bot ke Rapat'}
            </span>
          </>
        )}
      </Button>
    </form>
  );
}
