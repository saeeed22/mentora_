import { auth, CurrentUser } from './auth';
import { User } from '../types';

const STORAGE_KEY = 'currentUser';

type UpdateProfileInput = Partial<Pick<User,
  'name' | 'bio' | 'title' | 'company' | 'location' | 'expertise' | 'avatar'
>> & {
  socialLinks?: { linkedin?: string; twitter?: string; portfolio?: string };
};

// Helper to convert CurrentUser to User-like object
function currentUserToUser(cu: CurrentUser): User | null {
  // Return a minimal User object for backend users
  return {
    id: cu.id,
    email: cu.email,
    name: cu.name,
    role: cu.role as 'mentor' | 'mentee',
    avatar: cu.avatar,
    bio: cu.bio,
  } as User;
}

export const profile = {
  getProfile(userId: string): User | null {
    const current = auth.getCurrentUser();
    if (current && current.id === userId) return currentUserToUser(current);
    // For other users, return null - should use users API to fetch
    return null;
  },

  updateProfile(userId: string, updates: UpdateProfileInput): User | null {
    const current = auth.getCurrentUser();
    let updated: User | null = null;

    // If updating the currently logged in user, persist in localStorage
    if (current && current.id === userId) {
      const merged: User = { ...current, ...updates } as User;
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      }
      updated = merged;
    }

    return updated;
  },
};

export type { UpdateProfileInput };
