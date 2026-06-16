'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPendingReports, resolveReport } from '@/services/admin.service';

export default function AdminReportsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [activeDropdownId, setActiveDropdownId] = useState<number | null>(null);

  // Fetch pending reports
  const { data: reports = [], isLoading, isError, error } = useQuery({
    queryKey: ['admin-reports', page],
    queryFn: () => getPendingReports(page, 10),
  });

  // Action mutation to resolve reports
  const resolveMutation = useMutation({
    mutationFn: ({ reportId, action }: { reportId: number; action: 'DELETE_POST' | 'BAN_USER' | 'DISMISS' }) =>
      resolveReport(reportId, { 
        action, 
        remarks: `Resolved via Admin Moderation Panel. Action: ${action}` 
      }),
    onSuccess: () => {
      // Instantly invalidate queries to remove resolved report from feed list
      queryClient.invalidateQueries({ queryKey: ['admin-reports'] });
    },
  });

  const handleAction = (reportId: number, action: 'DELETE_POST' | 'BAN_USER' | 'DISMISS') => {
    setActiveDropdownId(null);
    resolveMutation.mutate({ reportId, action });
  };

  // Close dropdown helper
  React.useEffect(() => {
    const handleOutsideClick = () => {
      setActiveDropdownId(null);
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  return (
    <div className="space-y-6">
      
      {/* Title section */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-purple-200 to-pink-200 bg-clip-text text-transparent">
            Moderation Queue
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Review reported pictures and enforce community standards.
          </p>
        </div>
      </div>

      {/* Error Banner */}
      {isError && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-4 text-sm text-red-400 flex items-center gap-2">
          <svg className="h-5 w-5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span>{(error as Error)?.message || 'Failed to fetch pending reports queue.'}</span>
        </div>
      )}

      {/* Loading Skeletons */}
      {isLoading ? (
        <div className="rounded-xl border border-white/10 bg-white/5 p-6 space-y-4 animate-pulse">
          <div className="h-6 bg-white/10 rounded w-1/4 mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 h-12 bg-white/5 rounded px-4" />
            ))}
          </div>
        </div>
      ) : reports.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-white/5 p-12 text-center space-y-3">
          <div className="text-gray-500">
            <svg className="h-12 w-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold">Inbox completely clear!</h3>
          <p className="text-sm text-gray-500">No pending reports are waiting for review.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                <th className="p-4">Post Media</th>
                <th className="p-4">Caption Info</th>
                <th className="p-4">Reporter</th>
                <th className="p-4">Infraction Reason</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm">
              {reports.map((report) => (
                <tr key={report.id} className="hover:bg-white/5 transition duration-200">
                  
                  {/* Reported Image Thumbnail */}
                  <td className="p-4">
                    {report.postImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={report.postImageUrl}
                        alt="Reported content"
                        className="h-12 w-16 object-cover rounded border border-white/10"
                      />
                    ) : (
                      <div className="h-12 w-16 bg-slate-800 rounded border border-white/10 flex items-center justify-center text-xs text-gray-500 font-semibold uppercase">
                        Deleted
                      </div>
                    )}
                  </td>

                  {/* Caption Info */}
                  <td className="p-4 font-medium max-w-[200px] truncate">
                    {report.postCaption || <span className="text-gray-500 italic">No description</span>}
                  </td>

                  {/* Reporter Username */}
                  <td className="p-4 text-purple-300 font-semibold">
                    @{report.reporterUsername}
                  </td>

                  {/* Infraction Reason */}
                  <td className="p-4 text-gray-300">
                    {report.reason}
                  </td>

                  {/* Actions Dropdown Button */}
                  <td className="p-4 text-right relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveDropdownId(activeDropdownId === report.id ? null : report.id);
                      }}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/5 text-gray-400 hover:text-white transition"
                    >
                      <span>Action</span>
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {/* Dropdown Menu options */}
                    {activeDropdownId === report.id && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="absolute right-4 mt-2 w-48 rounded-lg shadow-xl bg-slate-900 border border-white/10 z-50 py-1.5 overflow-hidden animate-fadeIn"
                      >
                        <button
                          onClick={() => handleAction(report.id, 'DELETE_POST')}
                          className="flex items-center gap-2 w-full text-left px-4 py-2 text-xs font-semibold text-amber-400 hover:bg-amber-500/10 transition"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Delete Post
                        </button>
                        <button
                          onClick={() => handleAction(report.id, 'BAN_USER')}
                          className="flex items-center gap-2 w-full text-left px-4 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/10 transition"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                          </svg>
                          Ban User
                        </button>
                        
                        <div className="border-t border-white/5 my-1" />
                        
                        <button
                          onClick={() => handleAction(report.id, 'DISMISS')}
                          className="flex items-center gap-2 w-full text-left px-4 py-2 text-xs font-semibold text-gray-400 hover:text-white hover:bg-white/5 transition"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                          Dismiss Report
                        </button>
                      </div>
                    )}
                  </td>

                </tr>
              ))}
            </tbody>
          </table>

          {/* Simple Pagination Footer controls */}
          <div className="border-t border-white/10 bg-white/5 px-6 py-4 flex justify-between items-center text-xs text-gray-500 font-semibold uppercase">
            <div>Page {page}</div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/5 disabled:opacity-30 disabled:hover:bg-transparent transition"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={reports.length < 10}
                className="px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/5 disabled:opacity-30 disabled:hover:bg-transparent transition"
              >
                Next
              </button>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
