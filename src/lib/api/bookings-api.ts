/**
 * Bookings API
 * Handles booking creation, listing, status updates, and video sessions
 */

import { apiClient, parseApiError, ApiResult, tokenManager } from '../api-client';

// Booking status enum
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'expired' | 'rescheduled';

// Types
export interface BookingCreate {
    mentor_id: string;
    start_at: string; // ISO datetime
    duration_minutes: number;
    notes?: string | null;
}

export interface BookingResponse {
    id: string;
    mentor_id: string;
    mentee_id: string;
    start_at: string;
    end_at: string;
    duration_minutes: number;
    notes?: string | null;
    status: BookingStatus;
    created_at: string;
    updated_at?: string | null;
    // Payment information
    is_paid: boolean;
    price: string; // Price as string (e.g., "800.00")
    booking_code?: string;
    participant_emails?: string[];
}

export interface BookingWithDetails extends BookingResponse {
    mentor?: {
        id: string;
        full_name: string;
        avatar_url?: string;
    };
    mentee?: {
        id: string;
        full_name: string;
        avatar_url?: string;
    };
    // Additional fields populated by frontend
    mentorName?: string;
    menteeName?: string;
    mentorAvatar?: string;
    menteeAvatar?: string;
}

// Pending booking with mentee details (from backend)
export interface PendingBookingResponse {
    id: string;
    mentor_id: string;
    mentee_id: string;
    mentee_name: string;
    mentee_avatar?: string;
    start_at: string;
    end_at: string;
    duration_minutes: number;
    status: 'pending';
    notes?: string | null;
    created_at: string;
}

export interface PaginatedPendingBookings {
    data: PendingBookingResponse[];
    page: number;
    limit: number;
    total: number;
    hasNext: boolean;
}

export interface VideoTokenResponse {
    provider: string;
    app_id: string;
    room_id: string;
    rtc_token: string;
    uid: number;
    expires_at: string;
}

export interface PaginatedBookings {
    data: BookingResponse[];
    page: number;
    limit: number;
    total: number;
    hasNext: boolean;
}

export interface GetBookingsParams {
    page?: number;
    limit?: number;
    status?: BookingStatus;
    as_role?: 'mentor' | 'mentee';
}

export const bookingsApi = {
    /**
     * Create a new booking with a mentor
     */
    async createBooking(data: BookingCreate): Promise<ApiResult<BookingResponse>> {
        try {
            // Debug: Log full request details for CORS debugging
            const token = tokenManager.getAccessToken();
            const baseURL = apiClient.defaults.baseURL;
            console.log('[Booking] === FULL REQUEST DEBUG ===');
            console.log('[Booking] URL:', `${baseURL}/v1/bookings`);
            console.log('[Booking] Method: POST');
            console.log('[Booking] Token present:', !!token);
            console.log('[Booking] Token (first 20 chars):', token ? token.substring(0, 20) + '...' : 'MISSING');
            console.log('[Booking] Headers:', {
                'Content-Type': 'application/json',
                'Authorization': token ? `Bearer ${token.substring(0, 20)}...` : 'MISSING',
            });
            console.log('[Booking] Body:', JSON.stringify(data, null, 2));
            console.log('[Booking] ========================');

            const response = await apiClient.post<BookingResponse>('/v1/bookings', data);
            return { success: true, data: response.data };
        } catch (error) {
            const apiError = parseApiError(error);
            console.error('[Booking] Error details:', error);
            return { success: false, error: apiError.message };
        }
    },

    /**
     * Get current user's bookings (as mentor or mentee)
     */
    async getMyBookings(params: GetBookingsParams = {}): Promise<ApiResult<PaginatedBookings>> {
        try {
            const queryParams = new URLSearchParams();
            if (params.page) queryParams.append('page', params.page.toString());
            if (params.limit) queryParams.append('limit', params.limit.toString());
            if (params.status) queryParams.append('status', params.status);
            if (params.as_role) queryParams.append('as_role', params.as_role);

            const url = `/v1/bookings/me${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
            const response = await apiClient.get<PaginatedBookings>(url);
            return { success: true, data: response.data };
        } catch (error) {
            const apiError = parseApiError(error);
            return { success: false, error: apiError.message };
        }
    },

    /**
     * Get booking details by ID
     */
    async getBookingById(bookingId: string): Promise<ApiResult<BookingResponse>> {
        try {
            const response = await apiClient.get<BookingResponse>(`/v1/bookings/${bookingId}`);
            return { success: true, data: response.data };
        } catch (error) {
            const apiError = parseApiError(error);
            return { success: false, error: apiError.message };
        }
    },

    /**
     * Update booking status (confirm, cancel, complete)
     */
    async updateBookingStatus(
        bookingId: string,
        status: BookingStatus
    ): Promise<ApiResult<BookingResponse>> {
        try {
            const response = await apiClient.patch<BookingResponse>(
                `/v1/bookings/${bookingId}/status`,
                { status }
            );
            return { success: true, data: response.data };
        } catch (error) {
            const apiError = parseApiError(error);
            return { success: false, error: apiError.message };
        }
    },

    /**
     * Cancel a booking
     */
    async cancelBooking(bookingId: string): Promise<ApiResult<void>> {
        try {
            await apiClient.delete(`/v1/bookings/${bookingId}`);
            return { success: true };
        } catch (error) {
            const apiError = parseApiError(error);
            return { success: false, error: apiError.message };
        }
    },

    // =====================
    // Video Session Methods
    // =====================

    /**
     * Get Agora video token for a booking session
     */
    async getVideoToken(bookingId: string): Promise<ApiResult<VideoTokenResponse>> {
        try {
            const response = await apiClient.get<VideoTokenResponse>(
                `/v1/bookings/${bookingId}/video-token`
            );
            return { success: true, data: response.data };
        } catch (error) {
            const apiError = parseApiError(error);
            return { success: false, error: apiError.message };
        }
    },

    /**
     * Mark video session as started
     */
    async startVideoSession(bookingId: string): Promise<ApiResult<void>> {
        try {
            await apiClient.post(`/v1/bookings/${bookingId}/video-start`);
            return { success: true };
        } catch (error) {
            const apiError = parseApiError(error);
            return { success: false, error: apiError.message };
        }
    },

    /**
     * Mark video session as ended
     */
    async endVideoSession(bookingId: string): Promise<ApiResult<void>> {
        try {
            await apiClient.post(`/v1/bookings/${bookingId}/video-end`);
            return { success: true };
        } catch (error) {
            const apiError = parseApiError(error);
            return { success: false, error: apiError.message };
        }
    },

    // =====================
    // Feedback Methods
    // =====================

    /**
     * Submit feedback for a completed booking
     */
    async submitFeedback(
        bookingId: string,
        rating: number,
        comment?: string
    ): Promise<ApiResult<void>> {
        try {
            await apiClient.post(`/v1/bookings/${bookingId}/feedback`, {
                rating,
                comment: comment || null,
            });
            return { success: true };
        } catch (error) {
            const apiError = parseApiError(error);
            return { success: false, error: apiError.message };
        }
    },

    /**
     * Get mentor's reviews
     */
    async getMentorReviews(
        mentorId: string,
        page = 1,
        limit = 20
    ): Promise<ApiResult<{
        data: Array<{
            id: string;
            rating: number;
            comment?: string;
            created_at: string;
            mentee_id: string;
        }>;
        page: number;
        limit: number;
        total: number;
        hasNext: boolean;
    }>> {
        try {
            const response = await apiClient.get(
                `/v1/bookings/${mentorId}/reviews?page=${page}&limit=${limit}`
            );
            return { success: true, data: response.data };
        } catch (error) {
            const apiError = parseApiError(error);
            return { success: false, error: apiError.message };
        }
    },

    // =====================
    // Mentor Booking Management
    // =====================

    /**
     * Get pending booking requests for mentor
     * GET /v1/bookings/mentor/pending
     */
    async getPendingBookings(
        page = 1,
        limit = 20
    ): Promise<ApiResult<PaginatedPendingBookings>> {
        try {
            const response = await apiClient.get<PaginatedPendingBookings>(
                `/v1/bookings/mentor/pending?page=${page}&limit=${limit}`
            );
            return { success: true, data: response.data };
        } catch (error) {
            const apiError = parseApiError(error);
            return { success: false, error: apiError.message };
        }
    },

    /**
     * Confirm a pending booking (Mentor only)
     * PATCH /v1/bookings/{booking_id}/confirm
     */
    async confirmBooking(bookingId: string): Promise<ApiResult<BookingResponse>> {
        try {
            const response = await apiClient.patch<BookingResponse>(
                `/v1/bookings/${bookingId}/confirm`,
                {}
            );
            return { success: true, data: response.data };
        } catch (error) {
            const apiError = parseApiError(error);
            return { success: false, error: apiError.message };
        }
    },

    /**
     * Reject a pending booking (Mentor only)
     * PATCH /v1/bookings/{booking_id}/reject
     */
    async rejectBooking(bookingId: string): Promise<ApiResult<BookingResponse>> {
        try {
            const response = await apiClient.patch<BookingResponse>(
                `/v1/bookings/${bookingId}/reject`,
                {}
            );
            return { success: true, data: response.data };
        } catch (error) {
            const apiError = parseApiError(error);
            return { success: false, error: apiError.message };
        }
    },
};
