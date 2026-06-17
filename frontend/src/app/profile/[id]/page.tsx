'use client';

import React, { use, useState, Suspense } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { getProfile, getProfilePosts, toggleFollow } from '@/services/post.service';
import Navbar from '@/components/pinterest/Navbar';
import MasonryGrid from '@/components/pinterest/MasonryGrid';
import PinDetailModal from '@/components/pinterest/PinDetailModal';
import EditProfileModal from '@/components/pinterest/EditProfileModal';
import FollowsListModal from '@/components/pinterest/FollowsListModal';

function ProfilePageContent({ id }: { id: number }) {
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuth();
  
  const [activeTab, setActiveTab] = useState<'created' | 'liked'>('created');
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [followsModalState, setFollowsModalState] = useState<{
    isOpen: boolean;
    type: 'followers' | 'following';
  }>({
    isOpen: false,
    type: 'followers',
  });

  const isOwner = user && parseInt(user.id, 10) === id;

  // Fetch unified profile metadata
  const { data: profile, isLoading: isProfileLoading, isError: isProfileError } = useQuery({
    queryKey: ['user-profile', id],
    queryFn: () => getProfile(id),
  });

  // Fetch tab-specific posts
  const { data: posts, isLoading: isPostsLoading } = useQuery({
    queryKey: ['profile-posts', id, activeTab],
    queryFn: () => getProfilePosts(id, activeTab),
  });

  // Follow/Unfollow toggle mutation
  const followMutation = useMutation({
    mutationFn: () => toggleFollow(id),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['user-profile', id] });
      const previousProfile = queryClient.getQueryData(['user-profile', id]);

      // Optimistically update counts and follow state
      queryClient.setQueryData(['user-profile', id], (old: any) => {
        if (!old) return old;
        const nextFollowing = !old.isFollowing;
        return {
          ...old,
          isFollowing: nextFollowing,
          followersCount: nextFollowing ? old.followersCount + 1 : old.followersCount - 1,
        };
      });

      return { previousProfile };
    },
    onError: (err, variables, context) => {
      if (context?.previousProfile) {
        queryClient.setQueryData(['user-profile', id], context.previousProfile);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profile', id] });
    },
  });

  if (isProfileLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col relative overflow-hidden">
        <Suspense fallback={<div className="h-[73px] bg-slate-950/80 border-b border-white/10" />}>
          <Navbar />
        </Suspense>
        <div className="flex-1 flex items-center justify-center">
          <svg className="animate-spin h-10 w-10 text-purple-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      </div>
    );
  }

  if (isProfileError || !profile) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col relative overflow-hidden">
        <Suspense fallback={<div className="h-[73px] bg-slate-950/80 border-b border-white/10" />}>
          <Navbar />
        </Suspense>
        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
          <div className="rounded-full bg-red-500/10 border border-red-500/30 p-4 text-red-500">
            <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-white">Profile not found</h3>
          <p className="text-sm text-gray-500">The user profile you are trying to view does not exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col relative overflow-hidden">
      {/* Sleek background gradient glowing blobs */}
      <div className="absolute top-[-10%] left-[-10%] h-[500px] w-[500px] rounded-full bg-purple-900/10 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] h-[500px] w-[500px] rounded-full bg-pink-900/10 blur-[130px] pointer-events-none" />

      <Suspense fallback={<div className="h-[73px] bg-slate-950/80 border-b border-white/10" />}>
        <Navbar />
      </Suspense>

      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-10 z-10 space-y-8">
        
        {/* Profile Header Card */}
        <div className="relative rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
          
          {/* Metadata Section */}
          <div className="flex flex-col md:flex-row items-center gap-6">
            {profile.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatarUrl}
                alt={profile.username}
                className="h-24 w-24 rounded-full object-cover border-2 border-purple-500/30"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-purple-500/20 border border-purple-500/30 text-3xl font-bold text-purple-300">
                {profile.username.substring(0, 2).toUpperCase()}
              </div>
            )}
            
            <div className="text-center md:text-left space-y-2">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-200 to-pink-200 bg-clip-text text-transparent">
                {profile.username}
              </h1>
              
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-4 gap-y-1 text-xs text-gray-400">
                <span>
                  Joined {profile.createdAt && new Date(profile.createdAt).toLocaleDateString(undefined, {
                    month: 'long',
                    year: 'numeric'
                  })}
                </span>
                <span className="hidden sm:inline text-white/20">•</span>
                <button
                  onClick={() => setFollowsModalState({ isOpen: true, type: 'followers' })}
                  className="hover:text-purple-300 font-medium transition cursor-pointer"
                >
                  {profile.followersCount} Followers
                </button>
                <span className="hidden sm:inline text-white/20">•</span>
                <button
                  onClick={() => setFollowsModalState({ isOpen: true, type: 'following' })}
                  className="hover:text-purple-300 font-medium transition cursor-pointer"
                >
                  {profile.followingCount} Following
                </button>
              </div>
            </div>
          </div>

          {/* Action Button Section */}
          <div className="shrink-0">
            {isOwner ? (
              <button
                onClick={() => setIsEditOpen(true)}
                className="rounded-xl border border-white/15 hover:bg-white/5 px-6 py-2.5 text-sm font-semibold transition"
              >
                Edit Profile
              </button>
            ) : (
              <button
                onClick={() => {
                  if (!isAuthenticated) return;
                  followMutation.mutate();
                }}
                disabled={followMutation.isPending}
                className={`rounded-xl px-6 py-2.5 text-sm font-semibold transition-all ${
                  profile.isFollowing
                    ? 'border border-white/10 hover:border-red-500/30 hover:bg-red-500/5 hover:text-red-400 text-gray-300'
                    : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/15 hover:opacity-90 active:scale-95'
                }`}
              >
                {profile.isFollowing ? 'Following' : 'Follow'}
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-white/10 pb-px">
          <button
            onClick={() => setActiveTab('created')}
            className={`px-6 py-3 text-sm font-bold border-b-2 transition-all ${
              activeTab === 'created'
                ? 'border-purple-500 text-white'
                : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            Created
          </button>
          <button
            onClick={() => setActiveTab('liked')}
            className={`px-6 py-3 text-sm font-bold border-b-2 transition-all ${
              activeTab === 'liked'
                ? 'border-purple-500 text-white'
                : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            Liked
          </button>
        </div>

        {/* Tab Content Feed Grid */}
        <div className="min-h-[200px]">
          {isPostsLoading ? (
            <div className="flex items-center justify-center py-12">
              <svg className="animate-spin h-7 w-7 text-gray-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
          ) : !posts || posts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-gray-500">
              <svg className="h-10 w-10 mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-xs">No posts to display in this section.</p>
            </div>
          ) : (
            <MasonryGrid items={posts} />
          )}
        </div>

      </main>

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        currentUsername={profile.username}
        currentAvatarUrl={profile.avatarUrl}
        onUpdateSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['user-profile', id] });
          queryClient.invalidateQueries({ queryKey: ['profile-posts', id] });
        }}
      />

      {/* Follows List Modal */}
      <FollowsListModal
        isOpen={followsModalState.isOpen}
        onClose={() => setFollowsModalState(prev => ({ ...prev, isOpen: false }))}
        userId={id}
        type={followsModalState.type}
      />

      {/* Global Detail Modal */}
      <Suspense fallback={null}>
        <PinDetailModal />
      </Suspense>
    </div>
  );
}

export default function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const profileId = parseInt(unwrappedParams.id, 10);

  if (isNaN(profileId)) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-center p-6 text-white">
        <h3 className="text-lg font-bold">Invalid Profile Route</h3>
      </div>
    );
  }

  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <svg className="animate-spin h-10 w-10 text-purple-500" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    }>
      <ProfilePageContent id={profileId} />
    </Suspense>
  );
}
