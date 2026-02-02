# Growzzy OS - Authentication System

Complete authentication system built with **Supabase Auth**, **Next.js**, and proper security best practices.

## Features

✅ **Secure Authentication**
- Password hashing with bcrypt (managed by Supabase)
- Secure HTTP-only cookies for session management
- Protected routes with middleware

✅ **User Management**
- User registration with email verification
- User login with email and password
- User logout with session cleanup
- Dashboard to view user profile

✅ **Security**
- Environment variables for sensitive data
- Parameterized queries to prevent SQL injection
- Secure middleware for route protection
- HTTP-only cookies (cannot be accessed via JavaScript)

## Getting Started

### 1. Environment Variables

Add these environment variables to your project:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NEXTAUTH_SECRET=your_nextauth_secret_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2. Authentication Pages

**Sign Up:** `/auth/signup`
- Create a new account
- Email validation
- Password strength requirements (minimum 8 characters)

**Login:** `/auth/login`
- Sign in with email and password
- Secure session creation

**Dashboard:** `/dashboard` (Protected)
- View your profile information
- See your user ID and email
- Logout button

### 3. API Routes

- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Sign in user
- `POST /api/auth/logout` - Sign out user

### 4. How It Works

1. **User Registration**
   - User submits email, password, and name
   - Password is hashed by Supabase Auth
   - User account is created in Supabase
   - Redirected to login page

2. **User Login**
   - User submits email and password
   - Credentials verified against Supabase
   - Session tokens stored in HTTP-only cookies
   - User redirected to dashboard

3. **Protected Routes**
   - Middleware checks for `sb-access-token` cookie
   - If not authenticated, redirect to login
   - If authenticated, allow access to dashboard

4. **User Logout**
   - HTTP-only cookies cleared
   - Session terminated
   - User redirected to login page

## File Structure

```
/app
  /auth
    /login/page.tsx       - Login page
    /signup/page.tsx      - Sign up page
  /dashboard/page.tsx     - Protected dashboard
  /api/auth
    /login/route.ts       - Login API endpoint
    /signup/route.ts      - Signup API endpoint
    /logout/route.ts      - Logout API endpoint
/lib
  /supabase.ts           - Supabase client initialization
/middleware.ts           - Authentication middleware
```

## Testing

1. **Sign Up**
   - Go to `/auth/signup`
   - Create a new account
   - You'll be redirected to login

2. **Login**
   - Go to `/auth/login`
   - Enter your credentials
   - You'll see the dashboard with your profile

3. **Access Protected Route**
   - Try going to `/dashboard` without logging in
   - You'll be redirected to login page

4. **Logout**
   - Click "Logout" on the dashboard
   - You'll be logged out and redirected to login

## Security Best Practices

- ✅ Passwords hashed with bcrypt
- ✅ Sessions stored in HTTP-only cookies
- ✅ CSRF protection via SameSite cookies
- ✅ Environment variables for secrets
- ✅ Middleware for route protection
- ✅ Input validation on signup/login
- ✅ Error messages don't reveal if account exists

## Next Steps

1. Connect this authentication to your database
2. Add user profile pages
3. Implement password reset functionality
4. Add email verification
5. Implement 2FA (Two-Factor Authentication)
6. Add social login (Google, GitHub, etc.)
