/**
 * Messaging API
 * Handles conversations and messages between users
 */

import { apiClient, parseApiError, ApiResult } from '../api-client';

// Types
export interface MessageResponse {
    id: string;
    conversation_id: string;
    sender_id: string;
    content: string;
    attachments: string[];
    is_read: boolean;
    created_at: string;
}

export interface ConversationResponse {
    id: string;
    created_at: string;
    updated_at?: string | null;
    unread_count: number;
    last_message?: MessageResponse | null;
    participants: Array<{
        id: string;
        email: string;
        full_name: string;
        avatar_url?: string;
    }>;
}

export interface PaginatedConversations {
    data: ConversationResponse[];
    page: number;
    limit: number;
    total: number;
    hasNext: boolean;
}

export interface PaginatedMessages {
    data: MessageResponse[];
    page: number;
    limit: number;
    total: number;
    hasNext: boolean;
}

export const messagingApi = {
    /**
     * Get user's conversations with last message and unread count
     */
    async getConversations(
        page = 1,
        limit = 20
    ): Promise<ApiResult<PaginatedConversations>> {
        try {
            const response = await apiClient.get<PaginatedConversations>(
                `/v1/conversations?page=${page}&limit=${limit}`
            );
            return { success: true, data: response.data };
        } catch (error) {
            const apiError = parseApiError(error);
            return { success: false, error: apiError.message };
        }
    },

    /**
     * Start a new conversation with another user
     */
    async createConversation(
        participantIds: [string, string]
    ): Promise<ApiResult<ConversationResponse>> {
        try {
            const response = await apiClient.post<ConversationResponse>(
                '/v1/conversations',
                { participant_ids: participantIds }
            );
            return { success: true, data: response.data };
        } catch (error) {
            const apiError = parseApiError(error);
            return { success: false, error: apiError.message };
        }
    },

    /**
     * Get conversation details
     */
    async getConversationById(
        conversationId: string
    ): Promise<ApiResult<ConversationResponse>> {
        try {
            const response = await apiClient.get<ConversationResponse>(
                `/v1/conversations/${conversationId}`
            );
            return { success: true, data: response.data };
        } catch (error) {
            const apiError = parseApiError(error);
            return { success: false, error: apiError.message };
        }
    },

    /**
     * Get messages in a conversation (paginated, newest first)
     */
    async getMessages(
        conversationId: string,
        page = 1,
        limit = 50
    ): Promise<ApiResult<PaginatedMessages>> {
        try {
            const response = await apiClient.get<PaginatedMessages>(
                `/v1/conversations/${conversationId}/messages?page=${page}&limit=${limit}`
            );
            return { success: true, data: response.data };
        } catch (error) {
            const apiError = parseApiError(error);
            return { success: false, error: apiError.message };
        }
    },

    /**
     * Send a message in a conversation
     */
    async sendMessage(
        conversationId: string,
        content: string
    ): Promise<ApiResult<MessageResponse>> {
        try {
            const response = await apiClient.post<MessageResponse>(
                `/v1/conversations/${conversationId}/messages`,
                { conversation_id: conversationId, content }
            );
            return { success: true, data: response.data };
        } catch (error) {
            const apiError = parseApiError(error);
            return { success: false, error: apiError.message };
        }
    },

    /**
     * Mark messages as read up to a specific message
     */
    async markAsRead(
        conversationId: string,
        messageId: string
    ): Promise<ApiResult<void>> {
        try {
            await apiClient.patch(`/v1/conversations/${conversationId}/read`, {
                conversation_id: conversationId,
                message_id: messageId,
            });
            return { success: true };
        } catch (error) {
            const apiError = parseApiError(error);
            return { success: false, error: apiError.message };
        }
    },
};
