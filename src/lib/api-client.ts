import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

// Backend API base URL
export const API_BASE_URL = 'https://mentora-backend-production-d4c3.up.railway.app';

// Token storage keys
const ACCESS_TOKEN_KEY = 'mentora_access_token';
const REFRESH_TOKEN_KEY = 'mentora_refresh_token';

// Create axios instance
export const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 30000, // 30 second timeout
});

// Token management
export const tokenManager = {
    getAccessToken: (): string | null => {
        if (typeof window === 'undefined') return null;
        return localStorage.getItem(ACCESS_TOKEN_KEY);
    },

    setAccessToken: (token: string): void => {
        if (typeof window === 'undefined') return;
        localStorage.setItem(ACCESS_TOKEN_KEY, token);
    },

    clearTokens: (): void => {
        if (typeof window === 'undefined') return;
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        // Also clear stored user data to prevent stale auth state
        localStorage.removeItem('mentora_current_user');
    },

    isAuthenticated: (): boolean => {
        return !!tokenManager.getAccessToken();
    },
};

// Request interceptor - add auth header
apiClient.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const token = tokenManager.getAccessToken();
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor - handle 401 and token refresh
let isRefreshing = false;
let failedQueue: Array<{
    resolve: (value?: unknown) => void;
    reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

apiClient.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        // If 401 and not already retrying
        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                // Queue this request until refresh completes
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then((token) => {
                        if (originalRequest.headers) {
                            originalRequest.headers.Authorization = `Bearer ${token}`;
                        }
                        return apiClient(originalRequest);
                    })
                    .catch((err) => Promise.reject(err));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                // Try to refresh the token
                const response = await axios.post(
                    `${API_BASE_URL}/v1/auth/refresh`,
                    {}
                );

                const { access_token } = response.data;
                tokenManager.setAccessToken(access_token);
                processQueue(null, access_token);

                if (originalRequest.headers) {
                    originalRequest.headers.Authorization = `Bearer ${access_token}`;
                }
                return apiClient(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError as Error, null);
                tokenManager.clearTokens();

                // Redirect to login if on client
                if (typeof window !== 'undefined') {
                    window.location.href = '/login';
                }
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

// Generic API result type
export type ApiResult<T = void> =
    | { success: true; data?: T }
    | { success: false; error: string };

// API error helper
export interface ApiError {
    message: string;
    code?: string;
    details?: Record<string, unknown>;
}

export function parseApiError(error: unknown): ApiError {
    if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<{ detail?: string | Array<{ msg: string }> }>;
        const detail = axiosError.response?.data?.detail;

        if (typeof detail === 'string') {
            return { message: detail };
        }
        if (Array.isArray(detail) && detail.length > 0) {
            return { message: detail[0].msg };
        }
        return { message: axiosError.message || 'An error occurred' };
    }
    return { message: 'An unexpected error occurred' };
}
