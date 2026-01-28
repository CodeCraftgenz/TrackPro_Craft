'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Eye, EyeOff } from 'lucide-react';

import { useAuth } from '@/contexts/auth-context';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha é obrigatória'),
  rememberMe: z.boolean().optional(),
});

type LoginForm = z.infer<typeof loginSchema>;

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function LoginPage() {
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleGoogleLogin = () => {
    window.location.href = `${API_URL}/api/v1/auth/google`;
  };

  const handleMicrosoftLogin = () => {
    window.location.href = `${API_URL}/api/v1/auth/microsoft`;
  };

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      rememberMe: false,
    },
  });

  const onSubmit = async (data: LoginForm) => {
    setError(null);
    try {
      await login(data.email, data.password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao fazer login');
    }
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Bem-vindo</h1>
        <p className="text-[#B0B0B0]">
          Tecnologia para maximizar<br />resultados.
        </p>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-6 rounded-lg bg-[#FF6B6B]/10 border border-[#FF6B6B]/30 p-4 text-sm text-[#FF6B6B]">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Email field */}
        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm font-medium text-white">
            Endereço de E-mail
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            className="w-full h-12 rounded-lg border border-[#16213E] bg-[#16213E] px-4 text-white placeholder:text-[#666] focus:outline-none focus:border-[#00E4F2] focus:ring-1 focus:ring-[#00E4F2] transition-all"
            placeholder="Endereço de E-mail"
            {...register('email')}
          />
          {errors.email && (
            <p className="text-sm text-[#FF6B6B]">{errors.email.message}</p>
          )}
        </div>

        {/* Password field */}
        <div className="space-y-2">
          <label htmlFor="password" className="block text-sm font-medium text-white">
            Senha
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              className="w-full h-12 rounded-lg border border-[#16213E] bg-[#16213E] px-4 pr-12 text-white placeholder:text-[#666] focus:outline-none focus:border-[#00E4F2] focus:ring-1 focus:ring-[#00E4F2] transition-all"
              placeholder="Digite sua senha"
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#666] hover:text-white transition-colors"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-sm text-[#FF6B6B]">{errors.password.message}</p>
          )}
        </div>

        {/* Remember me checkbox */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="rememberMe"
            className="h-4 w-4 rounded border-[#16213E] bg-[#16213E] text-[#00E4F2] focus:ring-[#00E4F2] focus:ring-offset-0"
            {...register('rememberMe')}
          />
          <label htmlFor="rememberMe" className="text-sm text-[#B0B0B0]">
            Lembrar de mim
          </label>
        </div>

        {/* Google Button */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          className="w-full h-12 rounded-lg btn-gradient text-white font-semibold flex items-center justify-center gap-3 hover:opacity-90 transition-all"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Continuar com Google
        </button>

        {/* Divider */}
        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#16213E]"></div>
          </div>
          <span className="relative bg-gradient-to-r from-[#1A1A2E] via-[#1A1A2E] to-[#1A1A2E] px-4 text-sm text-[#B0B0B0]">ou continue com</span>
        </div>

        {/* Microsoft Button */}
        <button
          type="button"
          onClick={handleMicrosoftLogin}
          className="w-full h-12 rounded-lg border border-[#16213E] bg-[#16213E] text-white font-semibold flex items-center justify-center gap-3 hover:bg-[#1a2744] transition-all"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path fill="#F25022" d="M1 1h10v10H1z" />
            <path fill="#00A4EF" d="M1 13h10v10H1z" />
            <path fill="#7FBA00" d="M13 1h10v10H13z" />
            <path fill="#FFB900" d="M13 13h10v10H13z" />
          </svg>
          Continuar com Microsoft
        </button>

        {/* Submit button (hidden, form submits with Enter) */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-12 rounded-lg bg-[#16213E] border border-[#00E4F2]/30 text-white font-semibold flex items-center justify-center gap-2 hover:border-[#00E4F2] hover:bg-[#16213E]/80 transition-all disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Entrando...
            </>
          ) : (
            'Entrar com Email'
          )}
        </button>
      </form>

      {/* Footer link */}
      <p className="mt-8 text-center text-sm text-[#B0B0B0]">
        Não tem uma conta?{' '}
        <Link href="/register" className="font-medium text-[#00E4F2] hover:underline">
          Cadastre-se
        </Link>
      </p>
    </div>
  );
}
