'use client';
// ============================================================
// SearchBar — Search input with animated icon
// ============================================================
import { useEffect, useState } from 'react';

export default function SearchBar({ onSearch, placeholder = 'Search internships, companies, skills...', initialValue = '', realtime = true }) {
  const [query, setQuery] = useState(initialValue);

  useEffect(() => {
    setQuery(initialValue);
  }, [initialValue]);

  useEffect(() => {
    if (!realtime) return undefined;

    const timer = setTimeout(() => {
      onSearch(query.trim());
    }, 420);

    return () => clearTimeout(timer);
  }, [query, onSearch, realtime]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(query.trim());
  };

  return (
    <form onSubmit={handleSubmit} className="relative w-full max-w-2xl">
      <div className="relative">
        <svg
          className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (e.target.value === '') onSearch('');
          }}
          placeholder={placeholder}
          className="w-full pl-12 pr-40 py-3.5 app-surface border rounded-2xl placeholder-gray-500 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/25 transition-all text-sm"
        />
        <span className="absolute right-24 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Live AI
        </span>
        <button
          type="submit"
          className="absolute right-2 top-1/2 -translate-y-1/2 px-5 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-medium rounded-xl hover:from-violet-500 hover:to-indigo-500 transition-all shadow-lg shadow-violet-500/20"
        >
          Search
        </button>
      </div>
    </form>
  );
}
