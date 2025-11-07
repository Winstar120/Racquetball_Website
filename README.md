# Racquetball League Website

A comprehensive web application for managing racquetball leagues, player registrations, and match scheduling.

## Features

### MVP Features Implemented ✅
- **User Authentication**: Registration with phone number collection and secure password hashing
- **Admin Dashboard**: Comprehensive admin interface for league management
- **League Management**: Create and configure leagues with custom dates and divisions
- **Court Management**: Configure courts and set weekly availability schedules
- **League Registration**: Users can browse and register for open leagues
- **Email Notifications**: Automated match reminders with opponent contact details (name, email, phone)
- **Database Schema**: Complete Prisma schema for all entities (users, leagues, matches, courts)
- **Navigation System**: Intuitive navigation with role-based menu items
- **Responsive UI**: Modern, mobile-friendly interface using Tailwind CSS

### Features In Progress 🚧
- Automated match scheduling algorithm
- Match results tracking
- Email notifications
- Payment integration

## Tech Stack

- **Frontend**: Next.js 14 with App Router, React, TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: NextAuth.js with credentials provider
- **Database**: PostgreSQL with Prisma ORM
- **Hosting**: Optimized for Vercel deployment

## UI Styling Notes

- **Gradient Background**: Public and authenticated shells share the `.app-gradient-bg` helper (defined in `app/globals.css`) so every page gets the same slate gradient used on `/dashboard`.
- **Auth Form Width**: Login, register, forgot-password, and reset-password cards use the `.form-card` helper to keep input groups to `min(90vw, 26rem)`. If you build new auth-like forms, wrap their outer container with this class to prevent inputs from stretching across very wide screens.

## Project Structure

```
racquetball_website/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   ├── auth/          # NextAuth endpoints
│   │   ├── register/      # User registration
│   │   └── admin/         # Admin API endpoints
│   ├── admin/             # Admin dashboard pages
│   ├── dashboard/         # User dashboard
│   ├── login/             # Login page
│   ├── register/          # Registration page
│   └── page.tsx           # Home page
├── components/            # React components
├── lib/                   # Utility functions
│   ├── auth.ts           # NextAuth configuration
│   └── prisma.ts         # Prisma client
├── prisma/
│   └── schema.prisma     # Database schema
└── types/                # TypeScript type definitions
```

## Email Notification Features

### What's Included
1. **Phone Number Collection**: Required during user registration
2. **Match Reminders**: Email notifications sent to players before matches
3. **Opponent Contact Info**: Each reminder includes:
   - Opponent's name
   - Opponent's email address
   - Opponent's phone number
   - Match date, time, and court location
4. **Admin Control Panel**: Send bulk reminders for upcoming matches
5. **Welcome Emails**: Sent automatically upon registration

### Email Setup

Configure your SMTP settings in `.env.local`:

```env
# For Gmail (recommended for development)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password  # Use App Password, not regular password
SMTP_FROM=noreply@racquetballleague.com

# For SendGrid (recommended for production)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=your-sendgrid-api-key
SMTP_FROM=verified-sender@yourdomain.com
```

**Gmail Setup:**
1. Enable 2-Factor Authentication on your Google account
2. Generate an App Password: Google Account → Security → App passwords
3. Use the generated password in `SMTP_PASSWORD`

**Production Options:**
- **SendGrid**: Free tier available, great deliverability
- **AWS SES**: Cost-effective for high volume
- **Postmark**: Excellent for transactional emails

## Setup Instructions

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL database (local or cloud)
- Vercel account (for deployment)

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd racquetball_website
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**

   Copy the `.env.local` file and update with your values:
   ```env
   # Database - Update with your PostgreSQL connection string
   POSTGRES_PRISMA_URL="postgresql://user:password@localhost:5432/racquetball?pgbouncer=true"
   POSTGRES_URL_NON_POOLING="postgresql://user:password@localhost:5432/racquetball"

   # NextAuth
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=generate-a-secure-random-string-here
   ```

   Generate a secure NEXTAUTH_SECRET:
   ```bash
   openssl rand -base64 32
   ```

4. **Set up the database**
   ```bash
   npx prisma generate
   npx prisma migrate dev --name init
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) to see the application.

### Database Setup

#### Option 1: Local PostgreSQL
1. Install PostgreSQL locally
2. Create a new database:
   ```sql
   CREATE DATABASE racquetball;
   ```
3. Update the connection strings in `.env.local`

#### Option 2: Vercel Postgres
1. Create a Vercel project
2. Add Vercel Postgres from the dashboard
3. Copy the environment variables to `.env.local`

#### Option 3: Other Cloud Providers
- **Supabase**: Free tier with generous limits
- **PlanetScale**: MySQL-compatible serverless database
- **Neon**: Serverless Postgres with branching

### Deployment to Vercel

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Import to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Configure environment variables
   - Deploy

3. **Set up production database**
   - Add Vercel Postgres to your project
   - Run migrations:
   ```bash
   npx prisma migrate deploy
   ```

## Usage Guide

### Creating an Admin User

Currently, admin users need to be created manually in the database. After registering a regular user:

1. Access your database
2. Update the user record:
   ```sql
   UPDATE "User" SET "isAdmin" = true WHERE email = 'admin@example.com';
   ```

### Admin Features
- Access admin dashboard at `/admin`
- Create and manage leagues
- Configure court availability
- View user registrations
- Generate match schedules

### User Features
- Register and login at `/register` and `/login`
- View dashboard at `/dashboard`
- Sign up for leagues (when implemented)
- View match schedules
- Track results

## Development Roadmap

### Phase 1: MVP (Current)
- ✅ User authentication system
- ✅ Admin dashboard framework
- ✅ League creation interface
- ✅ Database schema
- 🚧 Court availability configuration
- 🚧 League registration for players

### Phase 2: Scheduling
- [ ] Automated round-robin scheduling
- [ ] Court assignment algorithm
- [ ] Schedule conflict detection
- [ ] Manual schedule adjustments

### Phase 3: Match Management
- [ ] Score entry system
- [ ] Automatic standings calculation
- [ ] Match history tracking
- [ ] Player statistics

### Phase 4: Enhanced Features
- [ ] Email notifications
- [ ] Payment integration
- [ ] Mobile app
- [ ] Tournament brackets
- [ ] Player ratings system

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npx prisma studio` - Open Prisma Studio (database GUI)
- `npx prisma migrate dev` - Create and apply migrations
- `npx prisma generate` - Generate Prisma client

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - feel free to use this project for your own racquetball league!

## Support

For issues or questions, please open an issue on GitHub.
