# MakeFast Form Builder

> **"Build high-converting, logic-based forms in seconds. Zero Speed Impact. Zero Cost."**

A free, advanced Shopify form builder with AI generation, conditional logic, multi-step forms, and zero hosting cost.

## 🚀 Quick Start

### 1. Clone & Install
```bash
git clone https://github.com/your-username/makfast-form-builder.git
cd makfast-form-builder
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` and fill in your credentials:
```bash
cp .env.example .env
```

| Variable | Where to get it |
|---|---|
| `SHOPIFY_API_KEY` | [Shopify Partners Dashboard](https://partners.shopify.com) → Your App |
| `SHOPIFY_API_SECRET` | Same as above |
| `DATABASE_URL` | [Neon.tech](https://neon.tech) → Create a free DB → Connection string |
| `GEMINI_API_KEY` | [Google AI Studio](https://aistudio.google.com) → Get API Key |
| `RESEND_API_KEY` | [Resend.com](https://resend.com) → Dashboard → API Keys |
| `SHOPIFY_APP_URL` | Your Vercel deployment URL (after deploying) |

### 3. Setup Database
```bash
npx prisma migrate dev --name init
```

### 4. Run locally (Dev Tunnel)
```bash
shopify app dev
```

---

## 🌐 Deploy to Vercel

### 1. Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit — MakeFast Form Builder"
git remote add origin https://github.com/your-username/makfast-form-builder.git
git push -u origin main
```

### 2. Import to Vercel
1. Go to [vercel.com](https://vercel.com) → New Project → Import from GitHub
2. Select your repo
3. Add all environment variables from `.env` in Vercel's project settings
4. **IMPORTANT**: Disable "Vercel Authentication" (Deployment Protection) in project settings
5. Deploy!

### 3. Update Shopify App URL
Copy your Vercel URL → Go to Shopify Partners Dashboard → Update `Application URL` and `Allowed Redirect URLs`

---

## 📁 Project Structure

```
makfast-form-builder/
├── app/
│   ├── routes/           # All pages & API endpoints
│   ├── components/
│   │   └── builder/      # Drag-drop editor components
│   └── lib/              # Core logic (AI, storage, validation)
├── extensions/
│   └── makfast-form-block/ # Theme App Extension (Liquid)
│       ├── blocks/       # form.liquid
│       └── assets/       # makfast-form.js + .css
└── prisma/               # Database schema
```

## 🧠 How It Works

```
Merchant builds form in Admin (Remix on Vercel)
         ↓
Form config saved to Shopify Metafields (FREE storage)
         ↓
One-click publish syncs to Shop-level metafield
         ↓
Theme App Extension reads metafield via Liquid
         ↓
Forms render as pre-built HTML (zero JS for initial paint)
         ↓
Lightweight JS handles logic, validation, and submission
         ↓
Submission POSTs to App Proxy (/apps/makfast/submit)
         ↓
Saved to Neon PostgreSQL + Email via Resend
```

## 💰 Monthly Cost: $0

| Resource | Provider | Cost |
|---|---|---|
| Admin Dashboard | Vercel Free Tier | $0 |
| Form Config Storage | Shopify Metafields | $0 |
| Storefront Rendering | Shopify CDN | $0 |
| Submissions Database | Neon.tech Free (0.5GB) | $0 |
| Email Notifications | Resend Free (3K/mo) | $0 |
| AI Form Generation | Gemini Free Tier | $0 |
| **Total** | | **$0** |

## ✨ Features

- 🤖 **AI Form Generation** — Type a description, get a complete form
- 🧱 **Drag-and-Drop Builder** — Reorder fields with visual feedback
- ⚡ **Conditional Logic** — If-Then rules to show/hide/require fields
- 🎨 **Full Style Customization** — Colors, fonts, radius, shadows
- 🔮 **Auto Theme Match** — Detects your store's design automatically
- 📋 **Multi-Step Forms** — Typeform-style with progress bar
- 🛡 **Honeypot Spam Shield** — Blocks bots without CAPTCHA
- 📧 **Email Notifications** — Beautiful HTML emails to merchants
- 📊 **Submissions Dashboard** — View, filter, and manage responses

## 📋 Monetization Plans

| Plan | Price | Limits |
|---|---|---|
| Starter | Free | 1 form, 50 submissions/mo |
| Professional | $7.99/mo | Unlimited + Logic + File uploads |
| Enterprise | $14.99/mo | Remove branding + Integrations |
