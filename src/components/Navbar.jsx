'use client';
// ============================================================
// Navbar — Responsive navigation with hamburger menu on mobile
// ============================================================
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import BrandLogo from '@/components/BrandLogo';
import ThemeToggle from '@/components/ThemeToggle';

function GoogleMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" aria-hidden="true" focusable="false">
      <path fill="#4285F4" d="M17.64 9.2045c0-.6382-.0573-1.2518-.1636-1.8409H9v3.4818h4.8436c-.2086 1.125-.8427 2.0795-1.7972 2.7177v2.2582h2.9086C16.6568 14.2545 17.64 11.9545 17.64 9.2045z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.4673-.8068 5.9564-2.1786l-2.9086-2.2582c-.8068.5409-1.8382.8591-3.0477.8591-2.3441 0-4.3282-1.5832-5.0373-3.7105H.9573v2.3318C2.4382 15.9873 5.4818 18 9 18z" />
      <path fill="#FBBC05" d="M3.9627 10.7118c-.1801-.5409-.2827-1.1182-.2827-1.7118s.1027-1.1709.2827-1.7118V4.9564H.9573C.3477 6.1718 0 7.5445 0 9s.3477 2.8282.9573 4.0436l3.0054-2.3318z" />
      <path fill="#EA4335" d="M9 3.5795c1.3214 0 2.5077.4541 3.4405 1.3455l2.5814-2.5814C13.4632.8918 11.4268 0 9 0 5.4818 0 2.4382 2.0127.9573 4.9564l3.0054 2.3318C4.6718 5.1627 6.6559 3.5795 9 3.5795z" />
    </svg>
  );
}

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [failedAvatarSrc, setFailedAvatarSrc] = useState('');
  const { user, logout } = useAuth();

  const normalizedAvatar = typeof user?.avatar === 'string' ? user.avatar.trim() : '';

  const hasUsableAvatar =
    !!normalizedAvatar &&
    normalizedAvatar !== 'null' &&
    normalizedAvatar !== 'undefined' &&
    /^https?:\/\//i.test(normalizedAvatar) &&
    failedAvatarSrc !== normalizedAvatar;

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/internships', label: 'Internships' },
  ];

  const authLinks = user
    ? [
        { href: '/dashboard', label: 'Dashboard' },
        { href: '/resume', label: 'Resume AI' },
      ]
    : [];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 app-surface-strong backdrop-blur-xl border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <BrandLogo size={36} />
            <span className="text-xl font-bold bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
              CareerSync
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {[...navLinks, ...authLinks].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-4 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-gray-800/50 transition-all duration-200 text-sm font-medium"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop Auth */}
          <div className="hidden md:flex items-center gap-3">
            <ThemeToggle />
            {user ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full app-surface border">
                  {hasUsableAvatar ? (
                    <Image
                      src={normalizedAvatar}
                      alt={user.name || 'User'}
                      width={28}
                      height={28}
                      className="w-7 h-7 rounded-full object-cover"
                      onError={() => setFailedAvatarSrc(normalizedAvatar)}
                    />
                  ) : user.google_id ? (
                    <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center">
                      <GoogleMark />
                    </div>
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white text-xs font-bold">
                      {user.name?.charAt(0)?.toUpperCase()}
                    </div>
                  )}
                  <span className="text-sm text-gray-300 font-medium">{user.name}</span>
                </div>
                <button
                  onClick={logout}
                  className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
                >
                  Logout
                </button>
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
                >
                  Continue with Google
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800/50 transition-colors"
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {isOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`md:hidden transition-all duration-300 ease-in-out overflow-hidden ${
          isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-4 py-3 space-y-1 app-surface-strong backdrop-blur-xl border-t">
          <div className="flex justify-end pb-2">
            <ThemeToggle />
          </div>
          {[...navLinks, ...authLinks].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setIsOpen(false)}
              className="block px-4 py-3 rounded-lg text-gray-300 hover:text-white hover:bg-gray-800/50 transition-all text-sm font-medium"
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-3 border-t border-gray-800/50">
            {user ? (
              <button
                onClick={() => { logout(); setIsOpen(false); }}
                className="w-full text-left px-4 py-3 rounded-lg text-red-400 hover:text-red-300 hover:bg-gray-800/50 transition-all text-sm font-medium"
              >
                Logout ({user.name})
              </button>
            ) : (
              <div className="flex gap-2">
                <Link
                  href="/login"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 text-center px-4 py-2.5 rounded-lg text-gray-300 border border-gray-700 hover:border-gray-600 hover:text-white transition-all text-sm font-medium"
                >
                  Continue with Google
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
