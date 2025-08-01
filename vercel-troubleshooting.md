# Vercel Deployment Troubleshooting Guide

## Issue: Can't Sign Out on Production (Vercel) but Works on Localhost

### Possible Causes:

1. **Missing Environment Variables in Vercel**
2. **Supabase Configuration Issues**
3. **CORS/Network Issues**
4. **Session Management Problems**

### Step 1: Check Vercel Environment Variables

1. Go to your Vercel dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Verify these variables are set:
   - `REACT_APP_SUPABASE_URL`
   - `REACT_APP_SUPABASE_ANON_KEY`

### Step 2: Check Browser Console

1. Open your production site
2. Press F12 to open developer tools
3. Go to **Console** tab
4. Look for error messages like:
   - "Missing Supabase environment variables"
   - "Sign out error"
   - Network errors

### Step 3: Verify Supabase Configuration

1. Go to your Supabase dashboard
2. Go to **Settings** → **API**
3. Copy the **Project URL** and **anon public** key
4. Make sure these match your Vercel environment variables

### Step 4: Test Environment Variables

Add this to your component temporarily to debug:

```javascript
console.log('Supabase URL:', process.env.REACT_APP_SUPABASE_URL)
console.log('Supabase Key:', process.env.REACT_APP_SUPABASE_ANON_KEY ? 'Set' : 'Missing')
```

### Step 5: Redeploy with Fresh Environment

1. In Vercel dashboard, go to **Deployments**
2. Find your latest deployment
3. Click the three dots menu
4. Select **Redeploy**

### Step 6: Check Supabase Auth Settings

1. Go to Supabase dashboard
2. Go to **Authentication** → **Settings**
3. Check **Site URL** matches your Vercel domain
4. Add your Vercel domain to **Redirect URLs**

### Common Solutions:

1. **Environment Variables**: Make sure they're set in Vercel
2. **Redeploy**: Force a fresh deployment
3. **Clear Browser Cache**: Try incognito mode
4. **Check Network**: Ensure no CORS issues

### Debug Steps:

1. Check browser console for errors
2. Verify environment variables in Vercel
3. Test with a fresh browser session
4. Check Supabase logs for auth errors 