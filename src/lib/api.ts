// API configuration and utilities

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public data?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// In-flight refresh promise — shared so concurrent 401s only trigger one refresh
let refreshPromise: Promise<string> | null = null;

async function getRefreshedToken(): Promise<string> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) throw new ApiError('No refresh token', 401);

    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!response.ok) throw new ApiError('Token refresh failed', response.status);

    const data = await response.json();
    const newToken = data.access_token ?? data.data?.access_token;
    const newRefresh = data.refresh_token ?? data.data?.refresh_token;

    if (!newToken) throw new ApiError('No access token in refresh response', 401);

    localStorage.setItem('access_token', newToken);
    if (newRefresh) localStorage.setItem('refresh_token', newRefresh);

    // Sync into auth store without triggering a full re-login
    if (typeof window !== 'undefined') {
      try {
        const { useAuthStore } = await import('@/stores/authStore');
        const state = useAuthStore.getState();
        if (state.tokens) {
          state.setTokens({
            ...state.tokens,
            access_token: newToken,
            ...(newRefresh ? { refresh_token: newRefresh } : {}),
          });
        }
      } catch { /* store not available server-side */ }
    }

    return newToken;
  })().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  _retry = false
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token');
    if (token) {
      defaultHeaders.Authorization = `Bearer ${token}`;
    }
  }

  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);

    // On 401, attempt one token refresh then retry
    if (response.status === 401 && !_retry && typeof window !== 'undefined') {
      try {
        await getRefreshedToken();
        return apiRequest<T>(endpoint, options, true);
      } catch {
        // Refresh failed — logout and surface the original 401
        const { useAuthStore } = await import('@/stores/authStore');
        useAuthStore.getState().logout();
        throw new ApiError('Session expired. Please log in again.', 401);
      }
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new ApiError(
        errorData?.detail || `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        errorData
      );
    }

    // Handle no-content responses
    if (response.status === 204 || response.headers.get('content-length') === '0') {
      return {} as T;
    }

    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(`Network error: ${(error as Error).message}`);
  }
}

export const api = {
  get: <T>(endpoint: string) => apiRequest<T>(endpoint, { method: 'GET' }),
  post: <T>(endpoint: string, data?: any) =>
    apiRequest<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),
  put: <T>(endpoint: string, data?: any) =>
    apiRequest<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }),
  delete: <T>(endpoint: string) => apiRequest<T>(endpoint, { method: 'DELETE' }),
};
