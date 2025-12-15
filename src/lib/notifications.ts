/**
 * Notifications Service
 * Manages notifications using localStorage since there's no backend endpoint.
 * Notifications are generated from new messages.
 */

export interface Notification {
    id: string;
    title: string;
    description: string;
    time: string;
    read: boolean;
    type: 'message' | 'booking' | 'reminder' | 'system';
    createdAt: string;
    link?: string;
}

const NOTIFICATIONS_KEY = 'mentora_notifications';
const MAX_NOTIFICATIONS = 50;

/**
 * Get all notifications from localStorage
 */
export function getNotifications(): Notification[] {
    if (typeof window === 'undefined') return [];

    try {
        const stored = localStorage.getItem(NOTIFICATIONS_KEY);
        if (!stored) return [];
        return JSON.parse(stored);
    } catch {
        return [];
    }
}

/**
 * Save notifications to localStorage
 */
function saveNotifications(notifications: Notification[]): void {
    if (typeof window === 'undefined') return;

    // Keep only the latest MAX_NOTIFICATIONS
    const trimmed = notifications.slice(0, MAX_NOTIFICATIONS);
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(trimmed));
}

/**
 * Add a new notification
 */
export function addNotification(notification: Omit<Notification, 'id' | 'read' | 'createdAt' | 'time'>): void {
    const notifications = getNotifications();

    const newNotification: Notification = {
        ...notification,
        id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        read: false,
        createdAt: new Date().toISOString(),
        time: 'Just now',
    };

    // Add to the beginning
    notifications.unshift(newNotification);
    saveNotifications(notifications);
}

/**
 * Mark a notification as read
 */
export function markAsRead(notificationId: string): void {
    const notifications = getNotifications();
    const updated = notifications.map(n =>
        n.id === notificationId ? { ...n, read: true } : n
    );
    saveNotifications(updated);
}

/**
 * Mark all notifications as read
 */
export function markAllAsRead(): void {
    const notifications = getNotifications();
    const updated = notifications.map(n => ({ ...n, read: true }));
    saveNotifications(updated);
}

/**
 * Get unread count
 */
export function getUnreadCount(): number {
    return getNotifications().filter(n => !n.read).length;
}

/**
 * Clear all notifications
 */
export function clearAllNotifications(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(NOTIFICATIONS_KEY);
}

/**
 * Format relative time for display
 */
export function formatRelativeTime(isoString: string): string {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

    return date.toLocaleDateString();
}

/**
 * Add a message notification
 */
export function addMessageNotification(senderName: string, messagePreview: string, conversationId?: string): void {
    addNotification({
        title: `New message from ${senderName}`,
        description: messagePreview.length > 50 ? messagePreview.substring(0, 50) + '...' : messagePreview,
        type: 'message',
        link: conversationId ? `/messages?c=${conversationId}` : '/messages',
    });
}

/**
 * Add a booking notification
 */
export function addBookingNotification(title: string, description: string): void {
    addNotification({
        title,
        description,
        type: 'booking',
        link: '/bookings',
    });
}
