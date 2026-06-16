'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  // Validate that the user is authenticated and is an admin or moderator
  const hasAccess = user && (user.roles.includes('admin') || user.roles.includes('moderator'));

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated || !hasAccess) {
        router.push('/');
      }
    }
  }, [isLoading, isAuthenticated, hasAccess, router]);

  // Loading indicator while auth state resolves
  if (isLoading || (!hasAccess && !isLoading)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <svg className="animate-spin h-10 w-10 text-purple-500" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-950 text-white">
      {/* Admin Sidebar Navigation */}
      <aside className="w-64 border-r border-white/10 bg-slate-900/50 backdrop-blur-md flex flex-col justify-between p-6 shrink-0">
        <div className="space-y-8">
          
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-md shadow-purple-500/20">
              <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-purple-200 to-pink-200 bg-clip-text text-transparent">
              ModPortal
            </span>
          </Link>

          {/* Navigation Links */}
          <nav className="space-y-2">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-3">
              Moderation Tools
            </div>
            <Link
              href="/admin/reports"
              className="flex items-center gap-3 rounded-lg bg-white/5 border border-white/5 px-4 py-2.5 text-sm font-medium text-white hover:bg-white/10 transition"
            >
              <svg className="h-5 w-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Pending Reports
            </Link>
          </nav>
        </div>

        {/* Footer Area */}
        <div className="space-y-4">
          <div className="border-t border-white/10 pt-4 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 font-bold text-xs">
              {user?.username?.substring(0, 2).toUpperCase()}
            </div>
            <div className="truncate">
              <p className="text-xs font-semibold text-white truncate">{user?.username}</p>
              <p className="text-[10px] text-gray-500 font-medium tracking-wide uppercase">
                {user?.roles?.includes('admin') ? 'Admin' : 'Moderator'}
              </p>
            </div>
          </div>

          <Link
            href="/"
            className="flex items-center justify-center gap-2 w-full text-xs font-semibold px-4 py-2 rounded-lg border border-white/10 hover:bg-white/5 text-gray-400 hover:text-white transition"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Feed
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 overflow-y-auto p-10">
        {children}
      </main>
    </div>
  );
}
