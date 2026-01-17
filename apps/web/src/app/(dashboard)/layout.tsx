'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Route } from 'next';
import {
  LayoutDashboard,
  FolderKanban,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Building2,
  BarChart3,
  Zap,
} from 'lucide-react';
import { useState } from 'react';

import { useAuth } from '@/contexts/auth-context';

const navigation: Array<{ name: string; href: Route; icon: typeof LayoutDashboard }> = [
  { name: 'Dashboard', href: '/dashboard' as Route, icon: LayoutDashboard },
  { name: 'Projetos', href: '/projects' as Route, icon: FolderKanban },
  { name: 'Analytics', href: '/projects' as Route, icon: BarChart3 },
  { name: 'Configurações', href: '/settings' as Route, icon: Settings },
];

// Logo 3D small version for sidebar
function LogoIcon() {
  return (
    <div className="relative flex h-10 w-10 items-center justify-center">
      <svg viewBox="0 0 40 40" className="w-10 h-10">
        <defs>
          <linearGradient id="sidebarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00E4F2" />
            <stop offset="100%" stopColor="#D12BF2" />
          </linearGradient>
        </defs>
        <rect x="2" y="2" width="36" height="36" rx="8" fill="url(#sidebarGradient)" />
        <text x="20" y="28" textAnchor="middle" fill="white" fontSize="22" fontWeight="900" fontFamily="system-ui">Z</text>
      </svg>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [tenantMenuOpen, setTenantMenuOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center gradient-bg">
        <div className="flex flex-col items-center gap-4">
          <LogoIcon />
          <div className="h-1 w-32 overflow-hidden rounded-full bg-[#16213E]">
            <div className="h-full w-1/2 animate-pulse rounded-full gradient-main" />
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const isActive = (href: string) => pathname === href || pathname?.startsWith(href + '/');

  return (
    <div className="flex h-screen gradient-bg">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 transform bg-[#16213E] border-r border-[#00E4F2]/10 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-between px-4">
            <Link href="/dashboard" className="flex items-center gap-3">
              <LogoIcon />
              <span className="text-xl font-bold logo-gradient">ZtackPro</span>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 hover:bg-[#1A1A2E] rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-white" />
            </button>
          </div>

          {/* Tenant selector */}
          <div className="px-4 pb-4">
            <div className="relative">
              <button
                onClick={() => setTenantMenuOpen(!tenantMenuOpen)}
                className="flex w-full items-center justify-between rounded-lg bg-[#1A1A2E] px-3 py-2.5 text-sm hover:bg-[#1A1A2E]/80 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#00E4F2]/20">
                    <Building2 className="h-4 w-4 text-[#00E4F2]" />
                  </div>
                  <span className="truncate font-medium text-white">Minha Empresa</span>
                </div>
                <ChevronDown className={`h-4 w-4 text-[#B0B0B0] transition-transform ${tenantMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {tenantMenuOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 rounded-lg border border-[#00E4F2]/20 bg-[#16213E] shadow-lg z-10">
                  <div className="p-2">
                    <button className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-[#1A1A2E] transition-colors text-white">
                      <div className="flex h-6 w-6 items-center justify-center rounded bg-[#00E4F2]/20">
                        <Building2 className="h-3.5 w-3.5 text-[#00E4F2]" />
                      </div>
                      <span>Minha Empresa</span>
                    </button>
                    <button className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-[#1A1A2E] transition-colors text-[#B0B0B0]">
                      <div className="flex h-6 w-6 items-center justify-center rounded border border-dashed border-[#B0B0B0]/30">
                        <span className="text-xs">+</span>
                      </div>
                      <span>Criar workspace</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 space-y-1">
            {navigation.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                    active
                      ? 'bg-[#00E4F2]/10 text-[#00E4F2]'
                      : 'text-[#B0B0B0] hover:bg-[#1A1A2E] hover:text-white'
                  }`}
                >
                  <item.icon className={`h-5 w-5 ${active ? 'text-[#00E4F2]' : ''}`} />
                  <span>{item.name}</span>
                  {active && (
                    <div className="ml-auto h-1.5 w-1.5 rounded-full bg-[#00E4F2]" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Status card */}
          <div className="px-4 py-3">
            <div className="rounded-lg card-gradient-cyan p-4">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-4 w-4 text-[#00E4F2]" />
                <span className="text-sm font-semibold text-white">Status</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-[#B0B0B0]">
                <div className="h-2 w-2 rounded-full bg-[#00E676] animate-pulse" />
                <span>Tracking ativo</span>
              </div>
            </div>
          </div>

          {/* User section */}
          <div className="border-t border-[#00E4F2]/10 p-4">
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-[#1A1A2E] transition-colors"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full gradient-main text-white font-semibold">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="font-medium truncate text-white">{user?.name}</p>
                  <p className="text-xs text-[#B0B0B0] truncate">
                    {user?.email}
                  </p>
                </div>
                <ChevronDown className={`h-4 w-4 text-[#B0B0B0] transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {userMenuOpen && (
                <div className="absolute bottom-full left-0 mb-2 w-full rounded-lg border border-[#00E4F2]/20 bg-[#16213E] shadow-lg overflow-hidden">
                  <div className="p-1">
                    <Link
                      href="/settings"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-[#1A1A2E] transition-colors text-white"
                    >
                      <Settings className="h-4 w-4" />
                      <span>Configurações</span>
                    </Link>
                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        logout();
                      }}
                      className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-[#FF6B6B] hover:bg-[#FF6B6B]/10 transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Sair</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-16 items-center justify-between border-b border-[#00E4F2]/10 bg-[#16213E]/50 backdrop-blur-sm px-4 lg:px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 hover:bg-[#1A1A2E] rounded-lg transition-colors lg:hidden"
          >
            <Menu className="h-5 w-5 text-white" />
          </button>

          {/* Status indicator */}
          <div className="hidden lg:flex items-center gap-4 ml-auto">
            <div className="flex items-center gap-2 text-sm text-[#B0B0B0]">
              <div className="h-2 w-2 rounded-full bg-[#00E676]" />
              <span>Todos sistemas operacionais</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
