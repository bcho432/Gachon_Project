# SMTP Setup Guide for Supabase

## SendGrid SMTP Configuration

### Step 1: Get Your SendGrid Credentials

1. **SMTP Host**: `smtp.sendgrid.net`
2. **SMTP Port**: `587` (for TLS) or `465` (for SSL)
3. **SMTP Username**: `apikey` (literally the word "apikey")
4. **SMTP Password**: Your SendGrid API Key (from Step 2)
5. **Sender Email**: The email you verified in SendGrid
6. **Sender Name**: `CV Manager` (or your app name)

### Step 2: Configure in Supabase Dashboard

1. Go to **Project Settings** → **Authentication** → **SMTP Settings**
2. **Enable Custom SMTP**: Toggle ON
3. Enter the following:

```
SMTP Host: smtp.sendgrid.net
SMTP Port: 587
SMTP User: apikey
SMTP Pass: [Your SendGrid API Key]
Sender Name: CV Manager
Sender Email: [Your verified email]
```

4. Click **Save**

### Step 3: Test the Configuration

1. Try signing up a new user
2. Check if the verification email is received
3. Check SendGrid dashboard for email delivery status

## Alternative: Mailgun Setup

If you prefer Mailgun:

1. **SMTP Host**: `smtp.mailgun.org`
2. **SMTP Port**: `587`
3. **SMTP Username**: Your Mailgun SMTP username
4. **SMTP Password**: Your Mailgun SMTP password
5. **Sender Email**: Your verified domain email

## Troubleshooting

### Email not sending?
- Check SendGrid dashboard for delivery logs
- Verify your API key is correct
- Make sure sender email is verified
- Check spam folder

### Still getting rate limits?
- Make sure custom SMTP is enabled
- Verify SMTP credentials are correct
- Check SendGrid dashboard for any errors

## Free Tier Limits

- **SendGrid**: 100 emails/day
- **Mailgun**: 5,000 emails/month
- **Resend**: 3,000 emails/month (recommended for Supabase)

## Recommended: Resend (Easiest for Supabase)

Resend has the easiest Supabase integration:

1. Sign up at https://resend.com
2. Get your API key
3. Use these settings:
   - **SMTP Host**: `smtp.resend.com`
   - **SMTP Port**: `587`
   - **SMTP User**: `resend`
   - **SMTP Pass**: Your Resend API key
   - **Sender Email**: Your verified domain


