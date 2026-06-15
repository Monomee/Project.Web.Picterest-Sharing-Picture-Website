'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

// Decoded JWT token interface matching ASP.NET claims
interface DecodedToken {
  nameid?: string;
  unique_name?: string;
  userId?: string;
  username?: string;
  role?: string | string[];
  [key: string]: any;
}

export interface AuthUser {
  id: string;
  username: string;
  roles: string[];
}

interface AuthContextType {
  token: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string) => void;
  logout: () => void;
}

// Client-side helper functions for cookie management
function getCookie(name: string): string | null {
  if (typeof window === 'undefined') return null;
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
}

function setCookie(name: string, value: string, days: number = 7) {
  if (typeof window === 'undefined') return;
  let expires = "";
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    expires = "; expires=" + date.toUTCString();
  }
  document.cookie = `${name}=${value || ""}${expires}; path=/; SameSite=Lax; Secure`;
}

function eraseCookie(name: string) {
  if (typeof window === 'undefined') return;
  document.cookie = `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax; Secure`;
}

// Safely decode JWT token client-side without heavy external dependencies
function decodeJwt(token: string): DecodedToken | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error('Error decoding JWT token:', e);
    return null;
  }
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initial token load from LocalStorage or Cookies
    const savedToken = localStorage.getItem('token') || getCookie('token');
    if (savedToken) {
      const decoded = decodeJwt(savedToken);
      if (decoded) {
        const rawRole = decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] || decoded.role || [];
        const roles = Array.isArray(rawRole) ? rawRole : [rawRole].filter(Boolean);

        setUser({
          id: decoded.userId || decoded.nameid || '',
          username: decoded.username || decoded.unique_name || '',
          roles: roles
        });
        setToken(savedToken);
      } else {
        // Clear corrupt token
        localStorage.removeItem('token');
        eraseCookie('token');
      }
    }
    setIsLoading(false);
  }, []);

  const login = (newToken: string) => {
    const decoded = decodeJwt(newToken);
    if (decoded) {
      const rawRole = decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] || decoded.role || [];
      const roles = Array.isArray(rawRole) ? rawRole : [rawRole].filter(Boolean);

      const authUser: AuthUser = {
        id: decoded.userId || decoded.nameid || '',
        username: decoded.username || decoded.unique_name || '',
        roles: roles
      };

      setUser(authUser);
      setToken(newToken);
      localStorage.setItem('token', newToken);
      setCookie('token', newToken, 7);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    eraseCookie('token');
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ token, user, isAuthenticated, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
