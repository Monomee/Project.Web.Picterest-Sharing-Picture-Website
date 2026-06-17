'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { getPost, getComments, addComment, toggleLike, Post, CommentItem } from '@/services/post.service';

export default function PinDetailModal() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useAuth();
  
  const postIdParam = searchParams.get('postId');
  const postId = postIdParam ? parseInt(postIdParam, 10) : null;

  const [commentText, setCommentText] = useState('');
  const [isLikeAnimating, setIsLikeAnimating] = useState(false);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  // Fetch post details
  const { data: post, isLoading: isPostLoading, isError: isPostError } = useQuery({
    queryKey: ['post-detail', postId],
    queryFn: () => getPost(postId!),
    enabled: postId !== null && !isNaN(postId),
  });

  // Fetch comments
  const { data: comments, isLoading: isCommentsLoading } = useQuery({
    queryKey: ['post-comments', postId],
    queryFn: () => getComments(postId!),
    enabled: postId !== null && !isNaN(postId),
  });

  // Toggle Like Mutation with Optimistic Updates
  const likeMutation = useMutation({
    mutationFn: () => toggleLike(postId!),
    onMutate: async () => {
      if (!postId) return;

      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: ['post-detail', postId] });
      await queryClient.cancelQueries({ queryKey: ['posts-feed'] });

      // Snapshot previous caches
      const previousPost = queryClient.getQueryData(['post-detail', postId]);
      const previousFeeds = queryClient.getQueriesData({ queryKey: ['posts-feed'] });

      // Optimistically update post detail
      queryClient.setQueryData(['post-detail', postId], (old: any) => {
        if (!old) return old;
        const nextIsLiked = !old.isLikedByUser;
        return {
          ...old,
          isLikedByUser: nextIsLiked,
          likeCount: nextIsLiked ? old.likeCount + 1 : old.likeCount - 1,
        };
      });

      // Optimistically update main feed posts
      queryClient.setQueriesData({ queryKey: ['posts-feed'] }, (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          pages: oldData.pages.map((page: any) =>
            page.map((p: any) => {
              if (p.id === postId) {
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

      return { previousPost, previousFeeds };
    },
    onError: (err, newLike, context) => {
      // Rollback
      if (postId && context?.previousPost) {
        queryClient.setQueryData(['post-detail', postId], context.previousPost);
      }
      if (context?.previousFeeds) {
        context.previousFeeds.forEach(([queryKey, previousData]) => {
          queryClient.setQueryData(queryKey, previousData);
        });
      }
    },
    onSettled: () => {
      if (postId) {
        queryClient.invalidateQueries({ queryKey: ['post-detail', postId] });
        queryClient.invalidateQueries({ queryKey: ['posts-feed'] });
      }
    },
  });

  // Comment Submission Mutation
  const commentMutation = useMutation({
    mutationFn: (text: string) => addComment(postId!, text),
    onSuccess: () => {
      setCommentText('');
      // Invalidate comments cache to trigger a reload
      queryClient.invalidateQueries({ queryKey: ['post-comments', postId] });
    },
  });

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    if (postId) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [postId]);

  // Scroll to bottom of comments when new comments are added
  useEffect(() => {
    if (comments) {
      commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [comments]);

  const handleClose = () => {
    // Clear postId from URL parameters by pushing back without the postId parameter
    router.push('/', { scroll: false });
  };

  const handleTagClick = (tag: string) => {
    router.push(`/?search=${encodeURIComponent(tag)}`, { scroll: false });
  };

  const handleLikeToggle = () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    setIsLikeAnimating(true);
    likeMutation.mutate();
    setTimeout(() => {
      setIsLikeAnimating(false);
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

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    const cleanText = commentText.trim();
    if (!cleanText || commentMutation.isPending) return;
    commentMutation.mutate(cleanText);
  };

  if (!postId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md transition-opacity duration-300 animate-fadeIn">
      {/* Background click to dismiss */}
      <div className="absolute inset-0 cursor-zoom-out" onClick={handleClose} />

      {/* Main Glassmorphic Modal Card */}
      <div className="relative w-full max-w-5xl h-[85vh] md:h-[75vh] flex flex-col md:flex-row rounded-3xl overflow-hidden bg-slate-900/80 backdrop-blur-2xl border border-white/10 shadow-2xl shadow-purple-500/10 z-10 animate-scaleUp">
        
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-slate-950/60 hover:bg-slate-950/80 border border-white/10 text-white transition-all hover:scale-105 active:scale-95 z-50 shadow-lg"
          aria-label="Close modal"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Left Column: Post Image */}
        <div className="w-full md:w-3/5 h-[40%] md:h-full bg-black/40 flex items-center justify-center relative select-none">
          {isPostLoading ? (
            <div className="flex flex-col items-center justify-center space-y-3">
              <svg className="animate-spin h-8 w-8 text-purple-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span className="text-sm text-gray-400">Loading details...</span>
            </div>
          ) : isPostError || !post ? (
            <div className="text-center p-6 space-y-2">
              <span className="text-red-400 text-sm font-semibold">Could not load image.</span>
            </div>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={post.imageUrl}
              alt={post.caption || 'Pin detail'}
              className="w-full h-full object-contain"
            />
          )}
        </div>

        {/* Right Column: Details & Comments Feed */}
        <div className="w-full md:w-2/5 h-[60%] md:h-full flex flex-col justify-between border-t md:border-t-0 md:border-l border-white/10 bg-slate-950/20 p-6 overflow-hidden">
          
          {/* Main Info Box */}
          <div className="flex-1 flex flex-col min-h-0">
            {isPostLoading ? (
              <div className="animate-pulse space-y-4 py-2 flex-1">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-white/10" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-white/10 rounded w-1/3" />
                    <div className="h-3 bg-white/10 rounded w-1/4" />
                  </div>
                </div>
                <div className="h-16 bg-white/10 rounded w-full" />
                <div className="h-8 bg-white/10 rounded w-1/4" />
                <div className="h-32 bg-white/10 rounded w-full mt-4" />
              </div>
            ) : isPostError || !post ? (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-2 text-gray-400">
                <svg className="h-8 w-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <h3 className="font-semibold text-white">Post details unavailable</h3>
                <p className="text-xs">The post you request might be deleted or made private.</p>
              </div>
            ) : (
              <>
                {/* Author Header */}
                <div className="flex items-center justify-between pb-4 border-b border-white/5">
                  <div 
                    className="flex items-center gap-3 hover:opacity-80 transition cursor-pointer"
                    onClick={() => {
                      handleClose();
                      router.push(`/profile/${post.userId}`);
                    }}
                  >
                    {post.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={post.avatarUrl}
                        alt={post.username}
                        className="h-10 w-10 rounded-full object-cover border border-white/10"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-500/20 border border-purple-500/30 text-sm font-bold text-purple-200">
                        {post.username.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h4 className="font-semibold text-white text-sm">{post.username}</h4>
                      <p className="text-xxs text-gray-400">
                        {new Date(post.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Caption / Description */}
                <div className="py-4 text-sm text-gray-200 leading-relaxed max-h-[120px] overflow-y-auto custom-scrollbar">
                  {post.caption ? (
                    <p>{post.caption}</p>
                  ) : (
                    <p className="text-gray-400 italic">No description provided.</p>
                  )}
                </div>

                {/* Clickable Tag Badges */}
                {post.tags && post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pb-4">
                    {post.tags.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => handleTagClick(tag)}
                        className="text-xxs font-semibold px-2.5 py-1 rounded-full bg-white/5 hover:bg-purple-600/20 border border-white/10 hover:border-purple-500/30 text-gray-300 hover:text-purple-300 transition duration-200"
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>
                )}

                {/* Social Counter & Like/Download Actions */}
                <div className="flex items-center justify-between py-3 px-4 rounded-2xl bg-white/5 border border-white/5 mb-2">
                  <div className="flex items-center gap-2 text-sm text-gray-300 font-semibold">
                    <span>{post.likeCount} {post.likeCount === 1 ? 'like' : 'likes'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleLikeToggle}
                      disabled={likeMutation.isPending}
                      className={`flex h-10 px-4 items-center justify-center gap-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white transition-all duration-300 ${
                        post.isLikedByUser ? 'text-red-500 border-red-500/30 bg-red-500/10' : 'hover:scale-102'
                      } ${isLikeAnimating ? 'scale-110' : ''}`}
                    >
                      <svg
                        className={`h-5 w-5 fill-current transition-transform duration-300 ${
                          post.isLikedByUser ? 'scale-105' : 'fill-none stroke-current'
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
                      <span className="text-xs font-bold">{post.isLikedByUser ? 'Liked' : 'Like'}</span>
                    </button>
                    <button
                      onClick={(e) => handleDownload(e, post.imageUrl, `pin-${post.id}.jpg`)}
                      className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white transition-all duration-300 hover:scale-102"
                      title="Download image"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Comments Section */}
                <div className="flex-1 flex flex-col min-h-0 border-t border-white/5 pt-3">
                  <h5 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                    Comments
                  </h5>

                  <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-1">
                    {isCommentsLoading ? (
                      <div className="flex justify-center py-6">
                        <svg className="animate-spin h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                      </div>
                    ) : !comments || comments.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 text-center text-gray-500">
                        <svg className="h-8 w-8 mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <p className="text-xs">No comments yet</p>
                        <p className="text-xxs">Be the first to share your thoughts!</p>
                      </div>
                    ) : (
                      <div className="space-y-3.5">
                        {comments.map((comment) => (
                          <div key={comment.id} className="flex gap-2.5 items-start text-xs group">
                            {comment.avatarUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={comment.avatarUrl}
                                alt={comment.username}
                                className="h-7 w-7 rounded-full object-cover border border-white/5 mt-0.5"
                              />
                            ) : (
                              <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-purple-900/30 border border-purple-900/40 text-xxs font-bold text-purple-300 mt-0.5">
                                {comment.username.substring(0, 2).toUpperCase()}
                              </div>
                            )}
                            <div className="flex-1 bg-white/5 rounded-2xl px-3 py-2 border border-white/5">
                              <div className="flex justify-between items-center mb-0.5">
                                <span className="font-bold text-white text-xxs">{comment.username}</span>
                                <span className="text-xxs text-gray-400">
                                  {new Date(comment.createdAt).toLocaleDateString(undefined, {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                              </div>
                              <p className="text-gray-200 text-xs leading-normal whitespace-pre-wrap">{comment.content}</p>
                            </div>
                          </div>
                        ))}
                        <div ref={commentsEndRef} />
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Bottom Interactive Block: Input Form */}
          <div className="pt-4 border-t border-white/10 bg-slate-950/20 mt-2">
            {isAuthenticated ? (
              <form onSubmit={handleCommentSubmit} className="flex gap-2 items-center">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder={commentMutation.isPending ? 'Sending comment...' : 'Add a comment...'}
                  disabled={commentMutation.isPending || isPostLoading}
                  className="flex-1 min-w-0 bg-white/5 border border-white/10 hover:border-white/20 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 outline-none rounded-2xl px-4 py-2.5 text-xs text-white placeholder-gray-500 transition duration-200"
                />
                <button
                  type="submit"
                  disabled={!commentText.trim() || commentMutation.isPending || isPostLoading}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90 active:scale-95 disabled:opacity-40 disabled:scale-100 disabled:pointer-events-none transition duration-200 shadow-md shadow-purple-500/10 flex-shrink-0"
                  aria-label="Send comment"
                >
                  <svg className="h-4.5 w-4.5 transform rotate-90 text-white fill-current" viewBox="0 0 24 24">
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                  </svg>
                </button>
              </form>
            ) : (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-purple-900/10 border border-purple-500/20 text-center sm:text-left">
                <div className="space-y-0.5">
                  <p className="text-xs font-semibold text-purple-300">Join the discussion</p>
                  <p className="text-xxs text-gray-400">You must be logged in to like and comment.</p>
                </div>
                <button
                  onClick={() => router.push('/login')}
                  className="w-full sm:w-auto rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 px-3.5 py-1.5 text-xxs font-bold text-white shadow-md transition duration-200 hover:-translate-y-0.5"
                >
                  Sign In
                </button>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
