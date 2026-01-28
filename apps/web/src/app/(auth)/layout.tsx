'use client';

import Image from 'next/image';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen gradient-bg">
      {/* Left side - Form */}
      <div className="flex w-full lg:w-1/2 flex-col justify-center px-6 py-12 lg:px-12">
        <div className="mx-auto w-full max-w-md">
          {children}
        </div>
      </div>

      {/* Right side - 3D Logo (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center relative overflow-hidden">
        {/* Animated background glow effects */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 right-1/4 w-80 h-80 bg-[#00E4F2] rounded-full blur-[150px] opacity-40 animate-pulse" />
          <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-[#D12BF2] rounded-full blur-[150px] opacity-40 animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#68007B] rounded-full blur-[200px] opacity-20" />
        </div>

        {/* Animated decorative circles */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 right-1/4 w-40 h-40 border border-[#00E4F2]/30 rounded-full animate-spin" style={{ animationDuration: '20s' }} />
          <div className="absolute bottom-1/3 left-1/3 w-56 h-56 border border-[#D12BF2]/20 rounded-full animate-spin" style={{ animationDuration: '25s', animationDirection: 'reverse' }} />
          <div className="absolute top-1/2 right-1/3 w-32 h-32 border border-[#68007B]/30 rounded-full animate-spin" style={{ animationDuration: '15s' }} />
          {/* Inner glow ring */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[420px] rounded-full border-2 border-[#00E4F2]/10" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] h-[480px] rounded-full border border-[#D12BF2]/10" />
        </div>

        {/* 3D Z Logo Image with effects */}
        <div className="relative z-10 transform rotate-[-12deg] hover:rotate-[-8deg] hover:scale-105 transition-all duration-500 ease-out">
          {/* Glow behind logo */}
          <div className="absolute inset-0 blur-3xl opacity-50">
            <Image
              src="/logo-3d.png"
              alt=""
              width={550}
              height={550}
              className="opacity-60"
              aria-hidden="true"
            />
          </div>
          {/* Main logo */}
          <Image
            src="/logo-3d.png"
            alt="ZtackPro Logo"
            width={550}
            height={550}
            className="relative"
            style={{
              filter: 'drop-shadow(0 0 60px rgba(0, 228, 242, 0.5)) drop-shadow(0 0 120px rgba(209, 43, 242, 0.4))',
            }}
            priority
          />
          {/* Reflection effect */}
          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-3/4 h-8 bg-gradient-to-t from-transparent via-[#00E4F2]/10 to-transparent blur-xl rounded-full" />
        </div>

        {/* Floating particles */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-[#00E4F2] rounded-full animate-bounce opacity-60" style={{ animationDuration: '3s' }} />
          <div className="absolute top-1/3 right-1/4 w-1.5 h-1.5 bg-[#D12BF2] rounded-full animate-bounce opacity-60" style={{ animationDuration: '2.5s', animationDelay: '0.5s' }} />
          <div className="absolute bottom-1/3 right-1/3 w-2 h-2 bg-[#00E4F2] rounded-full animate-bounce opacity-60" style={{ animationDuration: '2s', animationDelay: '1s' }} />
          <div className="absolute bottom-1/4 left-1/3 w-1 h-1 bg-[#D12BF2] rounded-full animate-bounce opacity-60" style={{ animationDuration: '3.5s', animationDelay: '0.3s' }} />
        </div>
      </div>
    </div>
  );
}
