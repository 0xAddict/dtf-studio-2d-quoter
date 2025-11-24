# Supabase Email Verification Setup

## 🔧 Fix Verification Not Working

### Step 1: Verify Redirect URLs in Supabase

1. Go to: [Supabase Dashboard](https://supabase.com/dashboard/project/jqfudagohdkdtnplgtob/auth/url-configuration)

2. **Set Site URL:**
   ```
   https://moonlit-faun-a29b39.netlify.app
   ```

3. **Add Redirect URLs (IMPORTANT - add ALL of these):**
   ```
   https://moonlit-faun-a29b39.netlify.app/auth/callback
   https://moonlit-faun-a29b39.netlify.app/*
   http://localhost:5173/auth/callback
   http://localhost:5173/*
   ```

   **Why both formats?** The wildcard (`*`) ensures Supabase accepts the redirect even with query parameters.

4. Click **Save**

### Step 2: Check Email Provider Settings

1. Go to: [Authentication → Providers](https://supabase.com/dashboard/project/jqfudagohdkdtnplgtob/auth/providers)

2. Find **Email** and ensure:
   - ✅ **Enable Email provider** is ON
   - ✅ **Confirm email** is ON
   - ✅ **Secure email change** is OFF (for now)

3. Under **Email Templates**, verify the template is using the correct redirect URL

### Step 3: Test the Flow

1. Open browser console (F12)
2. Sign up with a new email
3. Check console logs - should see:
   ```
   ✅ Sign up successful - verification email sent
   ```
4. Click the link in your email
5. Check console logs - should see:
   ```
   🔄 Auth callback triggered
   ✅ Email verification type detected
   ✅ User refreshed, redirecting to home
   ```

If you see ❌ errors, they will tell you exactly what's wrong!

---

## 🎨 Customize Email Template

### Access Email Templates

1. Go to: [Authentication → Email Templates](https://supabase.com/dashboard/project/jqfudagohdkdtnplgtob/auth/templates)

2. Select **Confirm signup** template

### Custom Email Template

Replace the default template with this styled version:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email - Hexea Forge</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">

          <!-- Header with gradient -->
          <tr>
            <td style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">
                HEXEA FORGE
              </h1>
              <p style="margin: 10px 0 0 0; color: #e0e7ff; font-size: 14px; font-weight: 500;">
                3D Printing Services
              </p>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 40px 30px;">

              <!-- Welcome Message -->
              <h2 style="margin: 0 0 20px 0; color: #1f2937; font-size: 24px; font-weight: 600;">
                Welcome to Hexea Forge! 🎉
              </h2>

              <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                Thank you for signing up! We're excited to have you on board. To get started with uploading models and requesting quotes, please verify your email address.
              </p>

              <!-- Verification Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="{{ .ConfirmationURL }}"
                       style="display: inline-block; background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 10px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(79, 70, 229, 0.3);">
                      Verify Email Address
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Alternative Link -->
              <p style="margin: 30px 0 20px 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                If the button doesn't work, copy and paste this link into your browser:
              </p>
              <p style="margin: 0 0 20px 0; padding: 12px; background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; color: #4f46e5; font-size: 12px; word-break: break-all;">
                {{ .ConfirmationURL }}
              </p>

              <!-- What's Next -->
              <div style="margin: 30px 0; padding: 20px; background-color: #f0f9ff; border-left: 4px solid #4f46e5; border-radius: 8px;">
                <h3 style="margin: 0 0 12px 0; color: #1f2937; font-size: 16px; font-weight: 600;">
                  What's next?
                </h3>
                <ul style="margin: 0; padding-left: 20px; color: #4b5563; font-size: 14px; line-height: 1.8;">
                  <li>Click the verification button above</li>
                  <li>You'll be automatically signed in</li>
                  <li>Upload your 3D models (STL, OBJ, 3MF)</li>
                  <li>Choose materials, finishing, and quantity</li>
                  <li>Get instant pricing and submit quotes</li>
                  <li>Track all your quote history in "My Quotes"</li>
                </ul>
              </div>

              <!-- Security Note -->
              <p style="margin: 20px 0 0 0; color: #9ca3af; font-size: 12px; line-height: 1.6;">
                🔒 This link will expire in 24 hours. If you didn't create an account with Hexea Forge, you can safely ignore this email.
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px; font-weight: 600;">
                Need help?
              </p>
              <p style="margin: 0 0 20px 0; color: #9ca3af; font-size: 13px;">
                If you have any questions, feel free to reply to this email or contact our support team.
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                © 2025 Hexea Forge. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

### Template Variables

Supabase provides these variables you can use:
- `{{ .ConfirmationURL }}` - The verification link
- `{{ .Token }}` - The verification token (use ConfirmationURL instead)
- `{{ .TokenHash }}` - Token hash
- `{{ .SiteURL }}` - Your site URL

### Email Subject

Change the subject line to:
```
Verify your email - Welcome to Hexea Forge! 🎉
```

### Save and Test

1. Click **Save** at the bottom
2. Sign up with a test email
3. Check your inbox - you should see the styled email!

---

## 🧪 Testing Checklist

After making these changes:

- [ ] Redirect URLs configured in Supabase
- [ ] Email provider enabled with "Confirm email" ON
- [ ] Custom email template saved
- [ ] Sign up with test email
- [ ] Email received (check spam folder)
- [ ] Click verification link
- [ ] Browser console shows ✅ success logs
- [ ] Redirected back to app and auto-signed in
- [ ] User menu appears in header
- [ ] Can submit quotes
- [ ] Quote appears in "My Quotes" page

---

## 🐛 Troubleshooting

### "Invalid verification link"
- **Cause:** Wrong redirect URL in Supabase
- **Fix:** Add wildcard URLs: `https://moonlit-faun-a29b39.netlify.app/*`

### Email not arriving
- **Cause:** Supabase rate limiting or spam filters
- **Fix:**
  - Check spam folder
  - Wait 5 minutes between resend attempts
  - Verify email provider is enabled

### Verification link redirects but doesn't sign in
- **Cause:** Session not persisting
- **Fix:**
  - Check browser console for errors
  - Ensure `detectSessionInUrl: true` in Supabase client (already set)
  - Clear browser cache and try again

### Resend button not working
- **Cause:** Supabase rate limiting (60 seconds between requests)
- **Fix:** Wait 60 seconds between resend attempts

---

## 📧 Additional Email Templates to Customize

You can also customize these:

1. **Magic Link** - Passwordless login email
2. **Password Reset** - Reset password email
3. **Email Change** - Confirm email change

All use the same styling and variable system!

---

## 🔐 Security Best Practices

1. **Enable email verification** - ✅ Already done
2. **Use HTTPS only** - ✅ Netlify provides this
3. **Set proper redirect URLs** - ✅ Follow steps above
4. **Rate limiting** - ✅ Supabase handles this
5. **Token expiration** - ✅ 24 hours by default

Your email verification system is production-ready! 🚀
