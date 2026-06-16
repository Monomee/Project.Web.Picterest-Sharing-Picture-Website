'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useInView } from 'react-intersection-observer';
import { useAuth } from '@/hooks/useAuth';
import MasonryGrid from '@/components/pinterest/MasonryGrid';
import { Post } from '@/components/pinterest/PinCard';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://localhost:7287/api';

// Loading skeleton mirroring the Masonry grid column layout to prevent initial shift
const SkeletonGrid = () => {
  const skeletonRatios = [0.66, 1.2, 0.8, 1.0, 0.75, 1.33, 0.8, 0.66];
  return (
    <div className="flex gap-4 w-full animate-pulse">
      {Array.from({ length: 4 }).map((_, colIdx) => (
        <div key={colIdx} className="flex flex-col gap-4 flex-1">
          {Array.from({ length: 3 }).map((_, rowIdx) => {
            const ratio = skeletonRatios[(colIdx * 3 + rowIdx) % skeletonRatios.length];
            return (
              <div
                key={rowIdx}
                style={{ aspectRatio: `${ratio}` }}
                className="w-full rounded-2xl bg-white/5 border border-white/10"
              />
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default function HomePage() {
  const { token, user, isAuthenticated, logout } = useAuth();
  const { ref, inView } = useInView({
    threshold: 0.1,
  });

  const fetchFeed = async ({ pageParam = 1 }): Promise<Post[]> => {
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}/posts/feed?page=${pageParam}&pageSize=10`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error('Failed to load feed posts from server.');
    }

    return response.json();
  };

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
  } = useInfiniteQuery({
    queryKey: ['posts-feed', token],
    queryFn: fetchFeed,
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      // If the last page returned has fewer items than our page limit (10), 
      // we have reached the end of the available feed records.
      if (lastPage.length < 10) {
        return undefined;
      }
      return allPages.length + 1;
    },
  });

  // Automatically fetch next page when user scrolls to the bottom
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Flatten the paginated arrays of posts
  const posts: Post[] = data?.pages.flatMap((page) => page) || [];

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col relative overflow-hidden">
      {/* Sleek background gradient glowing blobs */}
      <div className="absolute top-[-10%] left-[-10%] h-[600px] w-[600px] rounded-full bg-purple-900/10 blur-[130px]" />
      <div className="absolute bottom-[-10%] right-[-10%] h-[600px] w-[600px] rounded-full bg-pink-900/10 blur-[130px]" />

      {/* Sticky Global Navigation Bar */}
      <nav className="sticky top-0 bg-slate-950/80 border-b border-white/10 px-6 py-4 flex justify-between items-center backdrop-blur-md z-50">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-md shadow-purple-500/20">
              <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-purple-200 to-pink-200 bg-clip-text text-transparent">
              Picterest
            </span>
          </Link>
          
          <Link 
            href="/" 
            className="text-sm font-semibold text-gray-200 hover:text-white transition"
          >
            Explore
          </Link>

          {isAuthenticated && (
            <Link 
              href="/posts/create" 
              className="text-sm font-semibold text-gray-400 hover:text-white transition"
            >
              Create Pin
            </Link>
          )}
        </div>

        {/* User Account Controls */}
        <div className="flex items-center gap-4">
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

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8">
        
        {/* Personalized Welcome Header */}
        {isAuthenticated && user && (
          <div className="mb-8 animate-fadeIn">
            <h1 className="text-2xl font-bold text-gray-200">
              Welcome back, <span className="text-purple-400">{user.username}</span>!
            </h1>
            <p className="text-sm text-gray-400">
              Showing public pins from accounts you follow first, followed by the rest of the community.
            </p>
          </div>
        )}

        {/* Feed States */}
        {isLoading ? (
          <SkeletonGrid />
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
            <div className="rounded-full bg-red-500/10 border border-red-500/30 p-4 text-red-500">
              <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold">Failed to load feed</h3>
            <p className="text-sm text-gray-500 max-w-md">
              {(error as Error)?.message || 'We had trouble loading the home page posts. Please try reloading the page.'}
            </p>
          </div>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
            <div className="text-gray-500">
              <svg className="h-12 w-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold">No posts available</h3>
            <p className="text-sm text-gray-400">Be the first to upload a pin!</p>
            {isAuthenticated && (
              <Link
                href="/posts/create"
                className="mt-2 inline-block rounded-lg bg-white/10 hover:bg-white/20 px-4 py-2 text-sm font-semibold transition"
              >
                Create a Pin
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-8">
            {/* Masonry Grid Feed */}
            <MasonryGrid items={posts} />

            {/* Bottom loading trigger element */}
            <div ref={ref} className="flex justify-center py-8">
              {isFetchingNextPage ? (
                <div className="flex gap-2 items-center text-gray-400">
                  <svg className="animate-spin h-5 w-5 text-purple-500" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span className="text-sm">Loading more pins...</span>
                </div>
              ) : hasNextPage ? (
                <span className="text-xs text-gray-500">Scroll down to view more</span>
              ) : (
                <span className="text-xs text-gray-600 font-semibold tracking-wider uppercase">
                  You have caught up with all public pins!
                </span>
              )}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}