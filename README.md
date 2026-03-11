# Zentracker - Time Tracking Application

A modern time tracking application built with Next.js, TypeScript, and Tailwind CSS.

## Features

- ✅ User authentication with JWT tokens
- ✅ Protected routes and automatic redirects
- ✅ Time tracking interface
- ✅ Dashboard overview
- ✅ Responsive design
- ✅ Token persistence and auto-refresh

## Quick Start

### Prerequisites

- Node.js 18.x or higher
- npm or yarn
- Python backend running on localhost:8000 (see backend folder)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Copy environment variables:
```bash
cp .env.example .env.local
```

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/                 # Next.js app router pages
│   ├── login/          # Login page
│   └── app/            # Protected app routes
├── components/         # React components
│   ├── auth/          # Authentication components
│   ├── layout/        # Layout components
│   ├── timer/         # Timer components
│   └── ui/            # UI components
├── stores/            # Zustand stores
├── lib/               # Utility libraries
└── types/             # TypeScript type definitions
```

## Authentication Flow

1. User visits the app and is redirected to `/login` if not authenticated
2. Login form validates credentials and calls backend API
3. On successful login:
   - JWT tokens are stored in localStorage
   - User data is stored in Zustand store
   - User is redirected to `/app/tracking`
4. Protected routes automatically check authentication status
5. Tokens are refreshed automatically before expiration
6. User can logout to clear tokens and redirect to login

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript compiler check

## Environment Variables

Create a `.env.local` file with:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## API Integration

The frontend integrates with the FastAPI backend through:

- `/auth/login` - User authentication
- `/auth/refresh` - Token refresh
- `/auth/me` - Get current user profile
- `/auth/logout` - User logout

All API calls include automatic JWT token handling and error management.
