'use client';
// ============================================================
// Home Page — Hero section + featured internships + CTA
// ============================================================
import { useState, useEffect } from 'react';
import Link from 'next/link';
import InternshipCard from '@/components/InternshipCard';
import SearchBar from '@/components/SearchBar';
import { internshipAPI } from '@/lib/api';

export default function HomePage() {
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadFeatured() {
      try {
        const data = await internshipAPI.getAll('limit=6&sort=-clicks');
        setFeatured(data.data || []);
      } catch (err) {
        console.error('Failed to load internships:', err);
      } finally {
        setLoading(false);
      }
    }
    loadFeatured();
  }, []);

  const handleSearch = (query) => {
    window.location.href = `/internships?search=${encodeURIComponent(query)}`;
  };

  // Stats
  const stats = [
    { value: '500+', label: 'Internships', icon: '💼' },
    { value: '200+', label: 'Companies', icon: '🏢' },
    { value: '50+', label: 'Cities', icon: '🌍' },
    { value: 'AI', label: 'Resume Match', icon: '🤖' },
  ];

  return (
    <div className="min-h-screen">
      {/* ===== HERO SECTION ===== */}
      <section className="relative overflow-hidden">
        {/* Background gradient orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-violet-600/20 rounded-full blur-3xl animate-gradient" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl animate-gradient" style={{ animationDelay: '2s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-purple-600/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-36">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-sm font-medium mb-8 animate-fade-in-up">
              <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
              AI-Powered Internship Discovery
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold leading-tight mb-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              Find Your Perfect{' '}
              <span className="bg-gradient-to-r from-violet-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
                Internship
              </span>
              <br />
              in One Place
            </h1>

            {/* Subtitle */}
            <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto mb-10 animate-fade-in-up leading-relaxed" style={{ animationDelay: '0.2s' }}>
              Stop searching across dozens of platforms. CareerPilot aggregates real internships from 
              Internshala, LinkedIn, and company career pages — with AI-powered resume matching.
            </p>

            {/* Search Bar */}
            <div className="flex justify-center mb-8 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
              <SearchBar onSearch={handleSearch} realtime={false} />
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
              <Link
                href="/internships"
                className="w-full sm:w-auto px-8 py-4 text-base font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl hover:from-violet-500 hover:to-indigo-500 shadow-xl shadow-violet-500/25 hover:shadow-violet-500/40 transition-all duration-300 hover:scale-[1.02]"
              >
                Browse All Internships →
              </Link>
              <Link
                href="/resume"
                className="w-full sm:w-auto px-8 py-4 text-base font-semibold text-gray-300 border border-gray-700/50 rounded-2xl hover:text-white hover:border-violet-500/40 hover:bg-gray-900/50 transition-all duration-300"
              >
                Upload Resume & Get Matched
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ===== STATS ===== */}
      <section className="py-12 border-y border-gray-800/50 bg-gray-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {stats.map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-2xl mb-2">{stat.icon}</div>
                <div className="text-2xl sm:text-3xl font-bold text-white">{stat.value}</div>
                <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FEATURED INTERNSHIPS ===== */}
      <section className="py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white">
                🔥 Trending Internships
              </h2>
              <p className="text-gray-500 mt-2">Most popular opportunities right now</p>
            </div>
            <Link
              href="/internships"
              className="text-violet-400 hover:text-violet-300 font-medium text-sm transition-colors"
            >
              View all →
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-gray-900/50 border border-gray-800/50 rounded-2xl p-5 animate-pulse">
                  <div className="h-4 bg-gray-800 rounded w-20 mb-3" />
                  <div className="h-6 bg-gray-800 rounded w-3/4 mb-2" />
                  <div className="h-4 bg-gray-800 rounded w-1/2 mb-4" />
                  <div className="h-4 bg-gray-800 rounded w-full mb-2" />
                  <div className="h-4 bg-gray-800 rounded w-2/3 mb-4" />
                  <div className="flex gap-2 mb-4">
                    <div className="h-6 bg-gray-800 rounded w-16" />
                    <div className="h-6 bg-gray-800 rounded w-16" />
                  </div>
                  <div className="h-10 bg-gray-800 rounded-xl" />
                </div>
              ))}
            </div>
          ) : featured.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featured.map((internship) => (
                <InternshipCard key={internship._id} internship={internship} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-gray-900/30 rounded-2xl border border-gray-800/50">
              <p className="text-gray-500 text-lg">No internships loaded yet.</p>
              <p className="text-gray-600 text-sm mt-2">Start the backend server and run the seed script to populate data.</p>
            </div>
          )}
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className="py-16 sm:py-20 bg-gray-900/30 border-y border-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">How CareerPilot Works</h2>
            <p className="text-gray-500">Three simple steps to your dream internship</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Discover',
                desc: 'Browse real internships aggregated from Internshala, LinkedIn, and company websites.',
                icon: '🔍',
                color: 'from-violet-500 to-indigo-500',
              },
              {
                step: '02',
                title: 'Match',
                desc: 'Upload your resume and let AI analyze your skills to find the best-fit opportunities.',
                icon: '🤖',
                color: 'from-indigo-500 to-purple-500',
              },
              {
                step: '03',
                title: 'Apply',
                desc: 'Click "Apply Now" and get redirected directly to the original job posting to apply.',
                icon: '🚀',
                color: 'from-purple-500 to-pink-500',
              },
            ].map((item) => (
              <div key={item.step} className="relative group">
                <div className="bg-gray-900/50 border border-gray-800/50 rounded-2xl p-6 hover:border-violet-500/30 transition-all duration-300 h-full">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center text-2xl mb-4 shadow-lg`}>
                    {item.icon}
                  </div>
                  <div className="text-xs text-violet-400 font-mono mb-2">STEP {item.step}</div>
                  <h3 className="text-xl font-semibold text-white mb-2">{item.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA SECTION ===== */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to Find Your{' '}
            <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
              Dream Internship
            </span>
            ?
          </h2>
          <p className="text-gray-500 mb-8 text-lg">
            Join thousands of students who found their perfect internship through CareerPilot.
          </p>
          <Link
            href="/signup"
            className="inline-block px-10 py-4 text-base font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl hover:from-violet-500 hover:to-indigo-500 shadow-xl shadow-violet-500/25 hover:shadow-violet-500/40 transition-all duration-300 hover:scale-[1.02]"
          >
            Get Started Free →
          </Link>
        </div>
      </section>
    </div>
  );
}
