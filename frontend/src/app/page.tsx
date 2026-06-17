'use client';

import React, { useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useInView } from 'react-intersection-observer';
import { useAuth } from '@/hooks/useAuth';
import MasonryGrid from '@/components/pinterest/MasonryGrid';
import { Post } from '@/services/post.service';
import { useSearchParams } from 'next/navigation';
import PinDetailModal from '@/components/pinterest/PinDetailModal';
import Navbar from '@/components/pinterest/Navbar';

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

function HomeFeedContent() {
  const { token, user, isAuthenticated } = useAuth();
  const searchParams = useSearchParams();
  const search = searchParams.get('search') || '';
  const fetchFeed = async ({ pageParam = 1 }): Promise<Post[]> => {
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const searchVal = search ? `&search=${encodeURIComponent(search)}` : '';
    const response = await fetch(`${API_URL}/posts/feed?page=${pageParam}&pageSize=10${searchVal}`, {
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
    queryKey: ['posts-feed', token, search],
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

  const { ref, inView } = useInView({
    threshold: 0.1,
    skip: isLoading || isFetchingNextPage,
  });

  // Flatten the paginated arrays of posts
  const posts: Post[] = data?.pages.flatMap((page) => page) || [];

  // Automatically fetch next page when user scrolls to the bottom
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage && !isLoading && posts.length > 0) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, isLoading, posts.length, fetchNextPage]);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col relative overflow-hidden">
      {/* Sleek background gradient glowing blobs */}
      <div className="absolute top-[-10%] left-[-10%] h-[600px] w-[600px] rounded-full bg-purple-900/10 blur-[130px]" />
      <div className="absolute bottom-[-10%] right-[-10%] h-[600px] w-[600px] rounded-full bg-pink-900/10 blur-[130px]" />

      {/* Sticky Global Navigation Bar */}
      <Suspense fallback={<div className="h-[73px] bg-slate-950/80 border-b border-white/10" />}>
        <Navbar />
      </Suspense>

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
      <Suspense fallback={null}>
        <PinDetailModal />
      </Suspense>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <svg className="animate-spin h-10 w-10 text-purple-500" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    }>
      <HomeFeedContent />
    </Suspense>
  );
}