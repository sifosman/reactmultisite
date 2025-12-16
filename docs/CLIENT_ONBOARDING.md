# Client Onboarding Guide

This guide explains how to set up this e-commerce platform for a new client.

## Quick Start (5 Minutes)

1. **Clone the repository**
   ```bash
   git clone <your-repo-url> client-store
   cd client-store
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Use the Setup Wizard**
   ```bash
   npm run dev
   ```
   Navigate to `http://localhost:3000/setup` and fill in the client's details.

4. **Download and save the generated `.env.local` file** to the project root.

5. **Run Supabase migrations** (see Database Setup below)

6. **Restart the dev server** and the store is ready!

---

## Detailed Setup

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note down:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **Anon Key** (public)
   - **Service Role Key** (secret - keep safe!)

3. Run the database migrations:
   ```bash
   # Using Supabase CLI
   supabase db push
   
   # Or manually run the SQL files in supabase/migrations/
   ```

### 2. Configure Yoco (Customer Payments)

1. Sign up at [developer.yoco.com](https://developer.yoco.com)
2. Get your API keys from the dashboard:
   - **Secret Key** (`sk_live_...`)
   - **Public Key** (`pk_live_...`)
3. Set up a webhook for order notifications

### 3. Configure PayFast (Subscription Billing)

If you're charging clients monthly for using the platform:

1. Sign up at [payfast.co.za](https://www.payfast.co.za)
2. Get your credentials from the dashboard:
   - **Merchant ID**
   - **Merchant Key**
   - **Passphrase** (set in Settings → Integration)
3. Use sandbox mode for testing first

### 4. Customization Options

#### Themes

Choose from 5 built-in themes:

| Theme | Best For |
|-------|----------|
| `default` | General purpose, clean look |
| `luxury` | Premium brands, jewelry, high-end fashion |
| `minimal` | Art, photography, design studios |
| `vibrant` | Fashion, lifestyle, youth brands |
| `natural` | Organic, wellness, eco-friendly products |

Set in `.env.local`:
```
NEXT_PUBLIC_THEME="luxury"
```

#### Currency

Supports any currency:
```
NEXT_PUBLIC_CURRENCY_CODE="ZAR"
NEXT_PUBLIC_CURRENCY_SYMBOL="R"
NEXT_PUBLIC_CURRENCY_LOCALE="en-ZA"
```

#### Shipping

Configure flat-rate shipping (in cents):
```
NEXT_PUBLIC_SHIPPING_FLAT_RATE_CENTS="9900"  # R99.00
NEXT_PUBLIC_FREE_SHIPPING_THRESHOLD_CENTS="50000"  # Free over R500
```

---

## File Structure

```
├── .env.local              # Client configuration (create from setup wizard)
├── .env.example            # Template with all options
├── src/
│   ├── app/
│   │   ├── setup/          # Setup wizard (remove in production)
│   │   ├── admin/          # Admin panel
│   │   └── ...
│   ├── lib/
│   │   ├── config/
│   │   │   ├── site.ts     # Site configuration loader
│   │   │   └── themes.ts   # Theme definitions
│   │   └── ...
│   └── components/
└── supabase/
    └── migrations/         # Database schema
```

---

## Deployment Checklist

- [ ] Clone repository
- [ ] Run setup wizard and download `.env.local`
- [ ] Create Supabase project and run migrations
- [ ] Set up Yoco payment gateway
- [ ] (Optional) Set up PayFast for subscriptions
- [ ] Create admin user in Supabase Auth
- [ ] Set admin role: `UPDATE profiles SET role = 'admin' WHERE email = 'admin@example.com'`
- [ ] Deploy to Vercel/Netlify
- [ ] Update `NEXT_PUBLIC_APP_URL` for production
- [ ] Set up webhook URLs for Yoco and PayFast
- [ ] Remove `/setup` page access in production

---

## Creating an Admin User

1. Create a user in Supabase Auth (Email/Password)
2. Run this SQL to make them an admin:
   ```sql
   UPDATE profiles 
   SET role = 'admin' 
   WHERE id = (SELECT id FROM auth.users WHERE email = 'admin@example.com');
   ```

---

## Subscription Model (For Your Clients)

If you're charging clients monthly to use this platform:

1. Set up PayFast subscription billing
2. Create a subscription plan in your PayFast dashboard
3. The platform tracks subscriptions in the `subscriptions` table
4. Webhook at `/api/subscription/webhook` handles payment notifications

### Subscription Statuses

| Status | Meaning |
|--------|---------|
| `inactive` | Not subscribed |
| `active` | Subscription active |
| `cancelled` | User cancelled |
| `past_due` | Payment failed |

---

## Support

For issues or questions:
- Check the setup wizard at `/setup`
- Review environment variables in `.env.example`
- Check Supabase logs for database errors
- Check browser console for frontend errors

---

## Quick Reference: Environment Variables

### Required
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
YOCO_SECRET_KEY=
NEXT_PUBLIC_YOCO_PUBLIC_KEY=
```

### Branding (All Optional with Defaults)
```
NEXT_PUBLIC_SITE_NAME="My Store"
NEXT_PUBLIC_SITE_TAGLINE="Quality products"
NEXT_PUBLIC_THEME="default"
NEXT_PUBLIC_CURRENCY_SYMBOL="R"
```

### Full list: See `.env.example`
