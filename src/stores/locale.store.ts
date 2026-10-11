import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

export type Locale = 'id' | 'en';

export interface LocaleState {
  locale: Locale;
}

export interface LocaleActions {
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
}

export type LocaleStore = LocaleState & LocaleActions;

const initialLocaleState: LocaleState = {
  locale: 'id',
};

function syncLocaleToClient(locale: Locale): void {
  if (typeof window !== 'undefined') {
    try {
      document.cookie = `youten_locale=${locale}; path=/; max-age=31536000; SameSite=Lax`;
      localStorage.setItem('youten_locale', locale);
      document.documentElement.lang = locale;
    } catch {
      // Ignore security or storage errors in restricted contexts
    }
  }
}

export const useLocaleStore = create<LocaleStore>()(
  devtools(
    persist(
      (set) => ({
        ...initialLocaleState,
        setLocale: (locale: Locale) => {
          syncLocaleToClient(locale);
          set({ locale }, false, 'locale/setLocale');
        },
        toggleLocale: () =>
          set((state) => {
            const nextLocale: Locale = state.locale === 'id' ? 'en' : 'id';
            syncLocaleToClient(nextLocale);
            return { locale: nextLocale };
          }, false, 'locale/toggleLocale'),
      }),
      {
        name: 'youten_locale_store',
      }
    ),
    { name: 'LocaleStore' }
  )
);
