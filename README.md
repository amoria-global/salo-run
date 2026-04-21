# Amoria Connekt — Dashboard

Role-based dashboard application for **Amoria** — providing personalized interfaces for photographers, clients, and event coordinators to manage their bookings, events, and payments.

## Tech Stack

- **Framework:** Next.js 16 (App Router) with React 19
- **Language:** TypeScript 5 (strict mode)
- **Styling:** Tailwind CSS 4
- **Icons:** Lucide React, Bootstrap Icons
- **Storage:** localforage, localStorage, cookies
- **Auth:** JWT token-based with middleware route protection

## Features

### Photographer Dashboard
- Performance analytics and metrics
- Client management
- Portfolio gallery
- Transaction history and payroll reports
- Inbox messaging
- Notification center

### Client Dashboard
- Photographer discovery and browsing
- Event management
- Booking management (upcoming and past)
- Payment methods and transaction history
- Photo library (My Photos)
- Live stream viewing

### Event Coordinator Dashboard
- Event creation and management
- Photographer selection and hiring
- Event gallery and media
- Payment processing
- Live stream ticketing and management

### Shared Features
- Light/Dark/System theme with role-based customization
- Complete profile prompt modal
- Donation modal
- Real-time notifications
- Responsive design (desktop and tablet)

## Project Structure

```
app/
├── user/
│   ├── photographer/          # Photographer routes
│   │   ├── dashboard/
│   │   ├── clients/
│   │   ├── gallery/
│   │   ├── profile/
│   │   ├── all-transactions/
│   │   ├── payroll-report/
│   │   ├── streams/
│   │   ├── inbox/
│   │   ├── notifications/
│   │   └── preferences/
│   ├── client/                # Client routes
│   │   ├── home/
│   │   ├── photographers/
│   │   ├── gallery/
│   │   ├── events/
│   │   ├── bookings/
│   │   ├── transactions/
│   │   ├── payments/
│   │   ├── my-photos/
│   │   ├── streams/
│   │   ├── profile/
│   │   ├── inbox/
│   │   ├── notifications/
│   │   └── preferences/
│   └── event-coordinator/     # Event Coordinator routes
│       ├── home/
│       ├── events/
│       ├── photographers/
│       ├── gallery/
│       ├── payments/
│       ├── streams/
│       ├── profile/
│       ├── inbox/
│       ├── notifications/
│       └── preferences/
├── pages/                     # Page components (photographer, client, event-coordinator)
├── components/
│   ├── dashboard/             # StatCard, PerformanceChart, ActivityItem, etc.
│   ├── sidebar.tsx            # Role-specific navigation sidebar
│   ├── topbar.tsx             # Top nav with user menu
│   ├── CompleteProfileModal.tsx
│   └── DonateModal.tsx
├── context/
│   ├── ThemeContext.tsx        # Light/Dark theme management
│   └── UserProfileContext.tsx  # User profile state
├── providers/
│   └── AuthProvider.tsx       # Authentication provider
├── layout.tsx                 # Root layout
├── page.tsx                   # Landing / role selection page
└── globals.css                # Global styles
middleware.ts                  # Route protection and token handling
```

## Getting Started

### Prerequisites

- Node.js 18+
- yarn or npm

### Installation

```bash
# Install dependencies
yarn install

# Start development server
yarn dev
```

The app runs at [http://localhost:3001](http://localhost:3001) (or 3000 if run standalone).

### Environment Variables

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_LANDING_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=<backend-api-url>
```

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_LANDING_URL` | URL of the home/landing app (for login redirects) |
| `NEXT_PUBLIC_API_URL` | Backend API server address |

### Scripts

| Script | Description |
|--------|-------------|
| `yarn dev` | Start dev server |
| `yarn build` | Build for production |
| `yarn start` | Start production server |
| `yarn lint` | Run ESLint |

## Authentication Flow

```
1. User logs in via the Home app
2. Home app redirects to Dashboard with ?token=<JWT>
3. Middleware extracts token from URL → cookie → localStorage
4. AuthProvider validates token with the backend
5. Fetches user profile summary
6. Stores token in cookie + localStorage
7. Removes token from URL
8. Periodic re-validation every 5 minutes
9. Cross-tab logout synchronization
```

Unauthenticated users are redirected to the Home app login page.

## Theme System

Three modes available: **Light**, **Dark**, and **System** (follows OS preference).

Themes are persisted per role in localStorage, allowing photographers and clients to have independent theme preferences.

## Related Projects

| Project | Description |
|---------|-------------|
| [home](../home) | Public-facing landing, auth, photographer discovery, and event browsing |
