# CV Manager Web App

A modern web application for professors to manage their CVs with admin oversight capabilities.

## Features

- **User Authentication**: Secure login/signup with Supabase Auth
- **CV Management**: Comprehensive CV form with all academic sections
- **Admin Dashboard**: View all CVs and print functionality
- **Row Level Security**: Each professor sees only their own CV
- **Modern UI**: Beautiful, responsive design with Tailwind CSS
- **Print Support**: Professional CV printing with formatted layout

## Tech Stack

- **Frontend**: React 18, Tailwind CSS, React Router
- **Backend**: Supabase (PostgreSQL + Auth)
- **UI Components**: Lucide React Icons, React Hot Toast
- **Print**: React-to-Print

## Setup Instructions

### 1. Supabase Setup

1. Go to [https://supabase.com](https://supabase.com) and create an account
2. Create a new project
3. Note your project URL and anon/public API key
4. Go to 'Authentication' > Enable Email/Password sign-in

### 2. Database Setup

In the Supabase SQL Editor, run the following commands:

```sql
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
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE cvs ENABLE ROW LEVEL SECURITY;

-- Policy for professors (own CV access)
CREATE POLICY "Own CV access" ON cvs
FOR SELECT, UPDATE, INSERT USING (auth.uid() = user_id);

-- Policy for admin (replace 'your-dad-user-id' with actual UUID)
CREATE POLICY "Admin access" ON cvs
FOR ALL USING (auth.uid() = 'your-dad-user-id');
```

### 3. Environment Variables

Create a `.env` file in the root directory:

```env
REACT_APP_SUPABASE_URL=your_supabase_project_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Install Dependencies

```bash
npm install
```

### 5. Start Development Server

```bash
npm start
```

## Admin Setup

To set up admin access for your dad:

1. Have your dad create an account through the signup form
2. Go to Supabase Dashboard > Authentication > Users
3. Find your dad's user record and copy the UUID
4. Replace `'your-dad-user-id'` in the SQL policy above with the actual UUID
5. Update the admin check in `src/components/Navigation.js` and `src/App.js`

## Project Structure

```
src/
├── components/
│   ├── AuthForm.js          # Login/Signup form
│   ├── CVForm.js            # Main CV editing form
│   ├── AdminView.js         # Admin dashboard
│   └── Navigation.js        # Navigation bar
├── contexts/
│   └── AuthContext.js       # Authentication context
├── supabase.js              # Supabase client config
├── App.js                   # Main app component
├── index.js                 # App entry point
└── index.css                # Global styles
```

## CV Sections

The CV form includes the following sections:

- **Personal Information**: Name, phone, email, address
- **Education**: Degree, institution, year, field of study
- **Academic Employment**: Position, institution, dates, current status
- **Teaching Experience**: Course name, institution, year, description
- **Research Publications**: Title, journal, year, authors, DOI
- **Books**: Title, publisher, year, authors, ISBN
- **Conference Presentations**: Title, conference, year, location, type
- **Professional Service**: Role, organization, year, description

## Features

### For Professors
- Create and edit their CV
- Add multiple entries to each section
- Save automatically to Supabase
- Professional print layout

### For Admin
- View all professor CVs
- Search by name or email
- Print any CV
- See CV statistics (education, positions, publications)

## Deployment

### Vercel (Recommended)
1. Push code to GitHub
2. Connect repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Netlify
1. Push code to GitHub
2. Connect repository to Netlify
3. Add environment variables in Netlify dashboard
4. Deploy

## Security

- Row Level Security ensures professors only see their own CVs
- Admin access is restricted to specific user ID
- All data is stored securely in Supabase
- Authentication handled by Supabase Auth

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License 