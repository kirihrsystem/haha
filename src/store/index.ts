import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Staff, Settings } from '../types';

interface AuthState {
  user: Staff | null;
  companyId: string | null;
  companyName: string | null;
  companySlug: string | null;
  setUser: (user: Staff | null, companyId?: string, companyName?: string, companySlug?: string) => void;
  setCompanySlug: (companySlug: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      companyId: null,
      companyName: null,
      companySlug: null,
      setUser: (user, companyId, companyName, companySlug) => set((state) => ({ 
        user,
        // only update company info if provided, otherwise keep existing
        companyId: companyId !== undefined ? companyId : (user?.companyId || state.companyId),
        companyName: companyName !== undefined ? companyName : state.companyName,
        companySlug: companySlug !== undefined ? companySlug : state.companySlug
      })),
      setCompanySlug: (companySlug) => set({ companySlug }),
      logout: () => set({ user: null, companyId: null, companyName: null, companySlug: null }),
    }),
    {
      name: 'auth-storage', // name of the item in the storage (must be unique)
    }
  )
);

interface SettingsState {
  settings: Settings;
  setSettings: (settings: Settings) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  settings: {
    companyId: '',
    exchangeRate: 4000,
    defaultHourlyRate: 2,
    defaultOvertimeRate: 3,
    currencyDisplay: 'BOTH'
  },
  setSettings: (settings) => set({ settings }),
}));

interface ThemeState {
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'light',
      setTheme: (theme) => set({ theme }),
      toggleTheme: () => set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
    }),
    {
      name: 'theme-storage',
    }
  )
);

