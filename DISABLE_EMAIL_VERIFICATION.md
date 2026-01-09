# How to Disable Email Verification in Supabase

## Quick Steps (Takes 30 seconds)

1. **Go to Supabase Dashboard**
   - Log in to https://supabase.com/dashboard
   - Select your project

2. **Navigate to Authentication Settings**
   - Click **Authentication** in the left sidebar
   - Click **Settings** tab

3. **Disable Email Confirmation**
   - Find **"Enable email confirmations"**
   - **Uncheck the box**
   - Click **Save**

4. **Done!**
   - Users can now sign up without email verification
   - No emails will be sent
   - No rate limits!

## What This Changes

### Before (Email Verification Enabled)
- User signs up → Email sent → User clicks link → Can sign in
- Rate limits apply
- More secure

### After (Email Verification Disabled)
- User signs up → Can sign in immediately
- No emails sent
- No rate limits
- Less secure (but fine for internal apps)

## Important Notes

⚠️ **Security Trade-off**: Users can sign up with any email address (no verification)

✅ **Good For**:
- Internal/private applications
- Testing and development
- Trusted user base only

❌ **Not Recommended For**:
- Public-facing applications
- Production apps with untrusted users
- Apps requiring email verification

## Your App Will Still Work

- ✅ Email is still stored in database
- ✅ Email is still available via `user.email`
- ✅ All your code works the same
- ✅ Users can still sign in
- ✅ Everything functions normally

## To Re-enable Later

Just go back to the same settings and check the box again!





