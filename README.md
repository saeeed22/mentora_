# Mentora 🎓

A comprehensive mentorship platform designed for the Karachi University community, connecting students (mentees) with experienced professionals (mentors) for career guidance, skill development, and academic support.

![Next.js](https://img.shields.io/badge/Next.js-15.5.3-black?style=flat-square&logo=next.js)
![React](https://img.shields.io/badge/React-19.1.0-blue?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)
![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4.1-38B2AC?style=flat-square&logo=tailwind-css)

---

## 📖 Table of Contents
- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Running the Application](#running-the-application)
- [Project Structure](#project-structure)
- [Demo Accounts](#demo-accounts)
- [Key Features Explained](#key-features-explained)
- [API Documentation](#api-documentation)
- [Customization](#customization)
- [Development](#development)
- [Contributing](#contributing)
- [License](#license)
- [Support](#support)

---

## 🎯 Overview

**Mentora** is a modern, full-featured mentorship platform that bridges the gap between students seeking guidance and experienced professionals willing to share their knowledge. Built specifically for the Karachi University community, it facilitates meaningful connections through structured mentorship sessions, real-time messaging, and event management.

### Why Mentora?

- **Career Guidance**: Connect with professionals from top companies (Google, Microsoft, Netflix, Amazon, etc.)
- **Skill Development**: Learn from experts in various fields (Engineering, Product Management, Data Science, Design, etc.)
- **Flexible Scheduling**: Book sessions based on mentor availability with integrated calendar management
- **Real-time Communication**: Built-in messaging system for mentor-mentee interaction
- **Profile Management**: Comprehensive profiles showcasing expertise, experience, and achievements
- **Session Management**: Video call integration, session tracking, and feedback system

---

## ✨ Features

### For Mentees (Students)
- 🔍 **Browse & Search Mentors**: Filter by expertise, company, location, rating, and availability
- 📅 **Book Sessions**: Schedule one-on-one mentoring sessions with available time slots
- 💬 **Messaging**: Direct communication with mentors before/after sessions
- ⭐ **Reviews & Ratings**: Leave feedback to help other students choose mentors
- 📊 **Dashboard**: Track upcoming sessions, progress, and recommended mentors
- 🎯 **Profile Strength**: Gamified profile completion system
- 📆 **Calendar Integration**: View all your sessions and bookings in one place

### For Mentors (Professionals)
- 📋 **Availability Management**: Set your weekly schedule, session duration, and buffer times
- 👥 **Session Management**: Accept/decline booking requests, manage confirmed sessions
- 💬 **Mentee Communication**: Stay connected with mentees through built-in messaging
- 📈 **Profile Analytics**: Track sessions completed, reviews, response time, and recognition
- 🏆 **Achievements System**: Milestone tracking and community recognition badges
- 📆 **Calendar Widget**: Overview of all scheduled sessions and bookings
- 🎥 **Video Call Integration**: Seamless session joining with auto-generated meeting links

### Platform Features
- 🔐 **Authentication**: Secure login/signup with role-based access (mentor/mentee)
- 🎨 **Modern UI**: Clean, responsive design built with Tailwind CSS and Radix UI components
- 📱 **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- 🌙 **Dark Mode Ready**: Theme support with next-themes
- 🔔 **Toast Notifications**: User feedback with Sonner toast library
- 📝 **Form Validation**: Robust form handling with React Hook Form and Zod
- 🎯 **Type Safety**: Full TypeScript implementation for better developer experience

---

## 🛠 Tech Stack

### Frontend Framework
- **Next.js 15.5.3** - React framework with App Router and Turbopack
- **React 19.1.0** - UI library
- **TypeScript 5** - Type-safe JavaScript

### UI Components & Styling
- **Tailwind CSS 3.4.1** - Utility-first CSS framework
- **Radix UI** - Accessible component primitives (Dialog, Dropdown, Select, Tabs, etc.)
- **Lucide React** - Beautiful icon library
- **next-themes** - Theme management
- **class-variance-authority** - Component variant management
- **tailwind-merge** - Intelligent Tailwind class merging
- **tailwindcss-animate** - Animation utilities

### Form Handling & Validation
- **React Hook Form 7.63.0** - Performant form management
- **Zod 4.1.11** - TypeScript-first schema validation
- **@hookform/resolvers** - Form validation resolver

### State & Data Management
- **Mock Services** - Local mock API services for development
  - Authentication (`lib/mock-auth.ts`)
  - Mentors (`lib/mock-mentors.ts`)
  - Bookings, Availability, Messages (`lib/api/`)

### Development Tools
- **ESLint 9** - Code linting
- **Autoprefixer** - CSS vendor prefixing
- **PostCSS** - CSS transformation

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (version 18.x or newer) - [Download](https://nodejs.org/)
- **npm** (comes with Node.js) or **yarn** or **pnpm**
- **Git** (optional, for cloning) - [Download](https://git-scm.com/)

### Verify Installation
```bash
node --version  # Should output v18.x.x or higher
npm --version   # Should output 9.x.x or higher
```

---

## 📥 Installation

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/mentora.git
cd mentora
```

Or download and extract the ZIP file from GitHub.

### 2. Install Dependencies
```bash
npm install
```

This will install all required packages listed in `package.json`.

### 3. Environment Setup (Optional)
Currently, the app uses mock data and doesn't require environment variables. For production deployment with a real backend, create a `.env.local` file:

```env
# Example for future backend integration
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

---

## 🚀 Running the Application

### Development Mode
Start the development server with hot-reload:

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

### Production Build
Create an optimized production build:

```bash
npm run build
npm start
```

### Linting
Check code quality:

```bash
npm run lint
```

---

## 📁 Project Structure

```
mentora/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (auth)/                   # Authentication pages group
│   │   │   ├── login/                # Login page
│   │   │   ├── signup/               # Signup page
│   │   │   └── reset-password/       # Password reset page
│   │   ├── (dashboard)/              # Protected dashboard routes
│   │   │   ├── availability/         # Mentor availability management
│   │   │   ├── bookings/             # Booking management
│   │   │   ├── events/               # Event listing (future)
│   │   │   ├── explore/              # Browse mentors
│   │   │   ├── home/                 # Dashboard home
│   │   │   ├── mentor/[id]/          # Mentor profile detail
│   │   │   ├── messages/             # Messaging interface
│   │   │   ├── profile/              # User profile management
│   │   │   ├── session/[id]/         # Video call session page
│   │   │   └── layout.tsx            # Dashboard layout with sidebar
│   │   ├── layout.tsx                # Root layout
│   │   ├── page.tsx                  # Landing page
│   │   └── globals.css               # Global styles
│   ├── components/                   # React components
│   │   ├── dashboard/                # Dashboard-specific components
│   │   │   ├── calendar-widget.tsx   # Calendar display
│   │   │   ├── header.tsx            # Dashboard header
│   │   │   └── sidebar.tsx           # Navigation sidebar
│   │   ├── landing/                  # Landing page components
│   │   │   ├── header.tsx            # Landing header
│   │   │   └── footer.tsx            # Landing footer
│   │   ├── ui/                       # Reusable UI components (Radix UI)
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── form.tsx
│   │   │   ├── input.tsx
│   │   │   └── ... (20+ components)
│   │   ├── booking-dialog.tsx        # Session booking modal
│   │   ├── feedback-dialog.tsx       # Session feedback modal
│   │   ├── landing-page.tsx          # Main landing page
│   │   ├── mentorcard.tsx            # Mentor card component
│   │   └── testimonialcard.tsx       # Testimonial display
│   └── lib/                          # Utilities and services
│       ├── api/                      # Mock API services
│       │   ├── auth.ts               # Authentication API
│       │   ├── availability.ts       # Availability API
│       │   ├── bookings.ts           # Bookings API
│       │   ├── mentors.ts            # Mentors API
│       │   ├── messages.ts           # Messaging API
│       │   └── profile.ts            # Profile API
│       ├── mock-auth.ts              # Mock authentication system
│       ├── mock-mentors.ts           # Mock mentor data
│       ├── types.ts                  # TypeScript type definitions
│       └── utils.ts                  # Utility functions
├── public/                           # Static assets
│   ├── images/                       # Profile images, covers
│   └── logos/                        # Company logos
├── docs/                             # Documentation
│   └── api-spec.md                   # API specification for backend
├── components.json                   # shadcn/ui configuration
├── tailwind.config.js                # Tailwind CSS configuration
├── tsconfig.json                     # TypeScript configuration
├── next.config.ts                    # Next.js configuration
├── package.json                      # Dependencies and scripts
└── README.md                         # This file
```

### Key Directories Explained

- **`app/(auth)`**: Authentication-related pages with grouped routing
- **`app/(dashboard)`**: Protected pages requiring authentication
- **`components/ui`**: Reusable UI components based on Radix UI and shadcn/ui
- **`lib/api`**: Mock API services that simulate backend functionality
- **`lib/types.ts`**: Centralized TypeScript type definitions
- **`docs/api-spec.md`**: Comprehensive API documentation for future backend implementation

---

## 🔑 Demo Accounts

The application includes pre-configured demo accounts for testing:

### Mentor Account
```
Email: mentor@ku.edu.pk
Password: mentor123
```
**Features Access**:
- View mentee booking requests
- Manage availability schedule
- Access all scheduled sessions
- Respond to messages
- View profile analytics

### Mentee Account
```
Email: mentee@ku.edu.pk
Password: mentee123
```
**Features Access**:
- Browse and search mentors
- Book mentoring sessions
- Send messages to mentors
- Leave feedback and ratings
- Track learning progress

### Additional Test Users
You can also sign up with any email address to create new test accounts. The app stores data in browser localStorage, so your data persists across sessions.

---

## 🎓 Key Features Explained

### 1. Mentor Discovery & Filtering
The **Explore** page (`/explore`) allows mentees to:
- Browse mentor profiles with ratings, expertise, and company information
- Filter by expertise areas, company, location, availability
- Sort by rating, sessions completed, response time
- View mentor availability slots in real-time
- See detailed mentor profiles with experience, education, and reviews

### 2. Session Booking System
**Booking Flow**:
1. Mentee browses available mentors
2. Clicks "Book Session" on mentor profile
3. Selects date/time from available slots
4. Fills in session details (topic, goals, session type)
5. Receives booking confirmation with video call link
6. Session appears in dashboard with countdown

**Features**:
- Real-time availability checking
- Automatic video call link generation (Jitsi integration)
- Email notifications (simulated in mock mode)
- Session status tracking (pending, confirmed, completed, cancelled)

### 3. Availability Management (Mentors)
Located at `/availability`, mentors can:
- Set weekly recurring schedule (time slots for each day)
- Configure session duration (30, 45, 60 minutes)
- Set buffer time between sessions
- Block specific dates
- Set maximum sessions per day
- Enable/disable auto-accept bookings
- Timezone selection

### 4. Messaging System
Real-time messaging between mentors and mentees:
- Conversation threads linked to bookings or standalone
- Message history persistence
- Real-time updates (simulated with mock data)
- Support for text messages and system notifications

### 5. Dashboard & Analytics
**Mentee Dashboard** (`/home`):
- Welcome greeting with time-of-day
- Upcoming sessions with quick join buttons
- Profile strength indicator with gamification
- Suggested mentors based on interests
- Calendar widget showing all bookings
- Quick actions for common tasks

**Mentor Dashboard**:
- Upcoming mentee sessions
- Recent activity feed
- Profile analytics (views, sessions, response time)
- Achievement badges and milestones
- Calendar overview

### 6. Profile Management
Comprehensive profile pages (`/profile`) with:
- Personal information (name, bio, location)
- Professional details (company, title, experience)
- Expertise tags and disciplines
- Social links (LinkedIn, Twitter, website)
- Education history
- Work experience timeline
- Achievements and recognition badges
- Session statistics and ratings

### 7. Video Call Integration
Session page (`/session/[id]`) provides:
- Pre-session preparation area
- One-click join to Jitsi video call
- Session details and notes
- Post-session feedback collection
- Session recording link (future feature)

---

## 📚 API Documentation

The project includes a comprehensive API specification (`docs/api-spec.md`) that defines:
- RESTful endpoints for all features
- Request/response formats
- Authentication flow
- Error handling
- Pagination standards
- Access control rules

This spec serves as a blueprint for backend developers to implement the real API that will replace the mock services.

### Mock API Services
Current implementation uses mock services in `src/lib/api/`:
- All data stored in-memory and localStorage
- Simulated API delays for realistic UX
- Full CRUD operations for all resources
- Type-safe interfaces matching future backend

### Future Backend Integration
To connect to a real backend:
1. Implement endpoints according to `docs/api-spec.md`
2. Update mock service files to call real API
3. Add authentication token management
4. Configure API URL in environment variables
5. Update error handling and validation

---

## 🎨 Customization

### Styling & Theming

**Tailwind Configuration** (`tailwind.config.js`):
```javascript
// Customize colors, fonts, spacing, etc.
theme: {
  extend: {
    colors: {
      teal: { 600: '#0d9488', 700: '#0f766e' },
      // Add your brand colors
    }
  }
}
```

**Global Styles** (`src/app/globals.css`):
```css
/* Modify CSS variables for design tokens */
:root {
  --primary: #0d9488;
  --secondary: #6b2463;
  /* Custom variables */
}
```

### Component Customization

All UI components in `src/components/ui/` can be customized:
- Modify variants using `class-variance-authority`
- Override default props
- Extend with new variants
- Add custom animations

### Branding

Replace assets in `public/` directory:
- Company logos: `public/logos/`
- Profile images: `public/images/`
- Favicon: `public/favicon.ico`

---

## 💻 Development

### Code Quality

The project enforces code quality through:
- **ESLint**: Linting rules for consistent code style
- **TypeScript**: Static type checking
- **Prettier** (optional): Code formatting

Run linter:
```bash
npm run lint
```

### Component Development

Components follow these patterns:
- **UI Components**: Reusable, prop-driven, in `components/ui/`
- **Feature Components**: Business logic, in `components/`
- **Page Components**: Route-specific, in `app/`

### Adding New Features

1. **Define Types**: Add TypeScript types in `lib/types.ts`
2. **Create Mock Data**: Add to appropriate mock service in `lib/api/`
3. **Build UI Components**: Create in `components/`
4. **Create Pages**: Add routes in `app/`
5. **Update API Spec**: Document in `docs/api-spec.md`

### Performance Optimization

- Next.js Image component for optimized images
- Dynamic imports for code splitting
- React Server Components where possible
- Memoization for expensive computations

---

## 🤝 Contributing

We welcome contributions to Mentora! Here's how you can help:

### Getting Started
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Commit with clear messages: `git commit -m 'Add amazing feature'`
5. Push to your branch: `git push origin feature/amazing-feature`
6. Open a Pull Request

### Contribution Guidelines
- Follow the existing code style and conventions
- Write clear commit messages
- Add comments for complex logic
- Update documentation as needed
- Test your changes thoroughly
- Ensure all linters pass

### Areas for Contribution
- 🐛 Bug fixes
- ✨ New features
- 📝 Documentation improvements
- 🎨 UI/UX enhancements
- ♿ Accessibility improvements
- 🌍 Internationalization
- 🧪 Test coverage

---

## 📄 License

This project is developed as a Final Year Project (FYP) for Karachi University. 

For commercial use or licensing inquiries, please contact the project maintainers.

---

## 🆘 Support

### Documentation
- **API Spec**: See `docs/api-spec.md` for complete API documentation
- **Component Library**: Explore `src/components/ui/` for reusable components
- **Type Definitions**: Check `src/lib/types.ts` for data structures

### Common Issues

**Port Already in Use**
```bash
# Kill process on port 3000
npx kill-port 3000
# Or use a different port
npm run dev -- -p 3001
```

**Module Not Found Errors**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

**TypeScript Errors**
```bash
# Check TypeScript configuration
npx tsc --noEmit
```

### Getting Help
- 📧 Email: support@mentorconnect.ku.edu.pk
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/mentora/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/yourusername/mentora/discussions)

---

## 🎯 Roadmap

### Planned Features
- [ ] Real-time notifications with WebSocket
- [ ] Advanced search with AI-powered recommendations
- [ ] Group mentoring sessions
- [ ] Event management system
- [ ] Video recording and playback
- [ ] Payment integration for premium features
- [ ] Mobile app (React Native)
- [ ] Admin dashboard for platform management
- [ ] Analytics and reporting
- [ ] Email notification system
- [ ] Calendar integration (Google Calendar, Outlook)
- [ ] Multi-language support

### Backend Development
- [ ] Implement REST API according to `docs/api-spec.md`
- [ ] Database schema design (PostgreSQL recommended)
- [ ] Authentication with JWT tokens
- [ ] File upload for profile pictures
- [ ] Email service integration
- [ ] Video call service (Jitsi/Zoom/Teams integration)
- [ ] Caching layer (Redis)
- [ ] Rate limiting and security

---

## 👥 Team

This project is developed as part of Final Year Project at Karachi University.

**Project Contributors**:
- [Your Name] - Full Stack Developer
- [Team Member 2] - UI/UX Designer
- [Team Member 3] - Backend Developer

**Advisor**: [Advisor Name], [Department]

---

## 🙏 Acknowledgments

- **Karachi University** - For providing the platform and support
- **Next.js Team** - For the amazing React framework
- **Vercel** - For hosting and deployment platform
- **shadcn/ui** - For the beautiful component library
- **Radix UI** - For accessible component primitives
- **Tailwind CSS** - For the utility-first CSS framework

---

## 📊 Project Status

**Current Version**: 0.1.0 (Beta)

**Development Status**: 🚧 Active Development

**Last Updated**: November 2025

---

<div align="center">

**Built with ❤️ for Karachi University Community**

[⬆ Back to Top](#mentora-)

</div>
