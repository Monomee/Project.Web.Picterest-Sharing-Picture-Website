'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { useAuth } from '@/hooks/useAuth';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || 'your-google-client-id';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://localhost:7287/api';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  // Mode: 'login' | 'register'
  const [mode, setMode] = useState<'login' | 'register'>('login');

  // Input fields
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [usernameOrEmail, setUsernameOrEmail] = useState('');

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Field validation errors
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validate = () => {
    const newErrors: { [key: string]: string } = {};

    if (mode === 'login') {
      if (!usernameOrEmail.trim()) {
        newErrors.usernameOrEmail = 'Username or Email is required.';
      }
      if (!password) {
        newErrors.password = 'Password is required.';
      }
    } else {
      if (!username.trim()) {
        newErrors.username = 'Username is required.';
      } else if (username.length < 3) {
        newErrors.username = 'Username must be at least 3 characters.';
      }

      if (!email.trim()) {
        newErrors.email = 'Email is required.';
      } else if (!/\S+@\S+\.\S+/.test(email)) {
        newErrors.email = 'Invalid email address.';
      }

      if (!password) {
        newErrors.password = 'Password is required.';
      } else if (password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleTraditionalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!validate()) return;

    setIsLoading(true);
    const endpoint = mode === 'login' ? `${API_URL}/auth/login` : `${API_URL}/auth/register`;
    const payload = mode === 'login'
      ? { usernameOrEmail, password }
      : { username, email, password };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Authentication failed. Please check your credentials.');
      }

      setSuccessMessage(mode === 'login' ? 'Login successful!' : 'Registration successful!');
      
      // Store token globally via AuthContext
      login(data.token);

      // Delay redirect slightly for visual confirmation
      setTimeout(() => {
        router.push('/');
      }, 1000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idToken: credentialResponse.credential }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Google Authentication failed.');
      }

      setSuccessMessage('Successfully signed in with Google!');
      login(data.token);

      setTimeout(() => {
        router.push('/');
      }, 1000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Google sign-in failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleError = () => {
    setErrorMessage('Google Authentication failed. Please try again.');
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-slate-950 px-4 py-12">
      {/* Sleek background gradient glowing blobs */}
      <div className="absolute top-[-10%] left-[-10%] h-125 w-125 rounded-full bg-purple-900/30 blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] h-125 w-125 rounded-full bg-pink-900/20 blur-[120px]" />
      <div className="absolute top-[30%] right-[20%] h-100 w-100 rounded-full bg-indigo-900/30 blur-[100px]" />

      {/* Main card with glassmorphism */}
      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl transition-all duration-500 hover:border-white/15">
        <div className="flex flex-col items-center mb-8">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br from-purple-500 to-pink-500 shadow-lg shadow-purple-500/30">
            {/* Camera Logo SVG */}
            <svg
              className="h-6 w-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>
          <h2 className="bg-linear-to-r from-purple-200 to-pink-200 bg-clip-text text-3xl font-extrabold text-transparent">
            Picterest
          </h2>
          <p className="mt-2 text-sm text-gray-400">
            {mode === 'login' ? 'Welcome back! Please sign in' : 'Create an account to get started'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="mb-6 flex rounded-lg bg-white/5 p-1 border border-white/5">
          <button
            onClick={() => {
              setMode('login');
              setErrorMessage(null);
              setSuccessMessage(null);
              setErrors({});
            }}
            className={`w-1/2 rounded-md py-2 text-sm font-semibold transition-all duration-300 ${
              mode === 'login'
                ? 'bg-linear-to-r from-purple-500 to-pink-500 text-white shadow-md'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => {
              setMode('register');
              setErrorMessage(null);
              setSuccessMessage(null);
              setErrors({});
            }}
            className={`w-1/2 rounded-md py-2 text-sm font-semibold transition-all duration-300 ${
              mode === 'register'
                ? 'bg-linear-to-r from-purple-500 to-pink-500 text-white shadow-md'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            Register
          </button>
        </div>

        {/* Success & Error Alert Panels */}
        {errorMessage && (
          <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-sm text-red-400 flex items-center gap-2 animate-fadeIn">
            <svg className="h-5 w-5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 rounded-lg bg-green-500/10 border border-green-500/30 p-3 text-sm text-green-400 flex items-center gap-2 animate-fadeIn">
            <svg className="h-5 w-5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>{successMessage}</span>
          </div>
        )}

        {/* Traditional Credentials Form */}
        <form onSubmit={handleTraditionalSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                Username
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </span>
                <input
                  type="text"
                  placeholder="johndoe"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className={`w-full rounded-lg border bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white placeholder-gray-500 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-purple-500/50 ${
                    errors.username ? 'border-red-500/50 focus:ring-red-500/30' : 'border-white/10 hover:border-white/20'
                  }`}
                />
              </div>
              {errors.username && <p className="mt-1 text-xs text-red-400">{errors.username}</p>}
            </div>
          )}

          {mode === 'register' ? (
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </span>
                <input
                  type="email"
                  placeholder="john@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full rounded-lg border bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white placeholder-gray-500 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-purple-500/50 ${
                    errors.email ? 'border-red-500/50 focus:ring-red-500/30' : 'border-white/10 hover:border-white/20'
                  }`}
                />
              </div>
              {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email}</p>}
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                Username or Email
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </span>
                <input
                  type="text"
                  placeholder="username or email"
                  value={usernameOrEmail}
                  onChange={(e) => setUsernameOrEmail(e.target.value)}
                  className={`w-full rounded-lg border bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white placeholder-gray-500 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-purple-500/50 ${
                    errors.usernameOrEmail ? 'border-red-500/50 focus:ring-red-500/30' : 'border-white/10 hover:border-white/20'
                  }`}
                />
              </div>
              {errors.usernameOrEmail && <p className="mt-1 text-xs text-red-400">{errors.usernameOrEmail}</p>}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </span>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full rounded-lg border bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white placeholder-gray-500 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-purple-500/50 ${
                  errors.password ? 'border-red-500/50 focus:ring-red-500/30' : 'border-white/10 hover:border-white/20'
                }`}
              />
            </div>
            {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password}</p>}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-lg bg-linear-to-r from-purple-500 to-pink-500 py-3 text-sm font-semibold text-white shadow-lg transition-transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:hover:translate-y-0 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : mode === 'login' ? (
              'Sign In'
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-[#0f1122] px-2 text-gray-500">Or continue with</span>
          </div>
        </div>

        {/* Google OAuth Provider & Custom Trigger */}
        <div className="flex justify-center w-full">
          <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              theme="filled_blue"
              shape="pill"
              text="signin_with"
              width="100%"
            />
          </GoogleOAuthProvider>
        </div>
      </div>
    </div>
  );
}
