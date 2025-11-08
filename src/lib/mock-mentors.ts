// Mock mentor data with detailed profiles

export interface MentorProfile {
  id: string;
  name: string;
  title: string;
  company: string;
  location: string;
  avatar: string;
  coverImage?: string;
  bio: string;
  fullBio?: string;
  expertise: string[];
  disciplines: string[];
  languages: string[];
  rating: number;
  reviewCount: number;
  sessionsCompleted: number;
  totalMentoringTime: number; // in minutes
  responseTime: string;
  availability: string;
  isOnline: boolean;
  socialLinks?: {
    linkedin?: string;
    twitter?: string;
    website?: string;
  };
  achievements?: {
    sessionMilestones: {
      count: number;
      title: string;
      date: string;
    }[];
    communityRecognition: {
      title: string;
      rank: string;
      date: string;
      color: string;
    }[];
  };
  experience: {
    title: string;
    company: string;
    period: string;
    current?: boolean;
  }[];
  education?: {
    degree: string;
    institution: string;
    year: string;
  }[];
  profileInsights?: {
    title: string;
    description: string;
    period: string;
  }[];
  reviews?: {
    id: string;
    reviewerName: string;
    reviewerAvatar: string;
    reviewerTitle: string;
    rating: number;
    comment: string;
    date: string;
    helpful: number;
  }[];
  availability_slots?: {
    date: string;
    dayName: string;
    slots: string[];
  }[];
}

export const mockMentorProfiles: MentorProfile[] = [
  {
    id: '1',
    name: 'Ayesha Khan',
    title: 'Senior Software Engineer',
    company: 'Google',
    location: 'San Francisco, CA',
    avatar: '/images/mentor1.jpg',
    coverImage: '/images/cover1.jpg',
    bio: "I'm Ayesha! With 10+ years of experience in full-stack development, I specialize in bridging the gap between technology and user needs.",
    fullBio: "I'm Ayesha! With 10+ years of experience in full-stack development, I specialize in bridging the gap between technology and user needs. As a seasoned engineer at Google, I've worked on large-scale distributed systems, led cross-functional teams, and mentored dozens of junior engineers.\n\nI'm passionate about helping students and early-career professionals transition into tech, prepare for technical interviews, and navigate their career growth. Whether you're working on system design, coding skills, or career strategy, I'm here to help you succeed.",
    expertise: ['React', 'Node.js', 'System Design', 'Career Growth'],
    disciplines: ['Full-stack Development', 'System Architecture', 'Technical Leadership'],
    languages: ['English', 'Hindi', 'Urdu'],
    rating: 4.9,
    reviewCount: 127,
    sessionsCompleted: 89,
    totalMentoringTime: 1830,
    responseTime: '2 hours',
    availability: 'Available this week',
    isOnline: true,
    socialLinks: {
      linkedin: 'https://linkedin.com/in/priyasharma',
      twitter: 'https://twitter.com/priyatech',
    },
    achievements: {
      sessionMilestones: [
        { count: 1, title: '1 Mentorship Sessions', date: '26 Mar, 2025' },
        { count: 50, title: '50 Mentorship Sessions', date: '15 Aug, 2024' },
      ],
      communityRecognition: [
        { title: 'Top 10 Mentor', rank: 'Top 10', date: 'Mar 2025', color: 'green' },
        { title: 'Top 1% Mentor', rank: 'Top 1%', date: 'May 2025', color: 'red' },
        { title: 'Top 50 Mentor', rank: 'Top 50', date: 'Jun 2025', color: 'blue' },
      ],
    },
    experience: [
      {
        title: 'Senior Software Engineer',
        company: 'Google',
        period: '2020 - Present',
        current: true,
      },
      {
        title: 'Software Engineer',
        company: 'Microsoft',
        period: '2017 - 2020',
      },
      {
        title: 'Junior Developer',
        company: 'Amazon',
        period: '2015 - 2017',
      },
    ],
    education: [
      {
        degree: 'B.E. Computer Engineering',
        institution: 'Karachi University',
        year: '2015',
      },
    ],
    profileInsights: [
      {
        title: 'Top 50 in Front-end',
        description: 'Recognized among top mentors in front-end development',
        period: 'Jul 2025 - Sep 2025',
      },
    ],
    reviews: [
      {
        id: 'r1',
        reviewerName: 'Usman Ahmed',
        reviewerAvatar: '/images/reviewer1.jpg',
        reviewerTitle: 'Computer Engineering Student',
        rating: 5,
        comment: 'Great chat with Ayesha! She helped me rethink about system design when working on my capstone project. I liked that she had resources ready to share. The fact that she showed openness for future conversations is also amazing.',
        date: '2 weeks ago',
        helpful: 12,
      },
      {
        id: 'r2',
        reviewerName: 'Fatima Ali',
        reviewerAvatar: '/images/reviewer2.jpg',
        reviewerTitle: 'Software Engineer',
        rating: 5,
        comment: 'Ayesha is very knowledgeable, informative and super helpful mentor who has great ideas! Thank you for your advice, dedication to mentoring and willingness to share your knowledge & experiences!!',
        date: '1 month ago',
        helpful: 8,
      },
    ],
    availability_slots: [
      {
        date: '2025-10-18',
        dayName: 'SAT',
        slots: ['8:30 AM', '9:15 AM', '10:00 AM', '2:00 PM', '3:30 PM'],
      },
      {
        date: '2025-10-19',
        dayName: 'SUN',
        slots: ['9:00 AM', '10:30 AM', '1:00 PM', '4:00 PM'],
      },
      {
        date: '2025-10-20',
        dayName: 'MON',
        slots: ['8:30 AM', '11:00 AM', '2:30 PM', '5:00 PM'],
      },
      {
        date: '2025-10-21',
        dayName: 'TUE',
        slots: ['9:00 AM', '1:00 PM', '3:00 PM'],
      },
    ],
  },
  {
    id: '2',
    name: 'Ahmed Hassan',
    title: 'Senior Product Manager',
    company: 'Microsoft',
    location: 'Seattle, WA',
    avatar: '/images/mentor2.jpg',
    bio: "KU Computer Engineering graduate helping students navigate product management careers.",
    fullBio: "KU Computer Engineering graduate helping students navigate product management careers. With 8 years of experience in tech, I've transitioned from engineering to product management and led multiple successful product launches at Microsoft.\n\nI specialize in helping engineers transition to PM roles, product strategy, stakeholder management, and interview preparation.",
    expertise: ['Product Management', 'Strategy', 'Leadership', 'Tech Career'],
    disciplines: ['Product Strategy', 'Agile Development', 'User Research'],
    languages: ['English', 'Urdu'],
    rating: 4.8,
    reviewCount: 95,
    sessionsCompleted: 67,
    totalMentoringTime: 1340,
    responseTime: '4 hours',
    availability: 'Available next week',
    isOnline: false,
    socialLinks: {
      linkedin: 'https://linkedin.com/in/rahulthapa',
    },
    achievements: {
      sessionMilestones: [
        { count: 1, title: '1 Mentorship Sessions', date: '15 Feb, 2025' },
      ],
      communityRecognition: [
        { title: 'Top 50 Mentor', rank: 'Top 50', date: 'Apr 2025', color: 'blue' },
      ],
    },
    experience: [
      {
        title: 'Senior Product Manager',
        company: 'Microsoft',
        period: '2021 - Present',
        current: true,
      },
      {
        title: 'Product Manager',
        company: 'Amazon',
        period: '2019 - 2021',
      },
    ],
    education: [
      {
        degree: 'B.E. Computer Engineering',
        institution: 'Karachi University',
        year: '2018',
      },
    ],
    reviews: [],
    availability_slots: [
      {
        date: '2025-10-22',
        dayName: 'WED',
        slots: ['10:00 AM', '2:00 PM', '4:00 PM'],
      },
      {
        date: '2025-10-23',
        dayName: 'THU',
        slots: ['9:00 AM', '11:00 AM', '3:00 PM'],
      },
    ],
  },
  {
    id: '3',
    name: 'Dr. Zainab Malik',
    title: 'Data Scientist',
    company: 'Netflix',
    location: 'Los Angeles, CA',
    avatar: '/images/mentor3.jpg',
    bio: "PhD in Machine Learning, passionate about teaching data science and AI concepts.",
    fullBio: "PhD in Machine Learning, passionate about teaching data science and AI concepts. I've worked on recommendation systems, natural language processing, and computer vision projects at Netflix.\n\nI love helping students understand complex ML concepts, work on real-world projects, and prepare for data science interviews.",
    expertise: ['Machine Learning', 'Python', 'Data Analysis', 'AI Research'],
    disciplines: ['Data Science', 'Machine Learning', 'AI'],
    languages: ['English', 'Urdu', 'Hindi'],
    rating: 4.9,
    reviewCount: 203,
    sessionsCompleted: 156,
    totalMentoringTime: 3120,
    responseTime: '1 hour',
    availability: 'Available today',
    isOnline: true,
    socialLinks: {
      linkedin: 'https://linkedin.com/in/sitarai',
      website: 'https://sitarai.com',
    },
    achievements: {
      sessionMilestones: [
        { count: 100, title: '100 Mentorship Sessions', date: '10 Jan, 2025' },
      ],
      communityRecognition: [
        { title: 'Top 1% Mentor', rank: 'Top 1%', date: 'Feb 2025', color: 'red' },
        { title: 'Top 50 Mentor', rank: 'Top 50', date: 'Mar 2025', color: 'blue' },
      ],
    },
    experience: [
      {
        title: 'Senior Data Scientist',
        company: 'Netflix',
        period: '2019 - Present',
        current: true,
      },
    ],
    education: [
      {
        degree: 'PhD in Computer Science',
        institution: 'Stanford University',
        year: '2019',
      },
    ],
    reviews: [],
    availability_slots: [
      {
        date: '2025-10-18',
        dayName: 'SAT',
        slots: ['9:00 AM', '10:30 AM', '1:00 PM', '3:00 PM', '4:30 PM'],
      },
      {
        date: '2025-10-19',
        dayName: 'SUN',
        slots: ['10:00 AM', '11:30 AM', '2:00 PM', '5:00 PM'],
      },
      {
        date: '2025-10-20',
        dayName: 'MON',
        slots: ['8:00 AM', '9:30 AM', '12:00 PM', '3:30 PM', '6:00 PM'],
      },
      {
        date: '2025-10-21',
        dayName: 'TUE',
        slots: ['9:00 AM', '11:00 AM', '2:30 PM', '4:00 PM'],
      },
    ],
  },
];

export const getMentorById = (id: string): MentorProfile | undefined => {
  return mockMentorProfiles.find(mentor => mentor.id === id);
};

export const getSimilarMentors = (currentMentorId: string, limit: number = 3): MentorProfile[] => {
  return mockMentorProfiles
    .filter(mentor => mentor.id !== currentMentorId)
    .slice(0, limit);
};

