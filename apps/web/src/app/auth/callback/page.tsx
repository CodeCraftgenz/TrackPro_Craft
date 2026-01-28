'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const success = searchParams.get('success');
    const errorParam = searchParams.get('error');

    if (errorParam) {
      setError(errorParam);
      return;
    }

    if (success === 'true') {
      // Cookies are already set by the backend (httpOnly)
      // Just redirect to dashboard - cookies will be sent automatically
      router.replace('/dashboard');
    } else {
      // Legacy support: check for tokens in URL (will be removed in future)
      const accessToken = searchParams.get('accessToken');
      const refreshToken = searchParams.get('refreshToken');

      if (accessToken && refreshToken) {
        // Old behavior - redirect to dashboard
        // Note: This path is deprecated and should not be used
        console.warn('OAuth callback with URL tokens is deprecated. Please update your backend.');
        router.replace('/dashboard');
      } else {
        setError('Invalid OAuth callback');
      }
    }
  }, [searchParams, router]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center gradient-bg">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 mb-4">
            <svg className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-white mb-2">Erro na Autenticacao</h1>
          <p className="text-[#B0B0B0] mb-6">{error}</p>
          <a
            href="/login"
            className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-2 text-sm font-medium text-white hover:bg-primary/90"
          >
            Voltar para Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center gradient-bg">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin text-[#00E4F2] mx-auto mb-4" />
        <h1 className="text-xl font-semibold text-white">Autenticando...</h1>
        <p className="text-[#B0B0B0] mt-2">Aguarde enquanto processamos seu login</p>
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center gradient-bg">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin text-[#00E4F2] mx-auto mb-4" />
        <h1 className="text-xl font-semibold text-white">Carregando...</h1>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <AuthCallbackContent />
    </Suspense>
  );
}
