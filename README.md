# One Globe (OG) — Website

Marketing site for One Globe: custom sportswear, jerseys and apparel. Built
with [Next.js](https://nextjs.org), TypeScript, and Tailwind CSS.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Quote request emails

The "Request a Quote" form (`/contact`) sends email via Gmail SMTP through
`src/app/api/quote/route.ts`. To enable it locally:

1. Copy `.env.example` to `.env.local`.
2. Generate a Gmail [App password](https://myaccount.google.com/apppasswords)
   for the sending account (2-Step Verification must be on first).
3. Fill in `SMTP_USER` and `SMTP_PASS` in `.env.local`, then restart the dev
   server.

When deploying, set `SMTP_USER`, `SMTP_PASS`, and optionally
`QUOTE_TO_EMAIL` as environment variables on the host — `.env.local` is not
committed to git.

## Design Collection

`/design-collection/[category]` reads image files directly from
`public/designs/<category-slug>/` at request time — drop new images into the
matching folder and they appear automatically, no code changes needed.
Categories are defined in `src/lib/design-categories.ts`.

## Deploying

This project deploys cleanly to [Vercel](https://vercel.com/new) (zero
config, the quote API route runs as a Node.js serverless function there).
