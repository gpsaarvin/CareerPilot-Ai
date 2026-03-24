'use client';
// ============================================================
// Internship Details Page — Full info + Apply Now button
// ============================================================
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { internshipAPI, applicationAPI, aiAPI } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

function getLogoUrl(internship) {
  if (internship?.company_logo) return internship.company_logo;
  try {
    if (internship?.link) {
      const host = new URL(internship.link).hostname.toLowerCase();
      if (host) return `https://logo.clearbit.com/${host}`;
    }
  } catch (err) {
    return '';
  }
  return '';
}

export default function InternshipDetailsPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [internship, setInternship] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [tipsLoading, setTipsLoading] = useState(false);
  const [tipsError, setTipsError] = useState('');
  const [companyTips, setCompanyTips] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await internshipAPI.getById(id);
        setInternship(data.data);
      } catch (err) {
        console.error('Failed to load internship:', err);
      } finally {
        setLoading(false);
      }
    }
    if (id) load();
  }, [id]);

  const handleSave = async () => {
    if (!user) {
      window.location.href = '/login';
      return;
    }
    setSaveLoading(true);
    try {
      await applicationAPI.apply({
        internship_id: id,
        internship_data: internship,
        status: 'saved',
      });
      setSaved(true);
    } catch (err) {
      console.error('Failed to save:', err);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleApplyClick = async () => {
    try {
      await internshipAPI.trackClick(id);
      if (user) {
        await applicationAPI.apply({
          internship_id: id,
          internship_data: internship,
          status: 'applied',
        });
      }
    } catch (err) {
      // Non-blocking
    }
  };

  const handleGenerateCompanyTips = async () => {
    if (!internship) return;
    setTipsError('');
    setTipsLoading(true);

    try {
      const response = await aiAPI.getCompanyResumeSuggestions({
        company: internship.company,
        role: internship.title,
        description: internship.description,
      });
      setCompanyTips(response.data || null);
    } catch (error) {
      setTipsError(error.message || 'Failed to generate tips');
    } finally {
      setTipsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!internship) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <div className="text-4xl">😔</div>
        <p className="text-gray-400 text-lg">Internship not found</p>
        <Link href="/internships" className="text-violet-400 hover:text-violet-300 text-sm">
          ← Back to listings
        </Link>
      </div>
    );
  }

  const typeBadge = {
    remote: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    onsite: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    hybrid: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  };

  return (
    <div className="min-h-screen">
      {/* Breadcrumb */}
      <div className="bg-gray-900/50 border-b border-gray-800/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Link href="/internships" className="hover:text-violet-400 transition-colors">
              Internships
            </Link>
            <span>/</span>
            <span className="text-gray-300 truncate">{internship.title}</span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Header */}
            <div>
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <span className={`text-xs px-3 py-1 rounded-full border font-medium ${typeBadge[internship.type] || typeBadge.onsite}`}>
                  {internship.type?.charAt(0).toUpperCase() + internship.type?.slice(1)}
                </span>
                <span className="text-xs text-gray-500">via {internship.source}</span>
              </div>
              <div className="flex items-center gap-3 mb-3">
                {getLogoUrl(internship) ? (
                  <Image
                    src={getLogoUrl(internship)}
                    alt={`${internship.company} logo`}
                    width={40}
                    height={40}
                    className="w-10 h-10 rounded-xl object-cover border border-gray-700/40"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-semibold">
                    {internship.company?.charAt(0)?.toUpperCase() || 'C'}
                  </div>
                )}
                <p className="text-lg text-gray-400 font-medium">{internship.company}</p>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">{internship.title}</h1>
            </div>

            {/* Details grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Location', value: internship.location, icon: '📍' },
                { label: 'Stipend', value: internship.stipend, icon: '💰' },
                { label: 'Duration', value: internship.duration || 'N/A', icon: '⏱️' },
                { label: 'Deadline', value: internship.deadline ? new Date(internship.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Open', icon: '📅' },
              ].map((item) => (
                <div key={item.label} className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-4">
                  <div className="text-lg mb-1">{item.icon}</div>
                  <div className="text-xs text-gray-500 mb-1">{item.label}</div>
                  <div className="text-sm font-medium text-white">{item.value}</div>
                </div>
              ))}
            </div>

            {/* Description */}
            <div>
              <h2 className="text-lg font-semibold text-white mb-3">About This Internship</h2>
              <p className="text-gray-400 leading-relaxed">{internship.description || 'No description provided.'}</p>
            </div>

            {/* Skills */}
            <div>
              <h2 className="text-lg font-semibold text-white mb-3">Required Skills</h2>
              <div className="flex flex-wrap gap-2">
                {internship.skills_required?.map((skill) => (
                  <span key={skill} className="px-3 py-1.5 text-sm bg-gray-800/80 text-gray-300 border border-gray-700/50 rounded-lg">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar — Apply Card */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-gray-900/50 border border-gray-800/50 rounded-2xl p-6 space-y-5">
              <div>
                <div className="text-xs text-gray-500 mb-1">Stipend</div>
                <div className="text-2xl font-bold text-emerald-400">{internship.stipend}</div>
              </div>

              {/* CRITICAL: Apply Now opens original URL in new tab */}
              <a
                href={internship.link}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleApplyClick}
                className="block w-full text-center px-6 py-3.5 text-base font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl hover:from-violet-500 hover:to-indigo-500 shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all duration-200"
              >
                Apply Now 🚀
              </a>

              <button
                onClick={handleSave}
                disabled={saved || saveLoading}
                className={`w-full px-6 py-3 text-sm font-medium rounded-xl border transition-all ${
                  saved
                    ? 'bg-violet-500/10 border-violet-500/30 text-violet-300'
                    : 'border-gray-700/50 text-gray-400 hover:text-white hover:border-gray-600'
                }`}
              >
                {saveLoading ? 'Saving...' : saved ? '✓ Saved' : '♡ Save for Later'}
              </button>

              <p className="text-xs text-gray-600 text-center">
                You will be redirected to {internship.source} to complete your application
              </p>

              <div className="pt-3 border-t border-gray-800/40">
                <button
                  onClick={handleGenerateCompanyTips}
                  disabled={tipsLoading}
                  className="w-full px-4 py-2.5 text-sm font-medium text-indigo-200 bg-indigo-500/10 border border-indigo-500/30 rounded-xl hover:bg-indigo-500/20 transition-all disabled:opacity-60"
                >
                  {tipsLoading ? 'Generating Tips...' : 'Generate Resume Tips for this Company'}
                </button>

                {tipsError && (
                  <p className="text-xs text-red-400 mt-2">{tipsError}</p>
                )}

                {companyTips && (
                  <div className="mt-3 space-y-3 text-left">
                    <div className="rounded-lg bg-gray-800/40 border border-gray-700/40 p-3">
                      <h4 className="text-xs font-semibold text-indigo-300 mb-1">Customized Resume Summary</h4>
                      <p className="text-xs text-gray-300 leading-relaxed">{companyTips.summary}</p>
                    </div>

                    <div className="rounded-lg bg-gray-800/40 border border-gray-700/40 p-3">
                      <h4 className="text-xs font-semibold text-emerald-300 mb-1">Required Skills to Add</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {(companyTips.requiredSkills || []).map((skill) => (
                          <span key={skill} className="text-[11px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-lg bg-gray-800/40 border border-gray-700/40 p-3">
                      <h4 className="text-xs font-semibold text-amber-300 mb-1">ATS Keywords</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {(companyTips.atsKeywords || []).map((keyword) => (
                          <span key={keyword} className="text-[11px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-lg bg-gray-800/40 border border-gray-700/40 p-3">
                      <h4 className="text-xs font-semibold text-violet-300 mb-1">Suggested Projects to Include</h4>
                      <ul className="space-y-1">
                        {(companyTips.suggestedProjects || []).map((project) => (
                          <li key={project} className="text-xs text-gray-300">- {project}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
