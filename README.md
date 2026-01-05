# Mentora

Mentorship platform connecting students with experienced professionals for 1:1 career guidance and skill development.

## Tech Stack

**Frontend**
- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS + Radix UI

**Backend**
- FastAPI (Python)
- PostgreSQL
- Deployed on Railway

**Integrations**
- Agora (Video calls)
- JWT Authentication

## Quick Start

```bash
git clone https://github.com/saeeed22/mentora_.git
cd mentora
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Environment Setup

```env
NEXT_PUBLIC_API_URL=https://mentora-backend-production-d4c3.up.railway.app
```

## Project Structure

```
src/
├── app/
│   ├── (auth)/              # Authentication pages
│   └── (dashboard)/         # Dashboard & protected routes
├── components/              # React components
│   ├── ui/                  # Shared UI components
│   └── dashboard/           # Dashboard components
└── lib/
    └── api/                 # API client modules
```

## Features

**Mentees**
- Search mentors by expertise
- Book sessions
- Video calls via Agora
- Real-time messaging
- Leave reviews

**Mentors**
- Set weekly availability
- Approve/reject bookings
- Conduct video sessions
- Track session history

## Development

```bash
npm run dev       # Development server
npm run build     # Production build
npm run start     # Production server
npm run lint      # ESLint
```

## API Modules

- `auth.ts` - Authentication
- `bookings-api.ts` - Session booking
- `mentors-api.ts` - Mentor search
- `mentor-management-api.ts` - Availability management  
- `messaging-api.ts` - Messaging

## License

Final Year Project - University of Karachi
