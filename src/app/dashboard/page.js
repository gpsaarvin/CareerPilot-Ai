'use client';
// ============================================================
// Dashboard Page — Saved/Applied internships + status tracking
// ============================================================
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { applicationAPI } from '@/lib/api';

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('all');
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Load applications
  useEffect(() => {
    if (!user) return;
    
    async function loadApps() {
      setError('');
      try {
        const status = activeTab === 'all' ? '' : activeTab;
        const data = await applicationAPI.getAll(status);
        setApplications(data.data || []);
      } catch (err) {
        setError(err.message || 'Failed to load saved internships. Please try again.');
        console.error('Failed to load applications:', err);
      } finally {
        setLoading(false);
      }
    }
    loadApps();
  }, [user, activeTab]);

  const handleRetry = async () => {
    if (!user) return;
    setLoading(true);
    setError('');
    try {
      const status = activeTab === 'all' ? '' : activeTab;
      const data = await applicationAPI.getAll(status);
      setApplications(data.data || []);
    } catch (err) {
      setError(err.message || 'Still unable to load. Check backend/Firestore configuration.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (appId, newStatus) => {
    try {
      await applicationAPI.update(appId, { status: newStatus });
      setApplications(prev =>
        prev.map(app => app._id === appId ? { ...app, status: newStatus } : app)
      );
    } catch (err) {
      console.error('Failed to update:', err);
    }
  };

  const handleRemove = async (appId) => {
    try {
      await applicationAPI.remove(appId);
      setApplications(prev => prev.filter(app => app._id !== appId));
    } catch (err) {
      console.error('Failed to remove:', err);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  const tabs = [
    { key: 'all', label: 'All', count: applications.length },
    { key: 'saved', label: 'Saved', icon: '♡' },
    { key: 'applied', label: 'Applied', icon: '📤' },
    { key: 'interviewing', label: 'Interviewing', icon: '🎤' },
    { key: 'accepted', label: 'Accepted', icon: '✅' },
    { key: 'rejected', label: 'Rejected', icon: '❌' },
  ];

  const statusColors = {
    saved: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
    applied: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    interviewing: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    accepted: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    rejected: 'bg-red-500/10 text-red-400 border-red-500/20',
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="bg-gray-900/50 border-b border-gray-800/50 py-8 sm:py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">
                Welcome, {user.name} 👋
              </h1>
              <p className="text-gray-500 mt-1">Track your internship applications</p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/resume"
                className="px-4 py-2 text-sm font-medium text-violet-400 border border-violet-500/30 rounded-xl hover:bg-violet-500/10 transition-all"
              >
                🤖 AI Resume Match
              </Link>
              <Link
                href="/internships"
                className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl hover:from-violet-500 hover:to-indigo-500 transition-all"
              >
                Browse Internships
              </Link>
            </div>
          </div>

          {/* Skills */}
          {user.skills?.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="text-xs text-gray-500">Your skills:</span>
              {user.skills.map(skill => (
                <span key={skill} className="text-xs px-2 py-1 bg-violet-500/10 text-violet-300 rounded-lg border border-violet-500/20">
                  {skill}
                </span>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Tabs */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-thin">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setLoading(true); }}
              className={`flex-shrink-0 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                activeTab === tab.key
                  ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                  : 'text-gray-500 hover:text-gray-300 border border-transparent'
              }`}
            >
              {tab.icon && <span className="mr-1.5">{tab.icon}</span>}
              {tab.label}
            </button>
          ))}
        </div>
      </section>

      {/* Applications List */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {error && (
          <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300 flex items-center justify-between gap-3">
            <span>{error}</span>
            <button
              onClick={handleRetry}
              className="px-3 py-1.5 rounded-lg border border-red-400/30 text-red-200 hover:bg-red-500/20 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-gray-900/50 border border-gray-800/50 rounded-2xl p-5 animate-pulse">
                <div className="h-5 bg-gray-800 rounded w-1/3 mb-2" />
                <div className="h-4 bg-gray-800 rounded w-1/4 mb-3" />
                <div className="h-3 bg-gray-800 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : applications.length > 0 ? (
          <div className="space-y-4">
            {applications.map((app) => (
              <div
                key={app._id}
                className="bg-gray-900/50 border border-gray-800/50 rounded-2xl p-5 hover:border-gray-700/50 transition-all"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <Link
                        href={`/internships/${app.internship?._id}`}
                        className="text-lg font-semibold text-white hover:text-violet-300 transition-colors truncate"
                      >
                        {app.internship?.title || 'Unknown Internship'}
                      </Link>
                      <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${statusColors[app.status]}`}>
                        {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400">{app.internship?.company} • {app.internship?.location}</p>
                    <p className="text-xs text-gray-600 mt-1">
                      {app.status === 'saved' ? 'Saved' : 'Applied'} on {new Date(app.applied_date).toLocaleDateString('en-IN')}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Status change */}
                    <select
                      value={app.status}
                      onChange={(e) => handleUpdateStatus(app._id, e.target.value)}
                      className="px-3 py-1.5 bg-gray-800/50 border border-gray-700/50 rounded-lg text-xs text-gray-300 focus:outline-none focus:border-violet-500/50"
                    >
                      <option value="saved">Saved</option>
                      <option value="applied">Applied</option>
                      <option value="interviewing">Interviewing</option>
                      <option value="accepted">Accepted</option>
                      <option value="rejected">Rejected</option>
                    </select>

                    {/* Apply externally */}
                    {app.internship?.link && (
                      <a
                        href={app.internship.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-violet-600 to-indigo-600 rounded-lg hover:from-violet-500 hover:to-indigo-500 transition-all"
                      >
                        Apply 🚀
                      </a>
                    )}

                    {/* Remove */}
                    <button
                      onClick={() => handleRemove(app._id)}
                      className="p-1.5 text-gray-600 hover:text-red-400 transition-colors"
                      title="Remove"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-gray-900/30 rounded-2xl border border-gray-800/50">
            <div className="text-4xl mb-4">📋</div>
            <p className="text-gray-400 text-lg font-medium">No applications yet</p>
            <p className="text-gray-600 text-sm mt-2">
              {activeTab === 'all'
                ? 'Start browsing internships and save the ones you like!'
                : `No ${activeTab} applications`}
            </p>
            <Link
              href="/internships"
              className="inline-block mt-4 px-5 py-2 text-sm font-medium text-violet-400 border border-violet-500/30 rounded-lg hover:bg-violet-500/10 transition-all"
            >
              Browse Internships →
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
