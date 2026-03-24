// ============================================================
// Footer — Site-wide footer with gradient accents
// ============================================================
import Link from 'next/link';
import BrandLogo from '@/components/BrandLogo';

export default function Footer() {
  return (
    <footer className="app-surface-strong border-t">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <BrandLogo size={32} />
              <span className="text-lg font-bold bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
                CareerSync
              </span>
            </div>
            <p className="app-muted text-sm leading-relaxed">
              Your AI-powered internship finder. Discover opportunities from top companies and get matched based on your skills.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold text-gray-300 mb-4 uppercase tracking-wider">Platform</h4>
            <ul className="space-y-2.5">
              {[
                { href: '/internships', label: 'Browse Internships' },
                { href: '/resume', label: 'AI Resume Analysis' },
                { href: '/dashboard', label: 'Dashboard' },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="app-muted hover:text-violet-400 transition-colors text-sm">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-sm font-semibold text-gray-300 mb-4 uppercase tracking-wider">Sources</h4>
            <ul className="space-y-2.5">
              {['Internshala', 'LinkedIn', 'Company Websites'].map((source) => (
                <li key={source}>
                  <span className="app-muted text-sm">{source}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm font-semibold text-gray-300 mb-4 uppercase tracking-wider">Connect</h4>
            <ul className="space-y-2.5">
              {['GitHub', 'Twitter', 'LinkedIn'].map((social) => (
                <li key={social}>
                  <span className="app-muted hover:text-violet-400 cursor-pointer transition-colors text-sm">
                    {social}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-gray-800/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="app-muted text-xs">
            © {new Date().getFullYear()} CareerSync. Built with ❤️ for students.
          </p>
          <div className="flex items-center gap-1 text-xs app-muted">
            <span>Powered by</span>
            <span className="text-violet-500 font-medium">Next.js</span>
            <span>+</span>
            <span className="text-indigo-500 font-medium">Express</span>
            <span>+</span>
            <span className="text-emerald-500 font-medium">MongoDB</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
