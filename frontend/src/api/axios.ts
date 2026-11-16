import axios, { AxiosError } from 'axios';
import type { FieldError, FieldErrors, NormalizedError, User } from '../types';

declare module 'axios' {
  interface AxiosRequestConfig {
    /** Skip global 401/403/network handling (used by health check, /auth/me, logout). */
    skipGlobalHandler?: boolean;
  }
}

export const TOKEN_KEY = 'aibt_token';
export const USER_KEY = 'aibt_user';

/** VITE_API_URL from .env, falls back to "/api" (proxied by Vite in dev). */
export const API_BASE_URL = (import.meta.env.VITE_API_URL || '').trim().replace(/\/$/, '') || '/api';

// ---------- localStorage token handling (safe in private mode) ----------
export const tokenStorage = {
  get(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set(token: string): void {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      /* storage unavailable */
    }
  },
  getUser(): User | null {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? (JSON.parse(raw) as User) : null;
    } catch {
      return null;
    }
  },
  setUser(user: User): void {
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch {
      /* storage unavailable */
    }
  },
  clear(): void {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } catch {
      /* storage unavailable */
    }
  },
};

const FALLBACK_MESSAGES: Record<number, string> = {
  400: 'Невалидна заявка. Провери данните и опитай отново.',
  401: 'Сесията ти изтече. Моля, влез отново.',
  403: 'Нямаш права за това действие.',
  404: 'Не намерихме това, което търсиш.',
  409: 'Възникна конфликт с вече съществуващи данни.',
  413: 'Изпратените данни са твърде големи.',
  429: 'Твърде много заявки. Изчакай малко и опитай отново.',
  500: 'Сървърът срещна проблем. Опитай отново след малко.',
  502: 'Сървърът временно не отговаря. Опитай отново след малко.',
  503: 'Сървърът временно не е наличен. Опитай отново след малко.',
  504: 'Сървърът отговаря твърде бавно. Опитай отново.',
};

interface ServerErrorBody {
  message?: unknown;
  errors?: unknown;
}

/**
 * Turns any error into { status, message, errors }. The server message (res.data.message) always wins.
 */
export const normalizeError = (error: unknown): NormalizedError => {
  if (axios.isCancel(error)) {
    return { status: 0, message: 'Заявката беше прекъсната.', errors: [], canceled: true };
  }

  const axiosError = error as AxiosError<ServerErrorBody>;
  if (axiosError?.response) {
    const { status, data } = axiosError.response;
    const serverMessage = data && typeof data === 'object' && typeof data.message === 'string' ? data.message : null;
    return {
      status,
      message: serverMessage || FALLBACK_MESSAGES[status] || `Неочаквана грешка (код ${status}). Опитай отново.`,
      errors: Array.isArray(data?.errors) ? (data.errors as FieldError[]) : [],
    };
  }

  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return { status: 0, message: 'Нямаш интернет връзка. Провери мрежата си и опитай отново.', errors: [], offline: true };
  }

  if (axiosError?.code === 'ECONNABORTED' || axiosError?.code === 'ETIMEDOUT') {
    return { status: 0, message: 'Сървърът отговаря твърде бавно. Опитай отново след малко.', errors: [], network: true };
  }

  return {
    status: 0,
    message: 'Не успяхме да се свържем със сървъра. Провери дали работи и опитай отново.',
    errors: [],
    network: true,
  };
};

/** Converts server errors array into { field: message } for inputs. */
export const getFieldErrors = (errors: FieldError[] = []): FieldErrors =>
  errors.reduce<FieldErrors>((acc, item) => {
    if (item?.field && item?.message && !acc[item.field]) acc[item.field] = item.message;
    return acc;
  }, {});

type ErrorWithFeedback = { feedback?: NormalizedError };

/** Shortcut to get the normalized feedback from any thrown error. */
export const getErrorFeedback = (error: unknown): NormalizedError =>
  (error as ErrorWithFeedback)?.feedback || normalizeError(error);

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 20000,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
});

// ---------- Request: attach token ----------
api.interceptors.request.use((config) => {
  const token = tokenStorage.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const AUTH_ENDPOINTS = ['/auth/login', '/auth/register'];

// ---------- Response: normalize + global handling ----------
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError & ErrorWithFeedback) => {
    const feedback = normalizeError(error);
    error.feedback = feedback;

    const url = error.config?.url || '';
    const skip = error.config?.skipGlobalHandler;

    if (!skip) {
      if (feedback.status === 401 && !AUTH_ENDPOINTS.some((endpoint) => url.includes(endpoint))) {
        tokenStorage.clear();
        window.dispatchEvent(new CustomEvent('auth:logout', { detail: { message: feedback.message, redirect: true } }));
      } else if (feedback.status === 403) {
        window.dispatchEvent(new CustomEvent('api:forbidden', { detail: feedback }));
      } else if (feedback.network || feedback.offline) {
        window.dispatchEvent(new CustomEvent('api:network-error', { detail: feedback }));
      }
    }

    return Promise.reject(error);
  }
);

export default api;
