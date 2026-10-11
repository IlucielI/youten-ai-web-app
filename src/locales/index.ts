import { idDictionary, AppDictionary } from './id';
import { enDictionary } from './en';
import { useLocaleStore } from '@/stores/locale.store';

export type Locale = 'id' | 'en';
export const DEFAULT_LOCALE: Locale = 'id';
export const SUPPORTED_LOCALES: Locale[] = ['id', 'en'];

export const dictionaries: Record<Locale, AppDictionary> = {
  id: idDictionary,
  en: enDictionary,
};

export type Dictionary = AppDictionary;

type Primitive = string | number | boolean | null | undefined;

/**
 * Recursive type that extracts dot-notation paths from a nested dictionary object.
 * e.g. "landing.hero.title" | "errors.ERR_EXTRACTION_FAILED"
 */
export type NestedKeyOf<ObjectType extends object> = {
  [Key in keyof ObjectType & (string | number)]: ObjectType[Key] extends Primitive
    ? `${Key}`
    : ObjectType[Key] extends object
      ? `${Key}` | `${Key}.${NestedKeyOf<ObjectType[Key]>}`
      : `${Key}`;
}[keyof ObjectType & (string | number)];

/**
 * Pure translation lookup function. Safe to use in server actions, utilities, and components.
 */
export function getTranslation(
  locale: Locale,
  path: NestedKeyOf<Dictionary> | (string & {}),
  params?: Record<string, string | number>
): string {
  const activeDict = dictionaries[locale] || dictionaries[DEFAULT_LOCALE];
  const fallbackDict = dictionaries[DEFAULT_LOCALE];

  const keys = path.split('.');

  let currentActive: unknown = activeDict;
  let currentFallback: unknown = fallbackDict;

  for (const k of keys) {
    if (currentActive && typeof currentActive === 'object' && k in currentActive) {
      currentActive = (currentActive as Record<string, unknown>)[k];
    } else {
      currentActive = undefined;
    }

    if (currentFallback && typeof currentFallback === 'object' && k in currentFallback) {
      currentFallback = (currentFallback as Record<string, unknown>)[k];
    } else {
      currentFallback = undefined;
    }
  }

  let text = typeof currentActive === 'string' ? currentActive : undefined;
  if (!text && typeof currentFallback === 'string') {
    text = currentFallback;
  }

  if (!text) {
    return path;
  }

  if (params) {
    Object.entries(params).forEach(([paramKey, paramVal]) => {
      text = text!.replaceAll(`{${paramKey}}`, String(paramVal));
    });
  }

  return text;
}

/**
 * React hook for consuming translations with automatic reactivity to locale changes.
 */
export function useTranslation() {
  const locale = useLocaleStore((state) => state.locale);
  const setLocale = useLocaleStore((state) => state.setLocale);
  const toggleLocale = useLocaleStore((state) => state.toggleLocale);

  const t = (
    path: NestedKeyOf<Dictionary> | (string & {}),
    params?: Record<string, string | number>
  ): string => {
    return getTranslation(locale, path, params);
  };

  return {
    t,
    locale,
    setLocale,
    toggleLocale,
    dict: dictionaries[locale] || dictionaries[DEFAULT_LOCALE],
  };
}

export * from './id';
