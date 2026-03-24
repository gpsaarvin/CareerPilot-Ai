'use client';
import { useTheme } from '@/context/ThemeContext';

export default function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="relative inline-flex h-10 w-20 items-center rounded-full border px-1 transition-all app-surface"
      aria-label="Toggle dark and light mode"
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <span
        className={`absolute top-1 h-8 w-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 shadow-md transition-transform ${
          isDark ? 'translate-x-0' : 'translate-x-10 bg-gradient-to-br from-indigo-500 to-violet-600'
        }`}
      />
      <span className="z-10 flex w-full justify-between px-2 text-sm">
        <span>☀</span>
        <span>🌙</span>
      </span>
    </button>
  );
}
