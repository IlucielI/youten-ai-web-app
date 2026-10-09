'use client';

import React from 'react';
import { BotProvider } from '@/server/constants/recording.constant';
import type { MeetingBotCapabilities } from '@/server/dtos/meeting-bot.dto';
import { cn } from '@/lib/utils';
import { Video, Monitor, PhoneCall, Headphones, Check } from 'lucide-react';

export interface ProviderSelectorProps {
  selectedProvider: BotProvider;
  onSelectProvider: (provider: BotProvider) => void;
  capabilities?: MeetingBotCapabilities | null;
  disabled?: boolean;
  className?: string;
}

interface ProviderMeta {
  id: BotProvider;
  name: string;
  domainHint: string;
  icon: React.ComponentType<{ className?: string }>;
}

const PROVIDERS: ProviderMeta[] = [
  {
    id: BotProvider.GOOGLE_MEET,
    name: 'Google Meet',
    domainHint: 'meet.google.com',
    icon: Video,
  },
  {
    id: BotProvider.ZOOM,
    name: 'Zoom Meetings',
    domainHint: 'zoom.us / Meeting ID',
    icon: Monitor,
  },
  {
    id: BotProvider.MS_TEAMS,
    name: 'Microsoft Teams',
    domainHint: 'teams.microsoft.com',
    icon: PhoneCall,
  },
  {
    id: BotProvider.DISCORD,
    name: 'Discord Voice',
    domainHint: 'Voice Channel',
    icon: Headphones,
  },
];

export function ProviderSelector({
  selectedProvider,
  onSelectProvider,
  capabilities,
  disabled = false,
  className,
}: ProviderSelectorProps) {
  return (
    <div className={cn('space-y-3', className)} data-testid="provider-selector">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Pilih Platform Meeting
        </label>
        <span className="text-[11px] text-muted-foreground">Bot otomatis masuk & mencatat notula</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {PROVIDERS.map((p) => {
          const isSelected = selectedProvider === p.id;
          const status = capabilities ? capabilities[p.id as keyof MeetingBotCapabilities] : 'available';
          const isAvailable = status === 'available';
          const Icon = p.icon;

          return (
            <button
              key={p.id}
              type="button"
              disabled={disabled}
              onClick={() => onSelectProvider(p.id)}
              data-testid={`provider-option-${p.id}`}
              className={cn(
                'relative flex flex-col items-start p-3 rounded-xl border text-left transition-all duration-200 outline-none select-none',
                'hover:border-foreground/30 hover:bg-muted/40',
                isSelected
                  ? 'border-primary bg-primary/5 ring-2 ring-primary/20 shadow-xs'
                  : 'border-border/70 bg-card/60',
                disabled && 'opacity-60 cursor-not-allowed'
              )}
            >
              {isSelected && (
                <div
                  data-testid={`provider-selected-indicator-${p.id}`}
                  className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px]"
                >
                  <Check className="h-2.5 w-2.5 stroke-[3]" />
                </div>
              )}

              <div
                className={cn(
                  'w-8 h-8 rounded-lg flex items-center justify-center mb-2 transition-colors',
                  isSelected
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground group-hover:text-foreground'
                )}
              >
                <Icon className="h-4 w-4" />
              </div>

              <div className="space-y-0.5 w-full pr-4">
                <span className="text-xs font-bold text-foreground block truncate">{p.name}</span>
                <span className="text-[10px] text-muted-foreground block truncate">{p.domainHint}</span>
              </div>

              <div className="mt-2.5">
                <span
                  data-testid={`provider-status-${p.id}`}
                  className={cn(
                    'inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-semibold border',
                    isAvailable
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                  )}
                >
                  {isAvailable ? 'Siap Pakai' : 'Beta'}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
