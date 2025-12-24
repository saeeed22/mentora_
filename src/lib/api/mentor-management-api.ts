/**
 * Mentor Management API
 * Handles mentor profile updates, availability templates, and exceptions
 */

import { apiClient, parseApiError, ApiResult } from '../api-client';

// Types for availability templates
export interface AvailabilityTemplate {
    id: string;
    mentor_id: string;
    weekday: number; // 0 = Monday, 6 = Sunday
    start_time: string; // "09:00"
    end_time: string; // "17:00"
    slot_duration_minutes: number;
    // Optional: this slot allows group sessions
    is_group?: boolean;
}

export interface AvailabilityTemplateCreate {
    weekday: number;
    start_time: string;
    end_time: string;
    slot_duration_minutes?: number;
    is_group?: boolean;
}

// Types for availability exceptions (vacation/busy days)
export interface AvailabilityException {
    id: string;
    mentor_id: string;
    date: string; // "2025-01-15"
    start_time?: string | null;
    end_time?: string | null;
    note?: string | null;
}

export interface AvailabilityExceptionCreate {
    date: string;
    start_time?: string | null;
    end_time?: string | null;
    note?: string | null;
}

// Types for mentor profile update
export interface MentorProfileUpdate {
    headline?: string | null;
    experience_years?: number;
    skills?: string[];
    price_per_session_solo?: number | null;
    price_per_session_group?: number | null;
    visible?: boolean;
    // Group session settings (optional)
    group_enabled?: boolean;
    group_max_participants?: number;
    group_price_per_session?: number;
}

export interface MentorProfileResponse {
    headline: string | null;
    experience_years: number;
    skills: string[];
    price_per_session_solo: number | null;
    price_per_session_group: number | null;
    visible: boolean;
    user_id: string;
    rating_avg: number;
    rating_count: number;
    // Group settings echoed back when supported
    group_enabled?: boolean;
    group_max_participants?: number;
    group_price_per_session?: number;
}

export const mentorManagementApi = {
    /**
     * Update mentor profile (headline, skills, price, visibility)
     */
    async updateMentorProfile(
        data: MentorProfileUpdate
    ): Promise<ApiResult<MentorProfileResponse>> {
        try {
            const response = await apiClient.patch<MentorProfileResponse>(
                '/v1/mentors/me',
                data
            );
            return { success: true, data: response.data };
        } catch (error) {
            const apiError = parseApiError(error);
            return { success: false, error: apiError.message };
        }
    },

    /**
     * Get current mentor's availability templates
     */
    async getAvailabilityTemplates(): Promise<ApiResult<AvailabilityTemplate[]>> {
        try {
            const response = await apiClient.get<AvailabilityTemplate[]>(
                '/v1/mentors/me/availability/templates'
            );
            return { success: true, data: response.data };
        } catch (error) {
            const apiError = parseApiError(error);
            return { success: false, error: apiError.message };
        }
    },

    /**
     * Create a new availability template (recurring schedule)
     */
    async createAvailabilityTemplate(
        data: AvailabilityTemplateCreate
    ): Promise<ApiResult<AvailabilityTemplate>> {
        try {
            const response = await apiClient.post<AvailabilityTemplate>(
                '/v1/mentors/me/availability/templates',
                data
            );
            return { success: true, data: response.data };
        } catch (error) {
            const apiError = parseApiError(error);
            return { success: false, error: apiError.message };
        }
    },

    /**
     * Update an availability template
     */
    async updateAvailabilityTemplate(
        templateId: string,
        data: AvailabilityTemplateCreate
    ): Promise<ApiResult<AvailabilityTemplate>> {
        try {
            const response = await apiClient.put<AvailabilityTemplate>(
                `/v1/mentors/me/availability/templates/${templateId}`,
                data
            );
            return { success: true, data: response.data };
        } catch (error) {
            const apiError = parseApiError(error);
            return { success: false, error: apiError.message };
        }
    },

    /**
     * Delete an availability template
     */
    async deleteAvailabilityTemplate(
        templateId: string
    ): Promise<ApiResult<void>> {
        try {
            await apiClient.delete(`/v1/mentors/me/availability/templates/${templateId}`);
            return { success: true };
        } catch (error) {
            const apiError = parseApiError(error);
            return { success: false, error: apiError.message };
        }
    },

    /**
     * Create an availability exception (vacation/busy day)
     */
    async createAvailabilityException(
        data: AvailabilityExceptionCreate
    ): Promise<ApiResult<AvailabilityException>> {
        try {
            const response = await apiClient.post<AvailabilityException>(
                '/v1/mentors/me/availability/exceptions',
                data
            );
            return { success: true, data: response.data };
        } catch (error) {
            const apiError = parseApiError(error);
            return { success: false, error: apiError.message };
        }
    },

    /**
     * Delete an availability exception
     */
    async deleteAvailabilityException(
        exceptionId: string
    ): Promise<ApiResult<void>> {
        try {
            await apiClient.delete(`/v1/mentors/me/availability/exceptions/${exceptionId}`);
            return { success: true };
        } catch (error) {
            const apiError = parseApiError(error);
            return { success: false, error: apiError.message };
        }
    },
};
