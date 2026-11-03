import axios, { AxiosError } from 'axios';

// Use environment variable for API URL, fallback to relative /api for development
const API_URL = import.meta.env.VITE_API_URL || '/api';

// Real JWT auth: credentials are sent automatically in httpOnly cookies
const http = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Send cookies automatically
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

