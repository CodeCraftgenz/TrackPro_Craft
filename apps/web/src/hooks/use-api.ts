'use client';

import { useCallback } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const STORAGE_KEY = 'trackpro_auth';

interface StoredAuth {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

function getStoredAuth(): StoredAuth | null {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

export function useApi() {
  const request = useCallback(
    async <T>(
      endpoint: string,
      options: RequestInit = {},
    ): Promise<T> => {
      const auth = getStoredAuth();

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...options.headers,
      };

      if (auth) {
        (headers as Record<string, string>)['Authorization'] = `Bearer ${auth.accessToken}`;
      }

      const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));

        // Handle expired/invalid token - redirect to login
        if (response.status === 401) {
          localStorage.removeItem(STORAGE_KEY);
          if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
            window.location.href = '/login';
          }
        }

        throw new Error(error.message || `Request failed: ${response.status}`);
      }

      if (response.status === 204) {
        return {} as T;
      }

      return response.json();
    },
    [],
  );

  const get = useCallback(
    <T>(endpoint: string) => request<T>(endpoint, { method: 'GET' }),
    [request],
  );

  const post = useCallback(
    <T>(endpoint: string, data?: unknown) =>
      request<T>(endpoint, {
        method: 'POST',
        body: data ? JSON.stringify(data) : undefined,
      }),
    [request],
  );

  const put = useCallback(
    <T>(endpoint: string, data?: unknown) =>
      request<T>(endpoint, {
        method: 'PUT',
        body: data ? JSON.stringify(data) : undefined,
      }),
    [request],
  );

  const del = useCallback(
    <T>(endpoint: string, data?: unknown) =>
      request<T>(endpoint, {
        method: 'DELETE',
        body: data ? JSON.stringify(data) : undefined,
      }),
    [request],
  );

  return { request, get, post, put, del };
}
