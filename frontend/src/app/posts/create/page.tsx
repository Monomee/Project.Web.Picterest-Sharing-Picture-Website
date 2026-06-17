'use client';

import React, { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { createPost } from '@/services/post.service';
import Navbar from '@/components/pinterest/Navbar';

export default function CreatePostPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  // Form states
  const [caption, setCaption] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [tagsInput, setTagsInput] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // UI status states
  const [isDragActive, setIsDragActive] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Route protection - Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  // Clean up object URL to avoid memory leaks
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Handle local file selection
  const handleFileChange = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setValidationError('Please select a valid image file (PNG, JPG, WEBP).');
      return;
    }
    setValidationError(null);
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileChange(e.target.files[0]);
    }
  };

  // Drag and Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setValidationError(null);

    // Frontend validation
    if (!selectedFile) {
      setValidationError('An image file is required to upload.');
      return;
    }
    if (!caption.trim()) {
      setValidationError('A caption is required.');
      return;
    }

    setIsSubmitting(true);

    // Parse tags to list
    const parsedTags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    try {
      // Coordinate direct image upload
      const result = await createPost(caption, selectedFile, isPrivate, parsedTags);
      setSuccessMessage('Pin successfully created!');
      
      // Clear form
      setCaption('');
      setTagsInput('');
      setSelectedFile(null);
      setPreviewUrl(null);

      // Redirect to home feed after success
      setTimeout(() => {
        router.push('/');
      }, 1500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create post. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state fallback while checking auth
  if (authLoading || (!isAuthenticated && !authLoading)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <svg className="animate-spin h-10 w-10 text-purple-500" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col relative overflow-hidden">
      {/* Sleek background gradient glowing blobs */}
      <div className="absolute top-[-10%] left-[-10%] h-[500px] w-[500px] rounded-full bg-purple-900/15 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] h-[500px] w-[500px] rounded-full bg-pink-900/10 blur-[120px] pointer-events-none" />

      <Suspense fallback={<div className="h-[73px] bg-slate-950/80 border-b border-white/10" />}>
        <Navbar />
      </Suspense>

      <main className="flex-1 flex items-center justify-center px-4 py-12 z-10">
        {/* Main glassmorphism creation container */}
        <div className="relative w-full max-w-4xl rounded-2xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl">
        
        {/* Header toolbar */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-8">
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.back()}
              className="flex items-center justify-center h-8 w-8 rounded-full bg-white/5 hover:bg-white/10 text-gray-300 transition"
              title="Go back"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <h2 className="text-xl font-bold bg-gradient-to-r from-purple-200 to-pink-200 bg-clip-text text-transparent">
              Create a new Pin
            </h2>
          </div>
          
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-2 text-sm font-semibold text-white shadow-lg transition-transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:hover:translate-y-0 flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Uploading...</span>
              </>
            ) : (
              'Save'
            )}
          </button>
        </div>

        {/* Success & Error Alert Panels */}
        {errorMessage && (
          <div className="mb-6 rounded-lg bg-red-500/10 border border-red-500/30 p-4 text-sm text-red-400 flex items-center gap-2 animate-fadeIn">
            <svg className="h-5 w-5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-6 rounded-lg bg-green-500/10 border border-green-500/30 p-4 text-sm text-green-400 flex items-center gap-2 animate-fadeIn">
            <svg className="h-5 w-5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>{successMessage}</span>
          </div>
        )}

        {validationError && (
          <div className="mb-6 rounded-lg bg-amber-500/10 border border-amber-500/30 p-4 text-sm text-amber-400 flex items-center gap-2 animate-fadeIn">
            <svg className="h-5 w-5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span>{validationError}</span>
          </div>
        )}

        {/* Layout Split: Left drag/drop, Right text inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Left Column: Drag & Drop Container / Preview */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !previewUrl && fileInputRef.current?.click()}
            className={`relative flex min-h-[380px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition duration-300 ${
              previewUrl ? 'border-white/10 p-0 overflow-hidden' : ''
            } ${
              isDragActive ? 'border-purple-500 bg-purple-500/5' : 'border-white/20 hover:border-white/30 bg-white/5'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleInputChange}
              accept="image/*"
              className="hidden"
            />

            {previewUrl ? (
              <div className="relative group w-full h-full min-h-[380px] flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl}
                  alt="Post preview"
                  className="w-full h-full max-h-[450px] object-contain"
                />
                
                {/* Overlay controls */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-300">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveImage();
                    }}
                    className="rounded-full bg-red-600 p-3 text-white hover:bg-red-700 shadow-lg transition"
                    title="Remove Image"
                  >
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center space-y-3 p-4">
                <div className="rounded-full bg-white/5 p-4 text-gray-300">
                  <svg className="h-10 w-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="text-gray-300">
                  <span className="font-semibold text-purple-400">Click to upload</span> or drag and drop
                </div>
                <p className="text-xs text-gray-500">
                  Recommendation: High-quality JPG, PNG, or WEBP less than 10MB
                </p>
              </div>
            )}
          </div>

          {/* Right Column: User details & Form Inputs */}
          <div className="flex flex-col justify-between">
            <div className="space-y-6">
              
              {/* User Avatar Summary */}
              {user && (
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 font-bold text-sm">
                    {user.username.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">{user.username}</h4>
                    <p className="text-xs text-gray-500">Creator Account</p>
                  </div>
                </div>
              )}

              {/* Caption Textarea */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Add a description / caption
                </label>
                <textarea
                  placeholder="Tell everyone what your Pin is about..."
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  rows={6}
                  className="w-full rounded-lg border border-white/10 bg-white/5 p-4 text-sm text-white placeholder-gray-500 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-purple-500/50 hover:border-white/20 resize-none"
                />
              </div>

              {/* Tags Input */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. nature, photography, landscape"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-white/5 p-4 text-sm text-white placeholder-gray-500 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-purple-500/50 hover:border-white/20"
                />
              </div>

              {/* Private Pin Toggle */}
              <div className="rounded-lg bg-white/5 border border-white/10 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="text-xs font-semibold text-gray-300">Private Pin</h5>
                    <p className="text-xxs text-gray-500">
                      When enabled, this pin will be hidden from the explore feed.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsPrivate(!isPrivate)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      isPrivate ? 'bg-purple-600' : 'bg-white/10'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        isPrivate ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

            </div>

            {/* Bottom info footer */}
            <p className="mt-8 text-xs text-gray-600">
              By uploading, you agree to the community terms and service requirements of the Sharing Picture Platform.
            </p>
          </div>

        </div>

      </div>
      </main>
    </div>
  );
}
