import { apiClient, parseApiError, tokenManager } from '../api-client';
import type {
    BackendUser,
    BackendProfile,
    ProfileUpdateRequest,
} from '../types';

interface UserProfileResponse {
    user: BackendUser;
    profile: BackendProfile;
}

interface ApiResult<T = void> {
    success: boolean;
    data?: T;
    error?: string;
}

export const users = {
    /**
     * Get current user profile
     * GET /v1/users/me
     */
    async getCurrentProfile(): Promise<ApiResult<UserProfileResponse>> {
        try {
            const response = await apiClient.get<UserProfileResponse>('/v1/users/me');
            return { success: true, data: response.data };
        } catch (error) {
            const apiError = parseApiError(error);
            return { success: false, error: apiError.message };
        }
    },

    /**
     * Get user by ID (public, limited info)
     * GET /v1/users/{user_id}
     */
    async getUserById(userId: string): Promise<ApiResult<BackendUser>> {
        try {
            const response = await apiClient.get<BackendUser>(`/v1/users/${userId}`);
            return { success: true, data: response.data };
        } catch (error) {
            const apiError = parseApiError(error);
            return { success: false, error: apiError.message };
        }
    },

    /**
     * Update current user profile
     * PATCH /v1/users/me
     */
    async updateProfile(data: ProfileUpdateRequest): Promise<ApiResult<BackendProfile>> {
        try {
            const response = await apiClient.patch<BackendProfile>('/v1/users/me', data);
            return { success: true, data: response.data };
        } catch (error) {
            const apiError = parseApiError(error);
            return { success: false, error: apiError.message };
        }
    },

    /**
     * Upload avatar
     * POST /v1/users/me/avatar
     */
    async uploadAvatar(file: File): Promise<ApiResult<{ avatar_url: string }>> {
        try {
            const formData = new FormData();
            formData.append('file', file);

            // Use XMLHttpRequest for better multipart handling
            return new Promise((resolve) => {
                const xhr = new XMLHttpRequest();
                const token = typeof window !== 'undefined'
                    ? tokenManager.getAccessToken()
                    : null;

                xhr.upload.onprogress = (e) => {
                    console.log(`Upload progress: ${e.loaded}/${e.total}`);
                };

                xhr.onload = () => {
                    if (xhr.status === 200 || xhr.status === 201) {
                        try {
                            const response = JSON.parse(xhr.responseText);
                            resolve({ 
                                success: true, 
                                data: response.data || { avatar_url: response.avatar_url } 
                            });
                        } catch {
                            resolve({ success: false, error: 'Invalid response from server' });
                        }
                    } else {
                        try {
                            const response = JSON.parse(xhr.responseText);
                            const detail = response.detail || response.message;
                            if (xhr.status === 401) {
                                resolve({ success: false, error: 'Not authenticated. Please log in again.' });
                            } else if (xhr.status === 403) {
                                resolve({ success: false, error: detail || 'Access denied. Check email verification or permissions.' });
                            } else {
                                resolve({ success: false, error: detail || 'Upload failed' });
                            }
                        } catch {
                            if (xhr.status === 401) {
                                resolve({ success: false, error: 'Not authenticated. Please log in again.' });
                            } else if (xhr.status === 403) {
                                resolve({ success: false, error: 'Access denied. Check email verification or permissions.' });
                            } else {
                                resolve({ success: false, error: `Upload failed with status ${xhr.status}` });
                            }
                        }
                    }
                };

                xhr.onerror = () => {
                    resolve({ success: false, error: 'Network error during upload' });
                };

                const baseUrl = 'https://mentora-backend-production-d4c3.up.railway.app';
                xhr.open('POST', `${baseUrl}/v1/users/me/avatar`);
                if (token) {
                    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
                }
                xhr.send(formData);
            });
        } catch (error) {
            const apiError = parseApiError(error);
            return { success: false, error: apiError.message };
        }
    },

    /**
     * Delete avatar
     * DELETE /v1/users/me/avatar
     */
    async deleteAvatar(): Promise<ApiResult> {
        try {
            await apiClient.delete('/v1/users/me/avatar');
            return { success: true };
        } catch (error) {
            const apiError = parseApiError(error);
            return { success: false, error: apiError.message };
        }
    },
};

export type { UserProfileResponse };
