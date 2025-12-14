import { apiClient, tokenManager, parseApiError, type ApiError } from '../api-client';
import type {
  SignupRequest,
  LoginRequest,
  TokenResponse,
  VerifyEmailRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  BackendUser,
  BackendProfile,
  UserRole,
} from '../types';

// Combined user info (user + profile from backend)
export interface CurrentUser {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  avatar?: string;
  bio?: string;
  is_verified: boolean;
}

// User storage key
const CURRENT_USER_KEY = 'mentora_current_user';

// Helper to store/retrieve current user
function storeCurrentUser(user: CurrentUser): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
}

function getStoredUser(): CurrentUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(CURRENT_USER_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

function clearStoredUser(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(CURRENT_USER_KEY);
}

// Auth result types
interface AuthResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

export const auth = {
  /**
   * Sign up a new user
   * POST /v1/auth/signup
   */
  async signup(data: SignupRequest): Promise<AuthResult<{ email: string }>> {
    try {
      await apiClient.post('/v1/auth/signup', data);
      return { success: true, data: { email: data.email } };
    } catch (error) {
      const apiError = parseApiError(error);
      return { success: false, error: apiError.message };
    }
  },

  /**
   * Verify email with OTP
   * POST /v1/auth/verify-email
   */
  async verifyEmail(data: VerifyEmailRequest): Promise<AuthResult> {
    try {
      await apiClient.post('/v1/auth/verify-email', data);
      return { success: true };
    } catch (error) {
      const apiError = parseApiError(error);
      return { success: false, error: apiError.message };
    }
  },

  /**
   * Login user
   * POST /v1/auth/login
   */
  async login(data: LoginRequest): Promise<AuthResult<CurrentUser>> {
    try {
      // Get token
      console.log('[Auth] Calling /v1/auth/login...');
      const tokenResponse = await apiClient.post<TokenResponse>('/v1/auth/login', data);
      console.log('[Auth] Login response:', tokenResponse.data);
      tokenManager.setAccessToken(tokenResponse.data.access_token);

      // Fetch user profile
      console.log('[Auth] Calling /v1/users/me...');
      const userResponse = await apiClient.get<{
        user: BackendUser;
        profile: BackendProfile;
      }>('/v1/users/me');
      console.log('[Auth] User response:', userResponse.data);

      const { user, profile } = userResponse.data;

      const currentUser: CurrentUser = {
        id: user.id,
        email: user.email,
        role: user.role,
        name: profile.full_name,
        avatar: profile.avatar_url,
        bio: profile.bio,
        is_verified: user.is_verified,
      };

      storeCurrentUser(currentUser);

      return { success: true, data: currentUser };
    } catch (error) {
      console.error('[Auth] Login error:', error);
      const apiError = parseApiError(error);
      return { success: false, error: apiError.message };
    }
  },

  /**
   * Logout user
   * POST /v1/auth/logout
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post('/v1/auth/logout');
    } catch {
      // Ignore errors, still clear local state
    } finally {
      tokenManager.clearTokens();
      clearStoredUser();
    }
  },

  /**
   * Request password reset OTP
   * POST /v1/auth/forgot-password
   */
  async forgotPassword(data: ForgotPasswordRequest): Promise<AuthResult> {
    try {
      await apiClient.post('/v1/auth/forgot-password', data);
      return { success: true };
    } catch (error) {
      const apiError = parseApiError(error);
      return { success: false, error: apiError.message };
    }
  },

  /**
   * Reset password with OTP
   * POST /v1/auth/reset-password
   */
  async resetPassword(data: ResetPasswordRequest): Promise<AuthResult> {
    try {
      await apiClient.post('/v1/auth/reset-password', data);
      return { success: true };
    } catch (error) {
      const apiError = parseApiError(error);
      return { success: false, error: apiError.message };
    }
  },

  /**
   * Refresh current user data from server
   * GET /v1/users/me
   */
  async refreshCurrentUser(): Promise<AuthResult<CurrentUser>> {
    try {
      const response = await apiClient.get<{
        user: BackendUser;
        profile: BackendProfile;
      }>('/v1/users/me');

      const { user, profile } = response.data;

      const currentUser: CurrentUser = {
        id: user.id,
        email: user.email,
        role: user.role,
        name: profile.full_name,
        avatar: profile.avatar_url,
        bio: profile.bio,
        is_verified: user.is_verified,
      };

      storeCurrentUser(currentUser);

      return { success: true, data: currentUser };
    } catch (error) {
      const apiError = parseApiError(error);
      return { success: false, error: apiError.message };
    }
  },

  /**
   * Get current user from local storage (sync)
   */
  getCurrentUser(): CurrentUser | null {
    return getStoredUser();
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return tokenManager.isAuthenticated() && !!getStoredUser();
  },
};

export type { AuthResult };
