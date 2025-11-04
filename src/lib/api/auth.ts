import { mockAuth } from '../mock-auth';
import type { User } from '../types';

// Thin wrapper around existing mockAuth to keep API surface consistent
export const auth = {
  login: (email: string, password: string) => mockAuth.login(email, password),
  signup: (data: { name: string; email: string; password: string; role: 'mentor' | 'mentee' }) =>
    mockAuth.signup(data),
  resetPassword: (email: string) => mockAuth.resetPassword(email),
  logout: () => mockAuth.logout(),
  getCurrentUser: (): User | null => mockAuth.getCurrentUser(),
  isAuthenticated: (): boolean => mockAuth.isAuthenticated(),
};

export type { User };

