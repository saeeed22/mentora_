import { apiClient, parseApiError } from '../api-client';
import type {
    MentorDetailResponse,
    MentorAvailabilityResponse,
    MentorStats,
    FeedbackCreateRequest,
    PaginatedResponse,
} from '../types';

interface MentorSearchParams {
    page?: number;
    limit?: number;
    sort?: 'rating' | 'experience' | 'price';
    skills?: string[];
    min_exp?: number;
    rating_min?: number;
    languages?: string[];
}

interface ApiResult<T = void> {
    success: boolean;
    data?: T;
    error?: string;
}

export const mentorsApi = {
    /**
     * Search and filter mentors with pagination
     * GET /v1/mentors
     */
    async searchMentors(params: MentorSearchParams = {}): Promise<ApiResult<PaginatedResponse<MentorDetailResponse>>> {
        try {
            const queryParams = new URLSearchParams();

            if (params.page) queryParams.append('page', params.page.toString());
            if (params.limit) queryParams.append('limit', params.limit.toString());
            if (params.sort) queryParams.append('sort', params.sort);
            if (params.skills?.length) queryParams.append('skills', params.skills.join(','));
            if (params.min_exp) queryParams.append('min_exp', params.min_exp.toString());
            if (params.rating_min) queryParams.append('rating_min', params.rating_min.toString());
            if (params.languages?.length) queryParams.append('languages', params.languages.join(','));

            const url = `/v1/mentors${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
            const response = await apiClient.get<PaginatedResponse<MentorDetailResponse>>(url);

            return { success: true, data: response.data };
        } catch (error) {
            const apiError = parseApiError(error);
            return { success: false, error: apiError.message };
        }
    },

    /**
     * Get detailed mentor profile
     * GET /v1/mentors/{mentor_id}
     */
    async getMentorById(mentorId: string): Promise<ApiResult<MentorDetailResponse>> {
        try {
            const response = await apiClient.get<MentorDetailResponse>(`/v1/mentors/${mentorId}`);
            return { success: true, data: response.data };
        } catch (error) {
            const apiError = parseApiError(error);
            return { success: false, error: apiError.message };
        }
    },

    /**
     * Get mentor's available time slots
     * GET /v1/mentors/{mentor_id}/availability
     */
    async getMentorAvailability(
        mentorId: string,
        fromDate: string,
        toDate: string
    ): Promise<ApiResult<MentorAvailabilityResponse>> {
        try {
            const response = await apiClient.get<MentorAvailabilityResponse>(
                `/v1/mentors/${mentorId}/availability`,
                {
                    params: {
                        from_date: fromDate,
                        to_date: toDate,
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
     * Get mentor statistics
     * GET /v1/mentors/{mentor_id}/stats
     */
    async getMentorStats(mentorId: string): Promise<ApiResult<MentorStats>> {
        try {
            const response = await apiClient.get<MentorStats>(`/v1/mentors/${mentorId}/stats`);
            return { success: true, data: response.data };
        } catch (error) {
            const apiError = parseApiError(error);
            return { success: false, error: apiError.message };
        }
    },

    /**
     * Submit feedback for a mentor after a completed session
     * POST /v1/mentors/{mentor_id}/feedback
     */
    async submitFeedback(
        mentorId: string,
        feedback: FeedbackCreateRequest
    ): Promise<ApiResult> {
        try {
            await apiClient.post(`/v1/mentors/${mentorId}/feedback`, feedback);
            return { success: true };
        } catch (error) {
            const apiError = parseApiError(error);
            return { success: false, error: apiError.message };
        }
    },
};

export type { MentorSearchParams };
