'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { getFollowers, getFollowing } from '@/services/post.service';

interface FollowsListModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: number;
  type: 'followers' | 'following';
}

export default function FollowsListModal({ isOpen, onClose, userId, type }: FollowsListModalProps) {
  // Fetch followers/following list
  const { data: users, isLoading, isError } = useQuery({
    queryKey: ['profile-follows-list', userId, type],
    queryFn: () => type === 'followers' ? getFollowers(userId) : getFollowing(userId),
    enabled: isOpen,
  });

  // Handle ESC key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
      {/* Background click to dismiss */}
      <div className="absolute inset-0 cursor-default" onClick={onClose} />

      {/* Modal Card */}
      <div className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-slate-900/90 backdrop-blur-2xl p-6 shadow-2xl z-10 animate-scaleUp">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-4">
          <h3 className="text-sm font-bold bg-gradient-to-r from-purple-200 to-pink-200 bg-clip-text text-transparent uppercase tracking-wider">
            {type === 'followers' ? 'Followers' : 'Following'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition"
            aria-label="Close modal"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
          {isLoading ? (
            <div className="flex justify-center py-6">
              <svg className="animate-spin h-6 w-6 text-purple-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
          ) : isError ? (
            <div className="text-center text-xs text-red-400 py-4">
              Failed to load list.
            </div>
          ) : !users || users.length === 0 ? (
            <div className="text-center text-xs text-gray-500 py-6">
              {type === 'followers' ? 'No followers yet.' : 'Not following anyone yet.'}
            </div>
          ) : (
            <div className="space-y-3">
              {users.map((u) => (
                <Link
                  key={u.id}
                  href={`/profile/${u.id}`}
                  onClick={onClose}
                  className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/5 transition"
                >
                  {u.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={u.avatarUrl}
                      alt={u.username}
                      className="h-8 w-8 rounded-full object-cover border border-white/10"
                    />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-500/20 border border-purple-500/30 text-xs font-bold text-purple-300">
                      {u.username.substring(0, 2).toUpperCase()}
                    </div>
                  )}
                  <span className="text-xs font-semibold text-white hover:text-purple-300 transition">
                    {u.username}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
