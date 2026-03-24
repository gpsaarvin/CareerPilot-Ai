'use client';
import { useMemo, useState } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

function GoogleLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" focusable="false">
      <path fill="#4285F4" d="M17.64 9.2045c0-.6382-.0573-1.2518-.1636-1.8409H9v3.4818h4.8436c-.2086 1.125-.8427 2.0795-1.7972 2.7177v2.2582h2.9086C16.6568 14.2545 17.64 11.9545 17.64 9.2045z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.4673-.8068 5.9564-2.1786l-2.9086-2.2582c-.8068.5409-1.8382.8591-3.0477.8591-2.3441 0-4.3282-1.5832-5.0373-3.7105H.9573v2.3318C2.4382 15.9873 5.4818 18 9 18z" />
      <path fill="#FBBC05" d="M3.9627 10.7118c-.1801-.5409-.2827-1.1182-.2827-1.7118s.1027-1.1709.2827-1.7118V4.9564H.9573C.3477 6.1718 0 7.5445 0 9s.3477 2.8282.9573 4.0436l3.0054-2.3318z" />
      <path fill="#EA4335" d="M9 3.5795c1.3214 0 2.5077.4541 3.4405 1.3455l2.5814-2.5814C13.4632.8918 11.4268 0 9 0 5.4818 0 2.4382 2.0127.9573 4.9564l3.0054 2.3318C4.6718 5.1627 6.6559 3.5795 9 3.5795z" />
    </svg>
  );
}

export default function GoogleSignInButton({ onSuccess, onError }) {
  const [loading, setLoading] = useState(false);
  const firebaseConfig = useMemo(() => ({
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  }), []);

  const handleGoogleClick = async () => {
    const missing = Object.entries(firebaseConfig)
      .filter(([key, value]) => key !== 'measurementId' && !value)
      .map(([key]) => key);

    if (missing.length > 0) {
      onError?.(`Firebase is not fully configured in client/.env.local. Missing: ${missing.join(', ')}`);
      return;
    }

    setLoading(true);
    try {
      const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
      const auth = getAuth(app);
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });

      const result = await signInWithPopup(auth, provider);
      const googleCredential = GoogleAuthProvider.credentialFromResult(result);
      const idToken = googleCredential?.idToken;

      if (!idToken) {
        throw new Error('Google authentication did not return an ID token.');
      }

      onSuccess?.({
        credential: idToken,
        profile: {
          name: result.user?.displayName || '',
          email: result.user?.email || '',
          avatar: result.user?.photoURL || '',
          google_id: result.user?.uid || '',
        },
      });
    } catch (err) {
      onError?.(err.message || 'Google Sign-In failed to initialize');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full flex justify-center">
      <button
        type="button"
        onClick={handleGoogleClick}
        disabled={loading}
        className="w-full max-w-xs inline-flex items-center justify-center gap-3 rounded-full border border-gray-300 bg-white text-gray-800 font-medium py-3 px-5 hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <span className="w-4 h-4 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
            <span>Connecting...</span>
          </>
        ) : (
          <>
            <GoogleLogo />
            <span>Continue with Google</span>
          </>
        )}
      </button>
    </div>
  );
}
