'use client';

import React, { useState, useMemo } from 'react';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/atoms/button';
import { Badge } from '@/components/atoms/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/atoms/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/atoms/command';
import { useTranslation } from '@/locales';

export interface SearchableSelectOption {
  value: string;
  label: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  badge?: string;
  disabled?: boolean;
}

export interface SearchableSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  options: readonly SearchableSelectOption[] | SearchableSelectOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
  clearable?: boolean;
  className?: string;
  triggerClassName?: string;
  contentClassName?: string;
  id?: string;
  name?: string;
  'data-testid'?: string;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  value,
  onValueChange,
  options,
  placeholder,
  searchPlaceholder,
  emptyText,
  disabled = false,
  clearable = false,
  className,
  triggerClassName,
  contentClassName,
  id,
  name,
  'data-testid': dataTestId,
}) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const defaultPlaceholder = placeholder || t('common.actions.filter');
  const defaultSearchPlaceholder =
    searchPlaceholder || `${t('common.actions.search')}...`;
  const defaultEmptyText = emptyText || 'Tidak ada pilihan yang cocok';

  // Find currently selected option
  const selectedOption = useMemo(
    () => options.find((opt) => opt.value === value),
    [options, value]
  );

  const SelectedIcon = selectedOption?.icon;

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onValueChange('');
  };

  return (
    <div className={cn('relative w-full', className)}>
      {/* Hidden native select for form compatibility and test assertion resilience */}
      <select
        id={id}
        name={name}
        data-testid={dataTestId}
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        disabled={disabled}
        tabIndex={-1}
        aria-hidden="true"
        className="sr-only pointer-events-none absolute -m-px h-px w-px overflow-hidden whitespace-nowrap border-0 p-0"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} disabled={opt.disabled}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* Interactive Popover Combobox (Select2-style searchable dropdown) */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            data-testid={dataTestId ? `${dataTestId}-trigger` : undefined}
            variant="outline"
            className={cn(
              'h-10 w-full justify-between rounded-lg border border-border/80 bg-background/95 px-3 py-2 text-sm font-normal text-foreground shadow-xs hover:bg-accent/40 focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer',
              !selectedOption && 'text-muted-foreground',
              triggerClassName
            )}
          >
            <div className="flex items-center gap-2 truncate text-left flex-1 min-w-0">
              {SelectedIcon && (
                <SelectedIcon className="w-4 h-4 text-primary shrink-0" />
              )}
              <span className="truncate">
                {selectedOption ? selectedOption.label : defaultPlaceholder}
              </span>
              {selectedOption?.badge && (
                <Badge
                  variant="secondary"
                  className="text-[10px] px-1.5 py-0 shrink-0 font-medium ml-1"
                >
                  {selectedOption.badge}
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-1 shrink-0 ml-2 text-muted-foreground">
              {clearable && value && !disabled && (
                <span
                  role="button"
                  tabIndex={0}
                  aria-label="Clear selection"
                  onClick={handleClear}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleClear(e as unknown as React.MouseEvent);
                    }
                  }}
                  className="p-0.5 rounded-full hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </span>
              )}
              <ChevronsUpDown className="w-4 h-4 opacity-50 shrink-0" />
            </div>
          </Button>
        </PopoverTrigger>

        <PopoverContent
          align="start"
          sideOffset={4}
          className={cn(
            'w-[var(--radix-popover-trigger-width)] min-w-[220px] p-0 shadow-lg border border-border/80 bg-popover rounded-xl overflow-hidden z-50',
            contentClassName
          )}
        >
          <Command
            filter={(itemValue, search) => {
              if (itemValue.toLowerCase().includes(search.toLowerCase())) return 1;
              return 0;
            }}
          >
            <CommandInput
              placeholder={defaultSearchPlaceholder}
              data-testid={dataTestId ? `${dataTestId}-search-input` : undefined}
              className="h-9 text-xs"
            />
            <CommandList className="max-h-60 overflow-y-auto p-1">
              <CommandEmpty className="py-4 text-center text-xs text-muted-foreground">
                {defaultEmptyText}
              </CommandEmpty>
              <CommandGroup>
                {options.map((opt) => {
                  const isSelected = value === opt.value;
                  const Icon = opt.icon;
                  // Encode label and value for cmdk search indexing
                  const searchIndex = `${opt.label} ${opt.value} ${opt.description || ''} ${opt.badge || ''}`;

                  return (
                    <CommandItem
                      key={opt.value || '__all__'}
                      value={searchIndex}
                      disabled={opt.disabled}
                      data-testid={
                        dataTestId ? `${dataTestId}-option-${opt.value}` : undefined
                      }
                      onSelect={() => {
                        onValueChange(opt.value);
                        setOpen(false);
                      }}
                      className={cn(
                        'flex items-center justify-between gap-2 px-2.5 py-2 text-xs rounded-lg cursor-pointer transition-colors',
                        isSelected
                          ? 'bg-primary/10 text-primary font-medium'
                          : 'hover:bg-accent/60 text-foreground'
                      )}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        {Icon && (
                          <Icon
                            className={cn(
                              'w-3.5 h-3.5 shrink-0',
                              isSelected ? 'text-primary' : 'text-muted-foreground'
                            )}
                          />
                        )}
                        <div className="flex flex-col min-w-0 truncate">
                          <span className="truncate">{opt.label}</span>
                          {opt.description && (
                            <span className="text-[10px] text-muted-foreground truncate">
                              {opt.description}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 ml-1">
                        {opt.badge && (
                          <Badge
                            variant="secondary"
                            className="text-[9px] px-1 py-0 font-normal"
                          >
                            {opt.badge}
                          </Badge>
                        )}
                        {isSelected && (
                          <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                        )}
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};
