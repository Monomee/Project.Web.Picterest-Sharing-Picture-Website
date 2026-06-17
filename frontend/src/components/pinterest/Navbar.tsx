'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeSearch = searchParams.get('search') || '';

  const [searchInput, setSearchInput] = useState(activeSearch);

  // Synchronize search text input with search query changes in URL
  useEffect(() => {
    setSearchInput(activeSearch);
  }, [activeSearch]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanSearch = searchInput.trim();
    if (cleanSearch) {
      router.push(`/?search=${encodeURIComponent(cleanSearch)}`);
    } else {
      router.push('/');
    }
  };

  return (
    <nav className="sticky top-0 bg-slate-950/80 border-b border-white/10 px-6 py-4 flex justify-between items-center backdrop-blur-md z-50">
      <div className="flex items-center gap-6 flex-shrink-0">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-md shadow-purple-500/20">
            <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-purple-200 to-pink-200 bg-clip-text text-transparent hidden xs:inline">
            Picterest
          </span>
        </Link>
        
        <Link 
          href="/" 
          className="text-sm font-semibold text-gray-200 hover:text-white transition hidden md:inline"
        >
          Explore
        </Link>

        {isAuthenticated && (
          <Link 
            href="/posts/create" 
            className="text-sm font-semibold text-gray-400 hover:text-white transition hidden md:inline"
          >
            Create Pin
          </Link>
        )}

        {isAuthenticated && user && (user.roles.includes('admin') || user.roles.includes('moderator')) && (
          <Link 
            href="/admin/reports" 
            className="text-sm font-semibold text-purple-400 hover:text-purple-300 transition hidden lg:inline"
          >
            Admin Dashboard
          </Link>
        )}
      </div>

      {/* Styled Interactive Search Bar */}
      <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md mx-4 sm:mx-6 relative">
        <div className="relative">
          <input
            type="text"
            placeholder="Search captions or tags..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 outline-none rounded-full py-2 pl-9 pr-4 text-xs text-white placeholder-gray-400 transition-all duration-200"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </form>

      {/* User Account Controls */}
      <div className="flex items-center gap-4 flex-shrink-0">
        {isAuthenticated && user ? (
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 font-bold text-xs">
              {user.username.substring(0, 2).toUpperCase()}
            </div>
            <span className="hidden sm:inline text-sm text-gray-300 font-medium">{user.username}</span>
            <button
              onClick={logout}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/5 text-gray-400 hover:text-white transition"
            >
              Log Out
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            className="rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-2 text-sm font-semibold text-white shadow-md hover:shadow-purple-500/10 transition-transform hover:-translate-y-0.5"
          >
            Sign In
          </Link>
        )}
      </div>
    </nav>
  );
}
