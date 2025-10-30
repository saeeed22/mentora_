// Mock authentication system for Mentor Connect KU

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'mentor' | 'mentee';
  avatar?: string;
  bio?: string;
  expertise?: string[];
  company?: string;
  title?: string;
  location?: string;
}

// Mock user database
const mockUsers: User[] = [
  // Mentors
  {
    id: '1',
    email: 'mentor@ku.edu.np',
    name: 'Priya Sharma',
    role: 'mentor',
    avatar: '/avatars/mentor1.jpg',
    bio: 'Senior Software Engineer at Google with 5+ years of experience in full-stack development.',
    expertise: ['React', 'Node.js', 'System Design', 'Career Growth'],
    company: 'Google',
    title: 'Senior Software Engineer',
    location: 'San Francisco, CA'
  },
  {
    id: '2',
    email: 'rahul.mentor@ku.edu.np',
    name: 'Rahul Thapa',
    role: 'mentor',
    avatar: '/avatars/mentor2.jpg',
    bio: 'Product Manager at Microsoft, KU Computer Engineering graduate 2018.',
    expertise: ['Product Management', 'Strategy', 'Leadership', 'Tech Career'],
    company: 'Microsoft',
    title: 'Senior Product Manager',
    location: 'Seattle, WA'
  },
  // Mentees
  {
    id: '3',
    email: 'mentee@ku.edu.np',
    name: 'Sita Poudel',
    role: 'mentee',
    avatar: '/avatars/mentee1.jpg',
    bio: 'Final year Computer Engineering student at KU, interested in software development.',
    expertise: ['JavaScript', 'Python', 'Learning'],
    company: 'Kathmandu University',
    title: 'Student',
    location: 'Dhulikhel, Nepal'
  },
  {
    id: '4',
    email: 'student@ku.edu.np',
    name: 'Arjun Karki',
    role: 'mentee',
    avatar: '/avatars/mentee2.jpg',
    bio: 'Third year Business Administration student looking for career guidance.',
    expertise: ['Business', 'Marketing', 'Career Planning'],
    company: 'Kathmandu University',
    title: 'Student',
    location: 'Dhulikhel, Nepal'
  }
];

// Mock passwords (in real app, these would be hashed)
const mockPasswords: Record<string, string> = {
  'mentor@ku.edu.np': 'mentor123',
  'rahul.mentor@ku.edu.np': 'mentor123',
  'mentee@ku.edu.np': 'mentee123',
  'student@ku.edu.np': 'mentee123'
};

// Current user state (in real app, this would be in a state management system)
let currentUser: User | null = null;

export const mockAuth = {
  // Login function
  async login(email: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const user = mockUsers.find(u => u.email === email);
    
    if (!user) {
      return { success: false, error: 'User not found' };
    }
    
    if (mockPasswords[email] !== password) {
      return { success: false, error: 'Invalid password' };
    }
    
    currentUser = user;
    
    // In real app, would store JWT token in localStorage/cookies
    if (typeof window !== 'undefined') {
      localStorage.setItem('currentUser', JSON.stringify(user));
    }
    
    return { success: true, user };
  },

  // Signup function
  async signup(data: {
    name: string;
    email: string;
    password: string;
    role: 'mentor' | 'mentee';
  }): Promise<{ success: boolean; user?: User; error?: string }> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check if user already exists
    if (mockUsers.find(u => u.email === data.email)) {
      return { success: false, error: 'User already exists' };
    }
    
    // Create new user
    const newUser: User = {
      id: (mockUsers.length + 1).toString(),
      email: data.email,
      name: data.name,
      role: data.role,
      bio: data.role === 'mentor' ? 'New mentor on the platform' : 'New student looking for guidance',
      expertise: [],
      company: data.role === 'mentee' ? 'Kathmandu University' : '',
      title: data.role === 'mentee' ? 'Student' : '',
      location: 'Nepal'
    };
    
    // Add to mock database
    mockUsers.push(newUser);
    mockPasswords[data.email] = data.password;
    currentUser = newUser;
    
    // Store in localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('currentUser', JSON.stringify(newUser));
    }
    
    return { success: true, user: newUser };
  },

  // Reset password function
  async resetPassword(email: string): Promise<{ success: boolean; error?: string }> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const user = mockUsers.find(u => u.email === email);
    
    if (!user) {
      return { success: false, error: 'Email not found' };
    }
    
    // In real app, would send email with reset link
    console.log(`Password reset email sent to ${email}`);
    
    return { success: true };
  },

  // Logout function
  async logout(): Promise<void> {
    currentUser = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('currentUser');
    }
  },

  // Get current user
  getCurrentUser(): User | null {
    if (currentUser) return currentUser;
    
    // Try to get from localStorage
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('currentUser');
      if (stored) {
        currentUser = JSON.parse(stored);
        return currentUser;
      }
    }
    
    return null;
  },

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return this.getCurrentUser() !== null;
  }
};

// Export mock users for development/testing
export { mockUsers, mockPasswords };
