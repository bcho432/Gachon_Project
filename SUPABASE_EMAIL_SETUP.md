# Supabase Email Verification Setup Guide

## Problem Description
When users sign up for an account, the account is created successfully but email verification shows an error. This happens because the email verification process is not properly configured in your Supabase project.

## Root Causes
1. **Missing Site URL Configuration**: Supabase needs to know where to redirect users after email verification
2. **Email Template Issues**: Default email templates may not be properly configured
3. **Redirect URL Mismatch**: The redirect URL in your app doesn't match what's configured in Supabase

## Solution Steps

### 1. Configure Site URL in Supabase Dashboard

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Authentication** → **Settings**
4. In the **Site URL** field, enter your application's URL:
   - For development: `http://localhost:3000`
   - For production: `https://yourdomain.com`
5. Click **Save**

### 2. Configure Email Templates

1. In the same Authentication Settings page
2. Go to **Email Templates** tab
3. Configure the **Confirm signup** template:
   - **Subject**: `Confirm your email address`
   - **Content**: You can customize the email content or use the default
   - **Action URL**: `{{ .SiteURL }}/auth/callback`
4. Configure the **Reset password** template:
   - **Subject**: `Reset your password`
   - **Content**: You can customize the email content or use the default
   - **Action URL**: `{{ .SiteURL }}/auth/reset-password/callback`

### 3. Configure Redirect URLs

1. In Authentication Settings, go to **URL Configuration**
2. Add these URLs to the **Redirect URLs** list:
   - `http://localhost:3000/auth/callback` (for development)
   - `http://localhost:3000/auth/reset-password/callback` (for development)
   - `https://yourdomain.com/auth/callback` (for production)
   - `https://yourdomain.com/auth/reset-password/callback` (for production)
   - `http://localhost:3000` (for development)
   - `https://yourdomain.com` (for production)

### 4. Email Provider Configuration

1. In Authentication Settings, go to **Email Auth**
2. Make sure **Enable email confirmations** is checked
3. Make sure **Enable password reset** is checked
4. Configure your email provider:
   - **SMTP Host**: Your SMTP server (e.g., Gmail, SendGrid)
   - **SMTP Port**: Usually 587 or 465
   - **SMTP User**: Your email username
   - **SMTP Pass**: Your email password or app password
   - **Sender Name**: Your application name
   - **Sender Email**: Your verified sender email

### 5. Test the Configuration

1. Try signing up with a new email address
2. Check if the verification email is received
3. Click the verification link
4. Verify that you're redirected to your application and can sign in
5. Test password reset functionality:
   - Click "Forgot your password?" on the login form
   - Enter your email address
   - Check for the password reset email
   - Click the reset link and set a new password

## Common Issues and Solutions

### Issue: "Invalid redirect URL" error
**Solution**: Make sure the redirect URL in your Supabase settings matches exactly with what's configured in your app.

### Issue: Email not received
**Solution**: 
- Check spam folder
- Verify SMTP settings
- Check if the email address is already registered

### Issue: Verification link doesn't work
**Solution**: 
- Ensure the auth callback route is properly set up
- Check that the redirect URL is correctly configured
- Verify the email template action URL

### Issue: Password reset link doesn't work
**Solution**:
- Ensure the password reset callback route is properly set up
- Check that the redirect URL is correctly configured
- Verify the password reset email template action URL

### Issue: Account created but can't sign in
**Solution**: 
- Check if email verification is required in your Supabase settings
- Verify that the user's email is confirmed in the Supabase dashboard

### Issue: Password reset email not sent
**Solution**:
- Check if password reset is enabled in Supabase settings
- Verify SMTP configuration
- Check Supabase logs for email sending errors

## Additional Configuration

### Environment Variables
Make sure your `.env` file has the correct Supabase configuration:

```env
REACT_APP_SUPABASE_URL=https://your-project-id.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key-here
```

### Optional: Disable Email Confirmation (Not Recommended)
If you want to skip email verification for testing:

1. Go to Authentication Settings
2. Uncheck **Enable email confirmations**
3. **Note**: This is not recommended for production

### Optional: Disable Password Reset (Not Recommended)
If you want to disable password reset for testing:

1. Go to Authentication Settings
2. Uncheck **Enable password reset**
3. **Note**: This is not recommended for production

## Monitoring and Debugging

### Check Supabase Logs
1. Go to your Supabase Dashboard
2. Navigate to **Logs** → **Auth**
3. Look for authentication events and errors

### Browser Console
Check the browser console for any JavaScript errors during the signup or password reset process.

### Network Tab
Monitor the network requests to see if the email verification and password reset requests are being made correctly.

## Support
If you continue to have issues:
1. Check the Supabase documentation: https://supabase.com/docs/guides/auth
2. Contact Supabase support
3. Email: gachonhelper018@gmail.com or sungguri@gachon.ac.kr 