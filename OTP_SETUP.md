# Email and OTP System Setup Guide

This guide explains how to set up and use the email and OTP (One-Time Password) system in the backend.

## Features

- ✅ Request OTP via email
- ✅ Verify OTP for login
- ✅ Resend OTP
- ✅ Rate limiting (prevents spam)
- ✅ OTP expiration (10 minutes)
- ✅ Maximum verification attempts (5 attempts)
- ✅ Support for multiple purposes (login, register, password-reset, email-verification)

## API Endpoints

### 1. Request OTP
**POST** `/api/users/otp/request`

Request body:
```json
{
  "email": "user@example.com",
  "purpose": "login" // Optional: "login" | "register" | "password-reset" | "email-verification"
}
```

Response:
```json
{
  "success": true,
  "message": "OTP sent successfully to your email",
  "data": {
    "email": "user@example.com",
    "purpose": "login",
    "expiresIn": 600,
    "otp": "123456" // Only in development mode
  }
}
```

### 2. Verify OTP
**POST** `/api/users/otp/verify`

Request body:
```json
{
  "email": "user@example.com",
  "otp": "123456",
  "purpose": "login" // Optional
}
```

Response:
```json
{
  "success": true,
  "message": "OTP verified successfully",
  "data": {
    "email": "user@example.com",
    "purpose": "login",
    "verified": true
  }
}
```

### 3. Resend OTP
**POST** `/api/users/otp/resend`

Same as request OTP endpoint.

### 4. Login with OTP
**POST** `/api/users/login`

Request body:
```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

Or with password:
```json
{
  "email": "user@example.com",
  "password": "yourpassword"
}
```

## Environment Variables

Add these to your `.env` file:

```env
# Email Configuration (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM_NAME=Your App Name
```

### Setting up Gmail SMTP

1. Go to your Google Account settings
2. Enable 2-Step Verification
3. Go to Security > 2-Step Verification > App passwords
4. Generate an app password for "Mail"
5. Use this app password (not your regular password) as `SMTP_PASS`

### Alternative Email Services

#### SendGrid
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
```

#### AWS SES
```env
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=your-aws-access-key
SMTP_PASS=your-aws-secret-key
```

## Development Mode

If email service is not configured, the system will:
- Still generate and store OTPs
- Return the OTP in the API response (for testing)
- Log a warning message

This allows you to test the OTP system without setting up email first.

## Usage Flow

### Login with OTP Flow:

1. **Request OTP:**
   ```bash
   POST /api/users/otp/request
   {
     "email": "user@example.com",
     "purpose": "login"
   }
   ```

2. **User receives OTP via email**

3. **Login with OTP:**
   ```bash
   POST /api/users/login
   {
     "email": "user@example.com",
     "otp": "123456"
   }
   ```

### Registration with OTP Flow:

1. **Request OTP:**
   ```bash
   POST /api/users/otp/request
   {
     "email": "user@example.com",
     "purpose": "register"
   }
   ```

2. **Verify OTP:**
   ```bash
   POST /api/users/otp/verify
   {
     "email": "user@example.com",
     "otp": "123456",
     "purpose": "register"
   }
   ```

3. **Register user:**
   ```bash
   POST /api/users/register
   {
     "name": "John Doe",
     "email": "user@example.com",
     "password": "securepassword"
   }
   ```

## Security Features

- **OTP Expiration:** OTPs expire after 10 minutes
- **Single Use:** Each OTP can only be used once
- **Rate Limiting:** Can't request new OTP within 1 minute of previous request
- **Attempt Limiting:** Maximum 5 verification attempts per OTP
- **Auto-cleanup:** Expired OTPs are automatically deleted from database

## Database Schema

The OTP model includes:
- `email`: User's email address
- `otp`: 6-digit OTP code
- `purpose`: Purpose of OTP (login, register, etc.)
- `expiresAt`: Expiration timestamp
- `isUsed`: Whether OTP has been used
- `attempts`: Number of verification attempts

## Testing

In development mode, you can test without email configuration:
1. Request OTP - you'll receive the OTP in the API response
2. Use that OTP to verify/login
3. Check server logs for any email-related warnings

## Troubleshooting

### Email not sending?
- Check SMTP credentials in `.env`
- Verify SMTP_HOST and SMTP_PORT are correct
- For Gmail, ensure you're using an App Password, not regular password
- Check server logs for detailed error messages

### OTP not working?
- Ensure OTP hasn't expired (10 minutes)
- Check if OTP has already been used
- Verify you haven't exceeded 5 verification attempts
- Make sure you're using the most recent OTP

### Rate limiting?
- Wait 1 minute between OTP requests
- Check the `retryAfter` field in error response
