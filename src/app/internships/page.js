'use client';
// ============================================================
// Internship Listing Page — Professional grid + filters + search
// Responsive: 1-col mobile, 2-col tablet, 3-col desktop
// ============================================================
import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import InternshipCard from '@/components/InternshipCard';
import FilterSidebar from '@/components/FilterSidebar';
import SearchBar from '@/components/SearchBar';
import { internshipAPI } from '@/lib/api';

function isLikelyCompanySearch(input) {
  if (!input) return false;
  const terms = input.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0 || terms.length > 3) return false;
  const generic = new Set(['internship', 'internships', 'intern', 'jobs', 'job', 'software', 'developer']);
  return terms.every((t) => !generic.has(t));
}

function InternshipsContent() {
  const searchParams = useSearchParams();
  const [internships, setInternships] = useState([]);
  const [filters, setFilters] = useState({ skills: [], locations: [], types: [] });
  const [activeFilters, setActiveFilters] = useState({});
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [viewMode, setViewMode] = useState('grid');
  const [apiError, setApiError] = useState('');

  useEffect(() => {
    internshipAPI.getFilters()
      .then(data => setFilters(data.data || {}))
      .catch(err => {
        setApiError(err.message || 'Failed to load filters');
        console.error('Failed to load filters:', err);
      });
  }, []);

  const loadInternships = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (activeFilters.skills) params.set('skills', activeFilters.skills);
      if (activeFilters.location) params.set('location', activeFilters.location);
      if (activeFilters.type) params.set('type', activeFilters.type);
      if (activeFilters.paid) params.set('paid', activeFilters.paid);
      if (activeFilters.min_stipend) params.set('min_stipend', activeFilters.min_stipend);
      params.set('page', page.toString());
      params.set('limit', '24');

      const data = search && isLikelyCompanySearch(search)
        ? await internshipAPI.companySearch(search, params.toString())
        : await internshipAPI.getAll(params.toString());
      setInternships(data.data || []);
      setTotalPages(data.pages || 1);
      setTotal(data.total || 0);
      setApiError('');
    } catch (err) {
      setApiError(err.message || 'Failed to load internships');
      console.error('Failed to load internships:', err);
    } finally {
      setLoading(false);
    }
  }, [search, activeFilters, page]);

  useEffect(() => {
    loadInternships();
  }, [loadInternships]);

  const handleSearch = (query) => {
    setSearch(query);
    setPage(1);
  };

  const handleFilterChange = (newFilters) => {
    setActiveFilters(newFilters);
    setPage(1);
  };

  const activeFilterCount = Object.values(activeFilters).filter(Boolean).length;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="bg-linear-to-b from-gray-900/30 to-transparent border-b border-gray-800/30 py-6 sm:py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">
                Explore Internships
              </h1>
              <p className="app-muted mt-1 text-sm sm:text-base">
                {loading ? 'Loading...' : `${total} opportunities from top companies`}
              </p>
            </div>
            {/* View toggle - desktop only */}
            <div className="hidden lg:flex items-center gap-1 app-surface rounded-lg p-1 border">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  viewMode === 'grid'
                    ? 'bg-violet-500/20 text-violet-300'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  viewMode === 'list'
                    ? 'bg-violet-500/20 text-violet-300'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" /></svg>
              </button>
            </div>
          </div>
          <SearchBar onSearch={handleSearch} initialValue={search} />
        </div>
      </section>

      {/* Content */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {apiError && (
          <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {apiError}
          </div>
        )}
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* Sidebar Filters */}
          <aside className="w-full lg:w-64 xl:w-72 shrink-0">
            <FilterSidebar
              filters={filters}
              activeFilters={activeFilters}
              onFilterChange={handleFilterChange}
            />
          </aside>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Active filters + result count */}
            <div className="flex flex-wrap items-center gap-2 mb-5">
              {search && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-violet-500/10 border border-violet-500/20 rounded-lg text-xs text-violet-300">
                  Search: &quot;{search}&quot;
                  <button onClick={() => handleSearch('')} className="hover:text-white transition-colors">×</button>
                </span>
              )}
              {Object.entries(activeFilters).map(([key, value]) =>
                value ? (
                  <span
                    key={key}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-violet-500/10 border border-violet-500/20 rounded-lg text-xs text-violet-300"
                  >
                    {key}: {value}
                    <button
                      onClick={() => handleFilterChange({ ...activeFilters, [key]: '' })}
                      className="hover:text-white transition-colors"
                    >
                      ×
                    </button>
                  </span>
                ) : null
              )}
              {(activeFilterCount > 0 || search) && (
                <button
                  onClick={() => { setActiveFilters({}); setSearch(''); }}
                  className="text-xs text-gray-500 hover:text-red-400 transition-colors"
                >
                  Clear all
                </button>
              )}
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-gray-900/50 border border-gray-800/50 rounded-2xl p-5 animate-pulse">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-11 h-11 rounded-xl bg-gray-800" />
                      <div className="flex-1">
                        <div className="h-4 bg-gray-800 rounded w-24 mb-1.5" />
                        <div className="h-3 bg-gray-800 rounded w-16" />
                      </div>
                    </div>
                    <div className="h-5 bg-gray-800 rounded w-3/4 mb-2" />
                    <div className="h-4 bg-gray-800 rounded w-1/2 mb-4" />
                    <div className="flex gap-2 mb-4">
                      <div className="h-5 bg-gray-800 rounded w-14" />
                      <div className="h-5 bg-gray-800 rounded w-14" />
                    </div>
                    <div className="h-10 bg-gray-800 rounded-xl" />
                  </div>
                ))}
              </div>
            ) : internships.length > 0 ? (
              <>
                {/* Result count */}
                <p className="text-xs text-gray-600 mb-4">
                  Showing {(page - 1) * 24 + 1}–{Math.min(page * 24, total)} of {total} internships
                </p>

                {/* GRID VIEW */}
                {viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
                    {internships.map((internship) => (
                      <InternshipCard key={internship._id} internship={internship} />
                    ))}
                  </div>
                ) : (
                  /* LIST VIEW - desktop only */
                  <div className="space-y-3">
                    {internships.map((internship) => (
                      <InternshipCard key={internship._id} internship={internship} />
                    ))}
                  </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-10">
                    <button
                      onClick={() => { setPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                      disabled={page === 1}
                      className="px-4 py-2.5 text-sm font-medium rounded-xl border border-gray-700/50 text-gray-400 hover:text-white hover:border-gray-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                      ← Prev
                    </button>

                    {/* Page numbers */}
                    <div className="hidden sm:flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                        <button
                          key={p}
                          onClick={() => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                          className={`w-9 h-9 text-sm font-medium rounded-lg transition-all ${
                            p === page
                              ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                              : 'text-gray-500 hover:text-white hover:bg-gray-800/50'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>

                    <span className="sm:hidden px-3 py-2 text-sm text-gray-500">
                      {page} / {totalPages}
                    </span>

                    <button
                      onClick={() => { setPage(p => Math.min(totalPages, p + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                      disabled={page === totalPages}
                      className="px-4 py-2.5 text-sm font-medium rounded-xl border border-gray-700/50 text-gray-400 hover:text-white hover:border-gray-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                      Next →
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-16 sm:py-20 app-surface rounded-2xl border">
                <div className="text-4xl sm:text-5xl mb-4">🔍</div>
                <p className="text-gray-300 text-lg font-semibold">No internships found</p>
                <p className="text-gray-600 text-sm mt-2 max-w-sm mx-auto">
                  Try adjusting your filters or search query to discover more opportunities
                </p>
                <button
                  onClick={() => { setActiveFilters({}); setSearch(''); }}
                  className="mt-5 px-5 py-2.5 text-sm font-medium text-violet-400 border border-violet-500/30 rounded-xl hover:bg-violet-500/10 transition-all"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

export default function InternshipsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <InternshipsContent />
    </Suspense>
  );
}
