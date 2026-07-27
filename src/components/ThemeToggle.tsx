import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';

const key = 'mount-zion-theme';

function initialTheme() {
  const stored = localStorage.getItem(key);
  if (stored === 'dark' || stored === 'light') return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function useTheme() {
  const [theme, setTheme] = useState<'light' | 'dark'>(initialTheme);
  useEffect(() => { document.documentElement.classList.toggle('dark', theme === 'dark'); localStorage.setItem(key, theme); }, [theme]);
  return { theme, setTheme };
}

export function ThemeToggle({ theme, setTheme }: ReturnType<typeof useTheme>) {
  const dark = theme === 'dark';
  return <button type="button" onClick={() => setTheme(dark ? 'light' : 'dark')} className="inline-flex items-center gap-2 rounded-lg border border-stone-300 px-3 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-100 dark:border-stone-600 dark:text-stone-200 dark:hover:bg-stone-800" aria-label={`Use ${dark ? 'light' : 'dark'} mode`}><>{dark ? <Sun size={16} /> : <Moon size={16} />}</><span className="hidden sm:inline">{dark ? 'Light' : 'Dark'}</span></button>;
}
