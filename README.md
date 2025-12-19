# Mentora

A mentorship platform connecting students with experienced professionals for career guidance, skill development, and academic support.

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript
- **Styling**: Tailwind CSS, Radix UI
- **Backend API**: REST API (Python/FastAPI - separate repository)
- **Video Calls**: Agora
- **Authentication**: JWT with OAuth support

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/saeeed22/mentora_.git
cd mentora

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000)

### Environment Variables

Create a `.env` file with:

```env
# Backend API URL (already configured)
NEXT_PUBLIC_API_URL=https://mentora-backend-production-d4c3.up.railway.app
```

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Login, signup, password reset
│   └── (dashboard)/       # Protected dashboard routes
│       ├── home/          # Dashboard home
│       ├── explore/       # Browse mentors
│       ├── mentor/[id]/   # Mentor profile
│       ├── bookings/      # Booking management
│       ├── messages/      # Messaging
│       ├── availability/  # Mentor availability settings
│       └── session/[id]/  # Video call session
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   └── dashboard/        # Dashboard-specific components
└── lib/                  # Utilities and API clients
    └── api/              # API service modules
```

## Features

### For Mentees
- Browse and search mentors
- Book mentoring sessions
- Real-time messaging
- Video call sessions
- Leave feedback and ratings

### For Mentors
- Set weekly availability
- Manage booking requests
- Video call integration
- View session history

## Scripts

```bash
npm run dev      # Start development server
npm run build    # Create production build
npm run start    # Start production server
npm run lint     # Run linting
```

## API Integration

The frontend connects to a FastAPI backend deployed on Railway. Key API modules:

- `auth.ts` - Authentication (login, signup, OAuth)
- `bookings-api.ts` - Booking management
- `mentors-api.ts` - Mentor search and profiles
- `mentor-management-api.ts` - Mentor availability
- `messaging-api.ts` - Real-time messaging

## License

Final Year Project - Karachi University
