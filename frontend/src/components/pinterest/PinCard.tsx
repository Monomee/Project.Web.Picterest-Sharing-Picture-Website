'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { toggleLike, Post } from '@/services/post.service';

// Generates a deterministic aspect ratio from a post ID to prevent Cumulative Layout Shift (CLS)
export function getDeterministicAspectRatio(id: number | string): number {
  let hash = 0;
  const str = String(id);
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const ratios = [0.66, 0.75, 0.8, 1.0, 1.2, 1.33];
  const index = Math.abs(hash) % ratios.length;
  return ratios[index];
}

interface PinCardProps {
  post: Post;
}

export default function PinCard({ post }: PinCardProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();
  const [isAnimating, setIsAnimating] = useState(false);

  const aspectRatio = getDeterministicAspectRatio(post.id);

  // TanStack Mutation for Optimistic Likes Toggle
  const likeMutation = useMutation({
    mutationFn: () => toggleLike(post.id),
    onMutate: async () => {
      // Cancel outgoing refetches so they don't overwrite our optimistic state
      await queryClient.cancelQueries({ queryKey: ['posts-feed'] });

      // Snapshot previous query data for all matching feeds (including those with tokens)
      const previousFeeds = queryClient.getQueriesData({ queryKey: ['posts-feed'] });

      // Optimistically update query data
      queryClient.setQueriesData({ queryKey: ['posts-feed'] }, (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          pages: oldData.pages.map((page: any) =>
            page.map((p: any) => {
              if (p.id === post.id) {
                const nextIsLiked = !p.isLikedByUser;
                return {
                  ...p,
                  isLikedByUser: nextIsLiked,
                  likeCount: nextIsLiked ? p.likeCount + 1 : p.likeCount - 1,
                };
              }
              return p;
            })
          ),
        };
      });

      // Also optimistically update single post detail cache if it exists
      const previousPostDetail = queryClient.getQueryData(['post-detail', post.id]);
      queryClient.setQueryData(['post-detail', post.id], (old: any) => {
        if (!old) return old;
        const nextIsLiked = !old.isLikedByUser;
        return {
          ...old,
          isLikedByUser: nextIsLiked,
          likeCount: nextIsLiked ? old.likeCount + 1 : old.likeCount - 1,
        };
      });

      return { previousFeeds, previousPostDetail };
    },
    onError: (err, newLike, context) => {
      // Rollback feeds
      if (context?.previousFeeds) {
        context.previousFeeds.forEach(([queryKey, previousData]) => {
          queryClient.setQueryData(queryKey, previousData);
        });
      }
      // Rollback post detail
      if (context?.previousPostDetail) {
        queryClient.setQueryData(['post-detail', post.id], context.previousPostDetail);
      }
    },
    onSettled: () => {
      // Sync cache after mutations
      queryClient.invalidateQueries({ queryKey: ['posts-feed'] });
      queryClient.invalidateQueries({ queryKey: ['post-detail', post.id] });
    },
  });

  const handleLikeToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    setIsAnimating(true);
    likeMutation.mutate();
    setTimeout(() => {
      setIsAnimating(false);
    }, 300);
  };

  const handleDownload = async (e: React.MouseEvent, imageUrl: string, filename: string) => {
    e.stopPropagation();
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('Download failed, opening in tab:', err);
      window.open(imageUrl, '_blank');
    }
  };

  const handleCardClick = () => {
    // Append postId search param to trigger the detail modal deep link
    router.push(`?postId=${post.id}`, { scroll: false });
  };

  return (
    <div 
      onClick={handleCardClick}
      className="group relative w-full overflow-hidden rounded-2xl bg-white/5 border border-white/10 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/5 hover:-translate-y-1 cursor-zoom-in"
    >
      {/* Aspect-Ratio pre-allocation to eliminate CLS */}
      <div 
        style={{ aspectRatio: `${aspectRatio}` }} 
        className="relative w-full overflow-hidden bg-slate-900 flex items-center justify-center"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={post.imageUrl}
          alt={post.caption || 'Pin'}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Absolute Hover Overlay */}
        <div className="absolute inset-0 bg-black/40 p-4 flex flex-col justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
          
          {/* Top Row: Like & Download Buttons */}
          <div className="flex justify-end items-center gap-2">
            {post.likeCount > 0 && (
              <span className="text-xs font-semibold text-white bg-black/30 backdrop-blur-sm px-2 py-1 rounded-md">
                {post.likeCount} {post.likeCount === 1 ? 'like' : 'likes'}
              </span>
            )}
            <button
              onClick={handleLikeToggle}
              className={`flex h-10 w-10 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md text-white transition-all duration-300 shadow-md ${
                post.isLikedByUser ? 'text-red-500 bg-white/20' : 'hover:scale-110'
              } ${isAnimating ? 'scale-125' : ''}`}
            >
              <svg
                className={`h-5 w-5 fill-current transition-transform duration-300 ${
                  post.isLikedByUser ? 'scale-110' : 'fill-none stroke-current'
                }`}
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
            </button>
            <button
              onClick={(e) => handleDownload(e, post.imageUrl, `pin-${post.id}.jpg`)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md text-white transition-all duration-300 shadow-md hover:scale-110"
              title="Download image"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </button>
          </div>

          {/* Bottom Row: Metadata & Caption */}
          <div className="space-y-2 text-white">
            {post.caption && (
              <p className="text-sm font-semibold line-clamp-2 drop-shadow-md">
                {post.caption}
              </p>
            )}

            {/* Author details */}
            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
              {post.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={post.avatarUrl}
                  alt={post.username}
                  className="h-7 w-7 rounded-full object-cover border border-white/20"
                />
              ) : (
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-purple-500/30 border border-purple-500/40 text-xs font-bold text-purple-200">
                  {post.username.substring(0, 2).toUpperCase()}
                </div>
              )}
              <span className="text-xs font-medium drop-shadow-md truncate max-w-[150px]">
                {post.username}
              </span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
