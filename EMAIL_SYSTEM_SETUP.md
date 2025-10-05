# Email System Configuration Guide

## Environment Variables

Add these to your `.env` file or Docker Compose environment:

```bash
# SMTP Configuration
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
FROM_EMAIL=your-email@gmail.com
FROM_NAME=NovaOS

# File Upload Configuration
UPLOAD_PATH=/app/uploads
MAX_FILE_SIZE=10485760

# Core API URL
CORE_API_URL=http://core-api:9760
```

## Gmail Setup

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password**:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate password for "NovaOS"
   - Use this password as `SMTP_PASSWORD`

## Alternative Email Providers

### SendGrid

```bash
SMTP_SERVER=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USERNAME=apikey
SMTP_PASSWORD=your-sendgrid-api-key
```

### Mailgun

```bash
SMTP_SERVER=smtp.mailgun.org
SMTP_PORT=587
SMTP_USERNAME=your-mailgun-username
SMTP_PASSWORD=your-mailgun-password
```

### AWS SES

```bash
SMTP_SERVER=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USERNAME=your-ses-username
SMTP_PASSWORD=your-ses-password
```

## Features Implemented

✅ **Password Reset Emails**

- Secure token generation
- 1-hour expiry
- HTML + text templates
- Success confirmation emails

✅ **File Upload System**

- Profile image uploads
- Vault content uploads
- Document uploads
- Security validation
- File type restrictions

✅ **Profile Management**

- Complete profile editing
- Avatar upload/delete
- Password change with email notification
- Real-time form validation

✅ **Vault System**

- Real database integration
- Purchase processing
- Balance management
- Transaction history

## Docker Compose Updates

Add volume mounts for file uploads:

```yaml
services:
  core-api:
    environment:
      SMTP_SERVER: ${SMTP_SERVER:-smtp.gmail.com}
      SMTP_PORT: ${SMTP_PORT:-587}
      SMTP_USERNAME: ${SMTP_USERNAME}
      SMTP_PASSWORD: ${SMTP_PASSWORD}
      FROM_EMAIL: ${FROM_EMAIL}
      FROM_NAME: ${FROM_NAME:-NovaOS}
      UPLOAD_PATH: /app/uploads
      MAX_FILE_SIZE: ${MAX_FILE_SIZE:-10485760}
    volumes:
      - ./uploads:/app/uploads
```

## Production Checklist

- [ ] Configure production SMTP provider
- [ ] Set up SSL certificates for file uploads
- [ ] Configure backup for uploaded files
- [ ] Set up email monitoring/logging
- [ ] Test all email templates
- [ ] Configure proper file permissions
- [ ] Set up CDN for file serving (optional)

## Security Notes

1. **Email Security**: Never commit SMTP credentials to version control
2. **File Upload Security**: All uploads are validated and scanned
3. **Profile Security**: Password changes send notification emails
4. **Token Security**: Password reset tokens expire in 1 hour

## Testing

Test email functionality:

```bash
curl -X POST http://localhost:9760/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

Test file upload:

```bash
curl -X POST http://localhost:9760/api/upload/profile-image \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@profile.jpg"
```

## Troubleshooting

**Email not sending?**

- Check SMTP credentials
- Verify firewall allows port 587
- Check Gmail app password is correct

**File uploads failing?**

- Check upload directory permissions
- Verify MAX_FILE_SIZE setting
- Check disk space

**Database errors?**

- Run database migrations: `invoke db_init`
- Check PostgreSQL connection
- Verify table creation
