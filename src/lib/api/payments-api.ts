/**
 * Payments API (Pakistan gateways)
 * Frontend wrapper for initiating hosted payment links and verifying status.
 * Gateways supported: JazzCash, Easypaisa, PayFast PK (via backend integration).
 */

import { apiClient, parseApiError, ApiResult } from '../api-client';
import type { PaymentLinkRequest, PaymentLinkResponse, PaymentStatusResponse } from '../types';

export const paymentsApi = {
  /**
   * Create a hosted payment link for a booking
   * POST /v1/payments/create-link
   */
  async createPaymentLink(data: PaymentLinkRequest): Promise<ApiResult<PaymentLinkResponse>> {
    try {
      const response = await apiClient.post<PaymentLinkResponse>('/v1/payments/create-link', data);
      return { success: true, data: response.data };
    } catch (error) {
      const apiError = parseApiError(error);
      return { success: false, error: apiError.message };
    }
  },

  /**
   * Verify payment status by payment id
   * GET /v1/payments/{payment_id}/status
   */
  async getPaymentStatus(paymentId: string): Promise<ApiResult<PaymentStatusResponse>> {
    try {
      const response = await apiClient.get<PaymentStatusResponse>(`/v1/payments/${paymentId}/status`);
      return { success: true, data: response.data };
    } catch (error) {
      const apiError = parseApiError(error);
      return { success: false, error: apiError.message };
    }
  },

  /**
   * Handle gateway callback on frontend by notifying backend
   * POST /v1/payments/callback
   */
  async notifyCallback(params: Record<string, string>): Promise<ApiResult<{ ok: boolean; booking_id?: string; payment_id?: string; status?: string }>> {
    try {
      const response = await apiClient.post('/v1/payments/callback', params);
      return { success: true, data: response.data };
    } catch (error) {
      const apiError = parseApiError(error);
      return { success: false, error: apiError.message };
    }
  },
};
