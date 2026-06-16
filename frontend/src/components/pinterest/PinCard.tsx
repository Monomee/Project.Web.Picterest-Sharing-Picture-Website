'use client';

import React, { useState } from 'react';

export interface Post {
  id: number;
  userId: number;
  username: string;
  avatarUrl?: string;
  caption: string;
  imageUrl: string;
  cloudinaryPublicId: string;
  createdAt: string;
}

// Generates a deterministic aspect ratio from a post ID to prevent Cumulative Layout Shift (CLS)
export function getDeterministicAspectRatio(id: number | string): number {
  let hash = 0;
  const str = String(id);
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  // Common aspect ratios in Pinterest masonry feeds
  const ratios = [0.66, 0.75, 0.8, 1.0, 1.2, 1.33];
  const index = Math.abs(hash) % ratios.length;
  return ratios[index];
}

interface PinCardProps {
  post: Post;
}

export default function PinCard({ post }: PinCardProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0); // Optional default mock
  const [isAnimating, setIsAnimating] = useState(false);

  const aspectRatio = getDeterministicAspectRatio(post.id);

  const handleLikeToggle = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card clicks if navigation is added later
    setIsAnimating(true);
    setIsLiked(!isLiked);
    setLikeCount(prev => isLiked ? prev - 1 : prev + 1);

    setTimeout(() => {
      setIsAnimating(false);
    }, 300);
  };

  return (
    <div className="group relative w-full overflow-hidden rounded-2xl bg-white/5 border border-white/10 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/5 hover:-translate-y-1">
      {/* Container pre-allocated space using aspect-ratio to completely eliminate CLS */}
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
          
          {/* Top Row: Actions */}
          <div className="flex justify-end">
            <button
              onClick={handleLikeToggle}
              className={`flex h-10 w-10 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md text-white transition-all duration-300 shadow-md ${
                isLiked ? 'text-red-500 bg-white/20' : 'hover:scale-110'
              } ${isAnimating ? 'scale-125' : ''}`}
            >
              <svg
                className={`h-5 w-5 fill-current transition-transform duration-300 ${
                  isLiked ? 'scale-110' : 'fill-none stroke-current'
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
          </div>

          {/* Bottom Row: Metadata & Caption */}
          <div className="space-y-2 text-white">
            {post.caption && (
              <p className="text-sm font-semibold line-clamp-2 drop-shadow-md">
                {post.caption}
              </p>
            )}

            {/* Author details */}
            <div className="flex items-center gap-2">
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
