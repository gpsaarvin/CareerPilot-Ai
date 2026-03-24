'use client';
// ============================================================
// FilterSidebar — Professional collapsible filters
// Mobile: slide-down panel / Desktop: sticky sidebar
// ============================================================
import { useState } from 'react';

export default function FilterSidebar({ filters = {}, activeFilters = {}, onFilterChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const { skills = [], locations = [], types = [], paid: paidOptions = ['paid', 'unpaid'] } = filters;

  const handleChange = (key, value) => {
    onFilterChange({ ...activeFilters, [key]: value === activeFilters[key] ? '' : value });
  };

  const activeCount = Object.values(activeFilters).filter(Boolean).length;

  const typeIcons = { remote: '🏠', onsite: '🏢', hybrid: '🔄' };

  const renderFilterContent = () => (
    <div className="space-y-5">
      {/* Type Filter */}
      <div>
        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2.5">Work Type</h4>
        <div className="grid grid-cols-3 gap-2">
          {types.map((t) => (
            <button
              key={t}
              onClick={() => handleChange('type', t)}
              className={`px-3 py-2 text-xs font-medium rounded-lg border text-center transition-all ${
                activeFilters.type === t
                  ? 'bg-violet-500/15 text-violet-300 border-violet-500/30'
                  : 'bg-gray-800/30 text-gray-500 border-gray-700/30 hover:border-gray-600 hover:text-gray-300'
              }`}
            >
              {typeIcons[t] || ''} {t?.charAt(0).toUpperCase() + t?.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Location Filter */}
      {locations.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2.5">Location</h4>
          <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto scrollbar-thin">
            {locations.sort().map((loc) => (
              <button
                key={loc}
                onClick={() => handleChange('location', loc)}
                className={`px-2.5 py-1.5 text-xs rounded-lg border transition-all ${
                  activeFilters.location === loc
                    ? 'bg-violet-500/15 text-violet-300 border-violet-500/30'
                    : 'bg-gray-800/30 text-gray-500 border-gray-700/30 hover:border-gray-600 hover:text-gray-300'
                }`}
              >
                {loc}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Skills Filter */}
      {skills.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2.5">Skills</h4>
          <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto scrollbar-thin">
            {skills.sort().map((skill) => (
              <button
                key={skill}
                onClick={() => handleChange('skills', skill)}
                className={`px-2.5 py-1.5 text-xs rounded-lg border transition-all ${
                  activeFilters.skills === skill
                    ? 'bg-violet-500/15 text-violet-300 border-violet-500/30'
                    : 'bg-gray-800/30 text-gray-500 border-gray-700/30 hover:border-gray-600 hover:text-gray-300'
                }`}
              >
                {skill}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Stipend Filter */}
      <div>
        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2.5">Min Stipend</h4>
        <div className="grid grid-cols-2 gap-2">
          {['10000', '20000', '30000', '50000'].map((amt) => (
            <button
              key={amt}
              onClick={() => handleChange('min_stipend', amt)}
              className={`px-3 py-2 text-xs font-medium rounded-lg border text-center transition-all ${
                activeFilters.min_stipend === amt
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                  : 'bg-gray-800/30 text-gray-500 border-gray-700/30 hover:border-gray-600 hover:text-gray-300'
              }`}
            >
              ₹{parseInt(amt).toLocaleString('en-IN')}+
            </button>
          ))}
        </div>
      </div>

      {/* Paid / Unpaid */}
      <div>
        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2.5">Compensation</h4>
        <div className="grid grid-cols-2 gap-2">
          {paidOptions.map((option) => (
            <button
              key={option}
              onClick={() => handleChange('paid', option)}
              className={`px-3 py-2 text-xs font-medium rounded-lg border text-center transition-all ${
                activeFilters.paid === option
                  ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
                  : 'bg-gray-800/30 text-gray-500 border-gray-700/30 hover:border-gray-600 hover:text-gray-300'
              }`}
            >
              {option.charAt(0).toUpperCase() + option.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Clear all */}
      {activeCount > 0 && (
        <button
          onClick={() => onFilterChange({})}
          className="w-full px-4 py-2.5 text-xs font-medium text-red-400 border border-red-500/20 rounded-xl hover:bg-red-500/10 transition-all"
        >
          Clear all filters ({activeCount})
        </button>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile toggle button */}
      <div className="lg:hidden">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between px-4 py-3 bg-gray-900/50 border border-gray-800/50 rounded-xl text-sm font-medium text-gray-300 hover:border-gray-700 transition-all"
        >
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filters
            {activeCount > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] bg-violet-500/20 text-violet-300 rounded-full">
                {activeCount}
              </span>
            )}
          </span>
          <svg
            className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Mobile filter panel */}
        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? 'max-h-[600px] opacity-100 mt-3' : 'max-h-0 opacity-0'
        }`}>
          <div className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-4">
            {renderFilterContent()}
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:block sticky top-24">
        <div className="bg-gray-900/50 border border-gray-800/50 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <svg className="w-4 h-4 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filters
          </h3>
          {renderFilterContent()}
        </div>
      </div>
    </>
  );
}
