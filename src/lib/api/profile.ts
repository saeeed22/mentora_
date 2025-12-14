import { auth, CurrentUser } from './auth';
import { mockUsers, User } from '../mock-auth';

const STORAGE_KEY = 'currentUser';

type UpdateProfileInput = Partial<Pick<User,
  'name' | 'bio' | 'title' | 'company' | 'location' | 'expertise' | 'avatar'
>> & {
  socialLinks?: { linkedin?: string; twitter?: string; portfolio?: string };
};

// Helper to convert CurrentUser to User-like object
function currentUserToUser(cu: CurrentUser): User | null {
  const mockUser = mockUsers.find(u => u.id === cu.id);
  if (mockUser) return mockUser;
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
    const other = mockUsers.find(u => u.id === userId) || null;
    return other;
  },

  updateProfile(userId: string, updates: UpdateProfileInput): User | null {
    const current = auth.getCurrentUser();
    let updated: User | null = null;

    // Update in mockUsers in-memory list for runtime reflection
    const idx = mockUsers.findIndex(u => u.id === userId);
    if (idx !== -1) {
      mockUsers[idx] = { ...mockUsers[idx], ...updates } as User;
      updated = mockUsers[idx];
    }

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


