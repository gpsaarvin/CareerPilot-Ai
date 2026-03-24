'use client';
// ============================================================
// InternshipCard — Professional card with Apply Now external link
// Responsive: compact on mobile, detailed on desktop
// ============================================================
import { useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { internshipAPI } from '@/lib/api';

const AGGREGATOR_HOSTS = new Set([
  'internshala.com',
  'www.internshala.com',
  'linkedin.com',
  'www.linkedin.com',
]);

function getCompanyLogoUrl(internship) {
  if (internship?.company_logo) return internship.company_logo;

  try {
    if (internship?.link) {
      const host = new URL(internship.link).hostname.toLowerCase();
      if (host && !AGGREGATOR_HOSTS.has(host)) {
        return `https://logo.clearbit.com/${host}`;
      }
    }
  } catch (err) {
    // Ignore invalid URLs and continue to fallback logic.
  }

  if (!internship?.company) return '';
  const guessedDomain = internship.company
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '') + '.com';

  return `https://logo.clearbit.com/${guessedDomain}`;
}

export default function InternshipCard({ internship }) {
  const {
    _id,
    title,
    company,
    location,
    type,
    skills_required = [],
    stipend,
    link,
    source,
    duration,
    deadline,
  } = internship;

  const [logoFailed, setLogoFailed] = useState(false);
  const logoUrl = useMemo(() => getCompanyLogoUrl(internship), [internship]);
  const showLogo = Boolean(logoUrl) && !logoFailed;

  const handleApplyClick = async () => {
    try {
      await internshipAPI.trackClick(_id);
    } catch (err) {
      // Non-blocking
    }
  };

  const typeBadge = {
    remote: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    onsite: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    hybrid: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  };

  const typeIcon = {
    remote: '🏠',
    onsite: '🏢',
    hybrid: '🔄',
  };

  const sourceIcon = {
    'Internshala': '📘',
    'LinkedIn': '💼',
    'Company Website': '🌐',
    'Direct': '📩',
  };

  // Company initial for avatar
  const initial = company?.charAt(0).toUpperCase();
  const avatarColors = [
    'from-violet-500 to-purple-600',
    'from-blue-500 to-cyan-600',
    'from-emerald-500 to-teal-600',
    'from-amber-500 to-orange-600',
    'from-pink-500 to-rose-600',
    'from-indigo-500 to-blue-600',
  ];
  const colorIndex = company ? company.charCodeAt(0) % avatarColors.length : 0;

  // Format deadline
  const deadlineText = deadline ? new Date(deadline).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric'
  }) : null;

  return (
    <div className="group relative bg-gray-900/60 border border-gray-800/60 rounded-2xl overflow-hidden hover:border-violet-500/30 hover:bg-gray-900/90 transition-all duration-300 hover:shadow-2xl hover:shadow-violet-500/5 flex flex-col">
      {/* Top accent bar */}
      <div className="h-1 bg-linear-to-r from-violet-500 via-indigo-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <div className="p-4 sm:p-5 flex flex-col grow">
        {/* Header: Company avatar + Source/Type */}
        <div className="flex items-start gap-3 mb-3">
          <div className={`relative w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-linear-to-br ${avatarColors[colorIndex]} flex items-center justify-center text-white font-bold text-sm sm:text-base shrink-0 shadow-lg overflow-hidden`}>
            {showLogo ? (
              <Image
                src={logoUrl}
                alt={`${company} logo`}
                fill
                sizes="44px"
                className="object-cover"
                onError={() => setLogoFailed(true)}
              />
            ) : (
              initial
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-300 truncate">{company}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[11px] text-gray-500 flex items-center gap-1">
                {sourceIcon[source] || '📩'} {source}
              </span>
            </div>
          </div>
          <span className={`text-[11px] px-2 py-0.5 rounded-full border font-medium shrink-0 ${typeBadge[type] || typeBadge.onsite}`}>
            {typeIcon[type]} {type?.charAt(0).toUpperCase() + type?.slice(1)}
          </span>
        </div>

        {/* Title */}
        <Link href={`/internships/${_id}`} className="block mb-3">
          <h3 className="text-base sm:text-[17px] font-semibold text-white leading-snug group-hover:text-violet-300 transition-colors line-clamp-2">
            {title}
          </h3>
        </Link>

        {/* Info row */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mb-3 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            {location}
          </span>
          {duration && (
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              {duration}
            </span>
          )}
          {deadlineText && (
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              {deadlineText}
            </span>
          )}
        </div>

        {/* Stipend */}
        <div className="mb-3">
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-400">
            <span className="text-emerald-500/70 text-xs">💰</span>
            {stipend}
          </span>
        </div>

        {/* Skills */}
        <div className="flex flex-wrap gap-1.5 mb-4 grow">
          {skills_required.slice(0, 3).map((skill) => (
            <span
              key={skill}
              className="text-[11px] px-2 py-0.5 rounded-md bg-gray-800/80 text-gray-400 border border-gray-700/40"
            >
              {skill}
            </span>
          ))}
          {skills_required.length > 3 && (
            <span className="text-[11px] px-2 py-0.5 rounded-md bg-gray-800/40 text-gray-600">
              +{skills_required.length - 3}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-auto pt-3 border-t border-gray-800/50">
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleApplyClick}
            className="flex-1 text-center px-4 py-2.5 text-sm font-semibold text-white bg-linear-to-r from-violet-600 to-indigo-600 rounded-xl hover:from-violet-500 hover:to-indigo-500 shadow-lg shadow-violet-500/20 hover:shadow-violet-500/40 transition-all duration-200 active:scale-[0.98]"
          >
            Apply Now 🚀
          </a>
          <Link
            href={`/internships/${_id}`}
            className="px-3.5 py-2.5 text-sm font-medium text-gray-400 border border-gray-700/50 rounded-xl hover:text-white hover:border-gray-500 transition-all active:scale-[0.98]"
          >
            Details
          </Link>
        </div>
      </div>
    </div>
  );
}
