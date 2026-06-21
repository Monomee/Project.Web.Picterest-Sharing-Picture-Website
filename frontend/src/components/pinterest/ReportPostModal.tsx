'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { reportPost } from '@/services/post.service';

interface ReportPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  postId: number;
}

const COMMON_REASONS = [
  'Spam or misleading content',
  'Inappropriate or sensitive media',
  'Harassment, bullying, or hate speech',
  'Intellectual property infringement',
  'Other (please specify below)'
];

export default function ReportPostModal({ isOpen, onClose, postId }: ReportPostModalProps) {
  const queryClient = useQueryClient();
  const [selectedReason, setSelectedReason] = useState(COMMON_REASONS[0]);
  const [customReason, setCustomReason] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Toast notification state: null | { type: 'success' | 'error'; message: string }
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
        if (toast.type === 'success') {
          onClose();
        }
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast, onClose]);

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

  const reportMutation = useMutation({
    mutationFn: (reasonText: string) => reportPost(postId, reasonText),
    onSuccess: (data) => {
      setToast({
        type: 'success',
        message: data.message || 'Report submitted successfully!'
      });
      // Invalidate queries to refresh feeds if the post gets hidden
      queryClient.invalidateQueries({ queryKey: ['posts-feed'] });
      queryClient.invalidateQueries({ queryKey: ['post-detail', postId] });
    },
    onError: (error: any) => {
      setToast({
        type: 'error',
        message: error.message || 'Failed to submit report. Please try again.'
      });
    }
  });

  if (!mounted || !isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (reportMutation.isPending) return;

    let finalReason = selectedReason;
    if (selectedReason.includes('Other')) {
      const trimmedCustom = customReason.trim();
      if (!trimmedCustom) {
        setToast({ type: 'error', message: 'Please specify your reason.' });
        return;
      }
      finalReason = trimmedCustom;
    }

    reportMutation.mutate(finalReason);
  };

  const isCustomSelected = selectedReason.includes('Other');

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fadeIn">
      {/* Background click to dismiss */}
      <div className="absolute inset-0 cursor-default" onClick={onClose} />

      {/* Toast Overlay */}
      {toast && (
        <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-50 animate-slideDown">
          <div className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl backdrop-blur-xl border shadow-xl text-sm font-semibold transition-all ${
            toast.type === 'success'
              ? 'bg-green-500/10 border-green-500/30 text-green-400'
              : 'bg-red-500/10 border-red-500/30 text-red-400'
          }`}>
            {toast.type === 'success' ? (
              <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Modal Card */}
      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-slate-900/90 backdrop-blur-2xl p-6 shadow-2xl z-10 animate-scaleUp">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition"
          aria-label="Close modal"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h3 className="text-lg font-bold bg-gradient-to-r from-purple-200 to-pink-200 bg-clip-text text-transparent mb-1 flex items-center gap-2">
          <svg className="h-5 w-5 text-red-500 fill-current" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z" clipRule="evenodd" />
          </svg>
          Report Pin Infraction
        </h3>
        <p className="text-xs text-gray-400 mb-5 leading-normal">
          Help us keep the feed safe. If you believe this post violates community standards (e.g. spam, harassment, inappropriate content), select a reason below to alert the moderators.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xxs font-semibold text-gray-400 uppercase tracking-wider">
              Choose Reason
            </label>
            <div className="relative">
              <select
                value={selectedReason}
                onChange={(e) => setSelectedReason(e.target.value)}
                className="w-full bg-slate-950/60 border border-white/10 hover:border-white/20 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 outline-none rounded-xl px-4 py-2.5 text-xs text-white transition duration-200 appearance-none cursor-pointer"
              >
                {COMMON_REASONS.map((reason) => (
                  <option key={reason} value={reason} className="bg-slate-950 text-white">
                    {reason}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {isCustomSelected && (
            <div className="space-y-1.5 animate-fadeIn">
              <label className="block text-xxs font-semibold text-gray-400 uppercase tracking-wider">
                Specify Custom Reason
              </label>
              <textarea
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Describe the issue in detail..."
                rows={3}
                required
                className="w-full bg-slate-950/60 border border-white/10 hover:border-white/20 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 outline-none rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-600 transition duration-200 resize-none"
              />
            </div>
          )}

          <div className="flex justify-end gap-3 pt-3 border-t border-white/5">
            <button
              type="button"
              onClick={onClose}
              disabled={reportMutation.isPending}
              className="px-4 py-2 rounded-xl text-xs font-semibold border border-white/10 text-gray-400 hover:text-white transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={reportMutation.isPending}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md hover:opacity-90 active:scale-95 transition disabled:opacity-50 disabled:pointer-events-none"
            >
              {reportMutation.isPending ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
