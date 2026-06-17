'use client';

import React, { useState, useRef, useEffect } from 'react';
import { updateProfile } from '@/services/post.service';
import { useAuth } from '@/hooks/useAuth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://localhost:7287/api';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUsername: string;
  currentAvatarUrl?: string;
  onUpdateSuccess: () => void;
}

export default function EditProfileModal({
  isOpen,
  onClose,
  currentUsername,
  currentAvatarUrl,
  onUpdateSuccess,
}: EditProfileModalProps) {
  const { updateUserMetadata } = useAuth();
  const [displayName, setDisplayName] = useState(currentUsername);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentAvatarUrl || null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setDisplayName(currentUsername);
      setAvatarFile(null);
      setPreviewUrl(currentAvatarUrl || null);
      setErrorMsg(null);
    }
  }, [isOpen, currentUsername, currentAvatarUrl]);

  // Cleanup object URL
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl !== currentAvatarUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl, currentAvatarUrl]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.type.startsWith('image/')) {
        setErrorMsg('Please select a valid image file.');
        return;
      }
      setAvatarFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setErrorMsg(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const trimmedName = displayName.trim();
    if (!trimmedName) {
      setErrorMsg('Display name cannot be empty.');
      return;
    }
    if (trimmedName.length < 3) {
      setErrorMsg('Display name must be at least 3 characters.');
      return;
    }

    setIsSubmitting(true);

    try {
      let avatarUrl: string | undefined = undefined;

      // Coordinate signed image upload if user selected a new file
      if (avatarFile) {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Authentication required.');

        // Step 1: Request Cloudinary signature from backend
        const sigResponse = await fetch(`${API_URL}/media/signature`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!sigResponse.ok) {
          throw new Error('Failed to retrieve secure upload signature.');
        }

        const sigData = await sigResponse.json();

        // Step 2: Upload directly to Cloudinary
        const formData = new FormData();
        formData.append('file', avatarFile);
        formData.append('signature', sigData.signature);
        formData.append('timestamp', sigData.timestamp.toString());
        formData.append('api_key', sigData.apiKey);
        formData.append('upload_preset', sigData.uploadPreset);
        formData.append('folder', sigData.folder);

        const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${sigData.cloudName}/image/upload`;
        const uploadResponse = await fetch(cloudinaryUrl, {
          method: 'POST',
          body: formData,
        });

        if (!uploadResponse.ok) {
          throw new Error('Failed to upload avatar to Cloudinary.');
        }

        const uploadData = await uploadResponse.json();
        avatarUrl = uploadData.secure_url;
      }

      // Save changes on backend
      const res = await updateProfile(trimmedName, avatarUrl);
      
      // Update local storage and context state immediately
      updateUserMetadata(res.username || trimmedName, res.avatarUrl || avatarUrl || currentAvatarUrl || '');

      onUpdateSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update profile.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
      {/* Background click to dismiss */}
      <div className="absolute inset-0 cursor-default" onClick={onClose} />

      {/* Modal Card */}
      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-slate-900/90 backdrop-blur-2xl p-6 shadow-2xl z-10 animate-scaleUp">
        
        <h3 className="text-lg font-bold bg-gradient-to-r from-purple-200 to-pink-200 bg-clip-text text-transparent mb-4">
          Edit Profile Settings
        </h3>

        {errorMsg && (
          <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-400">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Avatar Upload */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              {previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewUrl}
                  alt="Avatar preview"
                  className="h-20 w-20 rounded-full object-cover border-2 border-purple-500/40 group-hover:opacity-75 transition"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-purple-900/20 border border-purple-500/30 text-2xl font-bold text-purple-300 group-hover:bg-purple-900/40 transition">
                  {displayName.substring(0, 2).toUpperCase()}
                </div>
              )}
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition">
                <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                </svg>
              </div>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-xxs font-bold text-purple-400 hover:text-purple-300 transition"
            >
              Change profile photo
            </button>
          </div>

          {/* Display Name Input */}
          <div className="space-y-1.5">
            <label className="block text-xxs font-semibold text-gray-400 uppercase tracking-wider">
              Username / Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your display name..."
              className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 outline-none rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-500 transition duration-200"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2 border-t border-white/5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-semibold border border-white/10 text-gray-400 hover:text-white transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md hover:opacity-90 active:scale-95 transition disabled:opacity-50 disabled:pointer-events-none"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
