# CV Manager for Professors

A comprehensive web application designed specifically for professors to manage their academic CVs with advanced features including points calculation, admin oversight, and secure authentication.

## Overview

This application allows professors to create, edit, and maintain their academic CVs with automatic points calculation based on their academic achievements. The system includes intellectual and professional scoring, year-based filtering, and comprehensive admin management capabilities.

## Key Features

### For Professors
- **Secure Authentication**: Email/password signup with email verification
- **Password Reset**: Forgot password functionality with email verification
- **Comprehensive CV Management**: All academic sections with rich data entry
- **Points System**: Automatic calculation of intellectual and professional scores
- **Year Filtering**: Filter CV items by year range for targeted analysis
- **Professional Printing**: Formatted CV printing with custom layouts
- **Real-time Saving**: Automatic data persistence to secure database

### For Administrators
- **Admin Dashboard**: View and manage all professor CVs
- **Points Monitoring**: Track academic performance across all users
- **CV History**: View version history and changes
- **User Management**: Add/remove admin privileges
- **Archive System**: Archive old CV data for historical records
- **Advanced Analytics**: Comprehensive reporting and statistics

## Tech Stack

- **Frontend**: React 18, Tailwind CSS, React Router v6
- **Backend**: Supabase (PostgreSQL + Auth + Real-time)
- **UI Components**: Lucide React Icons, React Hot Toast
- **Print**: React-to-Print with custom styling
- **State Management**: React Context API
- **Database**: PostgreSQL with Row Level Security

## Setup Instructions

### 1. Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Supabase account

### 2. Supabase Project Setup

1. Go to [https://supabase.com](https://supabase.com) and create an account
2. Create a new project
3. Note your project URL and anon/public API key
4. Configure authentication settings:
   - Go to Authentication → Settings
   - Enable Email/Password sign-in
   - Enable email confirmations
   - Enable password reset
   - Set Site URL (e.g., `http://localhost:3000` for development)
   - Add redirect URLs: `http://localhost:3000/auth/callback` and `http://localhost:3000/auth/reset-password/callback`

### 3. Database Setup

Run the following SQL commands in your Supabase SQL Editor:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create the CVs table
CREATE TABLE cvs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  education JSONB,
  academic_employment JSONB,
  teaching JSONB,
  publications_research JSONB,
  publications_books JSONB,
  conference_presentations JSONB,
  professional_service JSONB,
  internal_activities JSONB,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create points system tables
CREATE TABLE points_config (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  section_name TEXT UNIQUE NOT NULL,
  points_per_item INTEGER DEFAULT 0,
  max_points INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE admin_users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  is_primary_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE cvs ENABLE ROW LEVEL SECURITY;
ALTER TABLE points_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Policies for CVs table
CREATE POLICY "Own CV access" ON cvs
FOR SELECT, UPDATE, INSERT USING (auth.uid() = user_id);

CREATE POLICY "Admin CV access" ON cvs
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = auth.uid()
  )
);

-- Policies for points_config table
CREATE POLICY "Admin points config access" ON points_config
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = auth.uid()
  )
);

-- Policies for admin_users table
CREATE POLICY "Admin users access" ON admin_users
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = auth.uid()
  )
);
```

### 4. Environment Configuration

Create a `.env` file in the root directory:

```env
REACT_APP_SUPABASE_URL=your_supabase_project_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 5. Install Dependencies

```bash
npm install
```

### 6. Start Development Server

```bash
npm start
```

## Authentication Features

### Email Verification
- Secure signup process with email verification
- Automatic redirect handling for verification links
- User-friendly error messages and instructions

### Password Reset
- "Forgot Password" functionality
- Secure email-based password reset
- Token-based verification system
- Automatic redirect to password reset form

### Security
- Row Level Security (RLS) for data protection
- Admin-only access to sensitive operations
- Secure session management
- CSRF protection

## Points System

The application automatically calculates academic points based on:

### Intellectual Score
- Research publications
- Books published
- Education achievements
- Conference presentations

### Professional Score
- Teaching experience
- Professional service
- Internal activities at the institution

### Features
- Real-time calculation
- Year-based filtering
- Historical tracking
- Admin oversight

## Admin Features

### User Management
- Add/remove admin privileges
- Primary admin designation
- User access control

### CV Management
- View all professor CVs
- Search and filter capabilities
- Print functionality
- Version history tracking

### System Administration
- Points configuration
- Archive management
- Performance monitoring
- Data export capabilities

## Project Structure

```
src/
├── components/
│   ├── AuthForm.js              # Login/Signup form
│   ├── AuthCallback.js          # Email verification callback
│   ├── PasswordResetForm.js     # Password reset form
│   ├── PasswordResetCallback.js # Password reset callback
│   ├── CVForm.js                # Main CV editing form
│   ├── UserDashboard.js         # User dashboard with points
│   ├── AdminView.js             # Admin dashboard
│   ├── AdminManager.js          # Admin user management
│   ├── ArchiveManager.js        # Archive functionality
│   ├── PointsManager.js         # Points management
│   └── Navigation.js            # Navigation bar
├── contexts/
│   └── AuthContext.js           # Authentication context
├── utils/
│   ├── adminConfig.js           # Admin configuration
│   ├── pointsManager.js         # Points calculation
│   ├── archiveManager.js        # Archive utilities
│   └── sessionUtils.js          # Session management
├── supabase.js                  # Supabase client config
├── App.js                       # Main app component
└── index.js                     # App entry point
```

## CV Sections

The comprehensive CV form includes:

- **Personal Information**: Name, contact details, address
- **Education**: Degrees, institutions, years, fields of study
- **Academic Employment**: Positions, institutions, dates, current status
- **Teaching Experience**: Courses, institutions, years, descriptions
- **Research Publications**: Articles, journals, years, authors, DOIs
- **Books**: Titles, publishers, years, authors, ISBNs
- **Conference Presentations**: Titles, conferences, years, locations, types
- **Professional Service**: Roles, organizations, years, descriptions
- **Internal Activities**: Institutional positions and activities

## Deployment

### Vercel (Recommended)
1. Push code to GitHub
2. Connect repository to Vercel
3. Add environment variables in Vercel dashboard
4. Configure build settings
5. Deploy

### Netlify
1. Push code to GitHub
2. Connect repository to Netlify
3. Add environment variables in Netlify dashboard
4. Configure build settings
5. Deploy

## Troubleshooting

### Common Issues
- **Email verification not working**: Check Supabase email settings and redirect URLs
- **Password reset failing**: Verify SMTP configuration and email templates
- **Admin access denied**: Ensure admin user is properly configured in database
- **Points not calculating**: Check points configuration in admin panel

### Support
For technical support, contact:
- Email: gachonhelper018@gmail.com
- Email: sungguri@gachon.ac.kr

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Built for Gachon University professors
- Powered by Supabase for backend services
- Styled with Tailwind CSS for modern UI
- Icons provided by Lucide React 