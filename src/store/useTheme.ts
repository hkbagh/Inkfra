import { create } from 'zustand'

export type Theme = 'professional' | 'slack'

interface ThemeStore {
  theme: Theme
  setTheme: (t: Theme) => void
  toggle: () => void
}

const stored = typeof localStorage !== 'undefined' ? localStorage.getItem('inkfra-theme') : null

export const useTheme = create<ThemeStore>((set, get) => ({
  theme: (stored === 'slack' ? 'slack' : 'professional'),
  setTheme: (t) => {
    set({ theme: t })
    if (typeof localStorage !== 'undefined') localStorage.setItem('inkfra-theme', t)
    if (typeof document !== 'undefined') document.documentElement.setAttribute('data-theme', t)
  },
  toggle: () => {
    const next = get().theme === 'professional' ? 'slack' : 'professional'
    get().setTheme(next)
  },
}))

// initialize attribute
if (typeof document !== 'undefined') {
  document.documentElement.setAttribute('data-theme', useTheme.getState().theme)
}
