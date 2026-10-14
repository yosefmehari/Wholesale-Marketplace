# WholesaleHub Ethiopia - Frontend Application

Modern B2B Wholesale Marketplace frontend built with Next.js (App Router), React, TypeScript, and Tailwind CSS.

## Requirements

- Node.js >= 20 (Verified on v24.19.0)
- npm >= 10 (Verified on 11.17.0)

## Features (Stage 1 Foundation)

- Next.js 15 App Router architecture.
- Full TypeScript type safety and strict checking.
- Tailwind CSS with B2B wholesale design system tokens.
- Multilingual i18n support for English (`en`), Amharic (`am`), and Afaan Oromo (`om`), with English as initial fallback.
- Dynamic backend API client configuration reading `NEXT_PUBLIC_API_URL`.
- Live API health check indicator reporting connection status to the backend.

## Directory Structure

```
frontend/
├── public/                 # Static assets (images, icons, robots.txt)
├── src/
│   ├── app/                # Next.js App Router (layout, page, globals.css)
│   ├── components/         # Reusable UI components and layouts
│   ├── features/           # Feature-specific components and business logic
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utilities, API client, i18n dictionaries
│   ├── services/           # Backend API interaction services
│   └── types/              # TypeScript interfaces and domain models
├── .env.example            # Frontend environment variable template
├── next.config.mjs
├── package.json
├── postcss.config.mjs
├── tailwind.config.ts
└── tsconfig.json
```

## Setup & Running (Windows PowerShell)

```powershell
# Navigate to frontend (or run directly from root)
cd frontend

# Copy environment template
Copy-Item .env.example .env.local

# Install dependencies
npm install

# Run development server (runs on http://localhost:3000)
npm run dev

# Build for production
npm run build

# Start production server
npm start
```
