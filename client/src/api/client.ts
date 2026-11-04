import axios, { AxiosError } from 'axios';
import { Capacitor } from '@capacitor/core';

// Use environment variable for API URL, fallback to relative /api for development
const API_URL = import.meta.env.VITE_API_URL || '/api';

/**
 * Web: credentials travel in the httpOnly cookie.
 * Native app (Capacitor): the page origin (https://localhost) is cross-site to the API,
 * so cookies are unreliable. The JWT is kept in storage and sent as a Bearer header instead.
 */
const TOKEN_KEY = 'geoattend:token';
const isNative = () => Capacitor.isNativePlatform();

export const getNativeToken = (): string | null => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

export const setNativeToken = (token: string) => {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    /* ignore */
  }
};

export const clearNativeToken = () => {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
};

const http = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Send cookies automatically (web)
});

http.interceptors.request.use((config) => {
  if (isNative()) {
    const token = getNativeToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Ask the server to include the token in the login response
    if (config.url?.endsWith('/auth/login')) {
      config.params = { ...(config.params ?? {}), native: '1' };
    }
  }
  return config;
});

http.interceptors.response.use((res) => {
  if (isNative() && res.config.url?.endsWith('/auth/login')) {
    const token = res.data?.data?.token as string | undefined;
    if (token) setNativeToken(token);
  }
  return res;
});

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string, public details?: unknown) {
    super(message);
  }
}

type Method = 'get' | 'post' | 'patch' | 'put' | 'delete';

/** Calls the API, unwraps { ok, data } and turns every failure into an ApiError with the server's code. */
export async function api<T>(method: Method, url: string, opts: { data?: unknown; params?: unknown } = {}): Promise<T> {
  try {
    const res = await http.request({ method, url, data: opts.data, params: opts.params });
    return (res.data && typeof res.data === 'object' && 'data' in res.data ? res.data.data : res.data) as T;
  } catch (e) {
    const err = e as AxiosError<{ error?: { code: string; message: string; details?: unknown } }>;
    const body = err.response?.data?.error;
    throw new ApiError(
      err.response?.status ?? 0,
      body?.code ?? 'NETWORK',
      body?.message ?? 'Cannot reach the server. Is it running on port 5000?',
      body?.details,
    );
  }
}