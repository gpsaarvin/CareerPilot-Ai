'use client';
// ============================================================
// ClientLayout — Wraps app in AuthProvider + shared Navbar/Footer
// Separated from root layout because providers need 'use client'
// ============================================================
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function ClientLayout({ children }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Navbar />
        <main className="flex-1 pt-16">
          {children}
        </main>
        <Footer />
      </AuthProvider>
    </ThemeProvider>
  );
}
