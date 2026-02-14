# Environment Variables Setup Guide

This file documents all required environment variables for Foodedo. Create a `.env.local` file in the root directory with these values.

## Required Environment Variables

### Convex (Backend Database & Real-time Sync)

```bash
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
```

**Where to get:** [Convex Dashboard](https://dashboard.convex.dev)

- Sign in to Convex
- Select your deployment
- Copy the deployment URL

---

### Clerk (Authentication)

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_JWT_ISSUER_DOMAIN=your-clerk-domain.clerk.accounts.dev
```

**Where to get:** [Clerk Dashboard](https://dashboard.clerk.com)

1. **Publishable Key:**
   - Go to API Keys in your Clerk dashboard
   - Copy "Publishable Key"

2. **Secret Key:**
   - Same location as above
   - Copy "Secret Key"
   - ⚠️ Keep this secret! Never commit to git

3. **JWT Issuer Domain:**
   - Go to JWT Templates in Clerk dashboard
   - Find or create "convex" template
   - Copy the issuer domain (looks like: `your-app.clerk.accounts.dev`)
   - This must match your Convex auth configuration

---

### OpenAI (AI Recipe Import)

```bash
OPENAI_API_KEY=sk-...
```

**Where to get:** [OpenAI Platform](https://platform.openai.com/api-keys)

- Create an account or sign in
- Navigate to API Keys
- Create a new secret key
- ⚠️ Copy immediately - you won't see it again!

**Usage:** Used for AI-powered recipe parsing and import from URLs and text

---

### Email Configuration (Contact Form)

```bash
CONTACT_EMAIL_ADDRESS=support@your-domain.com
HOSTINGER_CONTACT_EMAIL=your-email@your-domain.com
HOSTINGER_CONTACT_PASSWORD=your-email-password
```

**Where to get:**

1. **CONTACT_EMAIL_ADDRESS:** The email where you want to receive contact form submissions

2. **HOSTINGER_CONTACT_EMAIL & PASSWORD:**
   - Your SMTP email credentials
   - If using Hostinger: Get from your email account settings
   - If using another provider: Update the SMTP configuration in `convex/contact.ts`

**Alternative Email Providers:**

- Gmail: Use app-specific password with SMTP settings
- SendGrid: Use API key instead
- Resend: Modern email API (recommended alternative)

---

## Deployment Variables

These are automatically set by Vercel:

```bash
VERCEL_URL          # Automatically set by Vercel
NODE_ENV            # production, development, or test
```

---

## Example `.env.local` File

Create this file in your project root:

```bash
# Convex
NEXT_PUBLIC_CONVEX_URL=https://happy-example-123.convex.cloud

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_abc123...
CLERK_SECRET_KEY=sk_test_xyz789...
CLERK_JWT_ISSUER_DOMAIN=my-kitchen-sync.clerk.accounts.dev

# OpenAI
OPENAI_API_KEY=sk-proj-abc123...

# Email
CONTACT_EMAIL_ADDRESS=support@kitchen-sync-app.com
HOSTINGER_CONTACT_EMAIL=hello@kitchen-sync-app.com
HOSTINGER_CONTACT_PASSWORD=your-secure-password-here
```

---

## Security Best Practices

1. ✅ **Never commit `.env.local` to git** (already in `.gitignore`)
2. ✅ Use different keys for development and production
3. ✅ Rotate keys periodically
4. ✅ Use environment variables in Vercel dashboard for production
5. ✅ Restrict API key permissions where possible

---

## Vercel Deployment Setup

When deploying to Vercel:

1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add each variable listed above
4. Select appropriate environments (Production, Preview, Development)
5. Save and redeploy

---

## Convex Deployment Setup

Environment variables for Convex are set separately:

```bash
npx convex env set CLERK_JWT_ISSUER_DOMAIN "your-domain.clerk.accounts.dev"
```

Required Convex environment variables:

- `CLERK_JWT_ISSUER_DOMAIN`
- `CONTACT_EMAIL_ADDRESS`
- `HOSTINGER_CONTACT_EMAIL`
- `HOSTINGER_CONTACT_PASSWORD`
- `OPENAI_API_KEY`

---

## Testing Your Setup

To verify everything is configured correctly:

1. ✅ Authentication: Try signing up/in
2. ✅ Recipe creation: Create a new recipe
3. ✅ AI Import: Import a recipe from a URL
4. ✅ Contact form: Send a test message
5. ✅ Household features: Create a household and invite someone

---

## Troubleshooting

**"Missing NEXT_PUBLIC_CONVEX_URL" error:**

- Check `.env.local` exists in project root
- Verify the variable name is exact
- Restart your dev server after adding variables

**Clerk authentication not working:**

- Verify both publishable and secret keys are set
- Check JWT issuer domain matches your Clerk setup
- Ensure Convex is configured with the same JWT issuer

**Contact form not sending:**

- Verify all email variables are set
- Check SMTP credentials are correct
- Look for errors in Convex dashboard logs

**AI import not working:**

- Verify OpenAI API key is valid
- Check you have credits in your OpenAI account
- Ensure key has permissions for chat completions

---

## Need Help?

- Convex: [docs.convex.dev](https://docs.convex.dev)
- Clerk: [clerk.com/docs](https://clerk.com/docs)
- OpenAI: [platform.openai.com/docs](https://platform.openai.com/docs)
