# Production Deployment Guide

## Database Setup

### Option 1: Vercel + Vercel PostgreSQL
1. Deploy to Vercel
2. Add Vercel PostgreSQL addon
3. Update `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("POSTGRES_PRISMA_URL")
   }
   ```
4. Run migrations: `npx prisma db push`

### Option 2: Railway
1. Create PostgreSQL database on Railway
2. Copy connection string
3. Update schema provider to `postgresql`
4. Set `DATABASE_URL` environment variable
5. Run migrations

### Option 3: Supabase
1. Create new project on Supabase
2. Get PostgreSQL connection string
3. Update schema and environment variables
4. Run migrations

## Environment Variables for Production

Required for production deployment:

```env
# Database
DATABASE_URL="postgresql://user:password@host:port/database"

# NextAuth
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-super-secret-key-here

# Email Configuration (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@your-domain.com
```

## Pre-deployment Checklist

- [ ] Database configured for PostgreSQL
- [ ] Environment variables set in hosting provider
- [ ] NEXTAUTH_SECRET generated (use: `openssl rand -base64 32`)
- [ ] NEXTAUTH_URL set to production domain
- [ ] Terms of Service and Privacy Policy pages added
- [ ] Email SMTP configured (optional)

## Post-deployment

1. Run database migrations
2. Seed initial admin user
3. Test core user flows
4. Set up monitoring