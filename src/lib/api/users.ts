import { apiClient, parseApiError } from '../api-client';
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

            const response = await apiClient.post<{ avatar_url: string }>(
                '/v1/users/me/avatar',
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                }
            );
            return { success: true, data: response.data };
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
