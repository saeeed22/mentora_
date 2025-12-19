import { bookings } from './bookings';
import { auth } from './auth';
import { mentors } from './mentors';
import { users } from './users';

interface SessionInfo {
    appId: string;
    channel: string;
    token: string;
    uid: number;
    booking: {
        id: string;
        datetime: string;
        durationMin: number;
        topic: string;
        status: string;
    };
    user: {
        id: string;
        name: string;
        role: 'mentor' | 'mentee';
        avatar?: string;
    };
    participant: {
        id: string;
        name: string;
        role: 'mentor' | 'mentee';
        avatar?: string;
    };
}

// Mock Agora credentials (will be replaced with real backend response)
const MOCK_AGORA_APP_ID = 'mock-agora-app-id';

function generateMockToken(): string {
    // In production, this comes from backend
    return 'mock-token-' + Math.random().toString(36).slice(2, 10);
}

function generateUid(): number {
    return Math.floor(Math.random() * 100000);
}

export const sessions = {
    /**
     * Get session info for a booking
     * In production: GET /sessions/:bookingId
     */
    async getSessionInfo(bookingId: string): Promise<SessionInfo | null> {
        const currentUser = auth.getCurrentUser();
        if (!currentUser) return null;

        const booking = bookings.getById(bookingId);
        if (!booking) return null;

        // Check if user is a participant
        const isParticipant =
            currentUser.id === booking.mentorId || currentUser.id === booking.menteeId;
        if (!isParticipant) return null;

        const isMentor = currentUser.id === booking.mentorId;
        const participantId = isMentor ? booking.menteeId : booking.mentorId;

        // Get participant info from backend
        let participantInfo: { name: string; avatar?: string; role: 'mentor' | 'mentee' };
        if (isMentor) {
            // Get mentee info from users API
            const menteeResult = await users.getUserById(participantId);
            participantInfo = {
                name: menteeResult.success && menteeResult.data ? menteeResult.data.email.split('@')[0] : 'Mentee',
                avatar: undefined,
                role: 'mentee',
            };
        } else {
            // Get mentor info
            participantInfo = {
                name: 'Mentor',
                avatar: undefined,
                role: 'mentor',
            };
        }

        return {
            appId: MOCK_AGORA_APP_ID,
            channel: `mentora-${bookingId}`,
            token: generateMockToken(),
            uid: generateUid(),
            booking: {
                id: booking.id,
                datetime: booking.datetime,
                durationMin: booking.durationMin,
                topic: booking.topic,
                status: booking.status,
            },
            user: {
                id: currentUser.id,
                name: currentUser.name,
                role: currentUser.role === 'admin' ? 'mentor' : currentUser.role,
                avatar: currentUser.avatar,
            },
            participant: {
                id: participantId,
                name: participantInfo.name,
                role: participantInfo.role,
                avatar: participantInfo.avatar,
            },
        };
    },
};

export type { SessionInfo };
