# Tech Stack

## Architecture
- **Framework**: Next.js (App Router)
- **Deployment**: Vercel (Free tier optimized)
- **State Management**: React `useState` + native browser API (`localStorage`)

## Frontend
- **Styling**: Tailwind CSS
- **Typography**: [Geist Pixel](https://vercel.com/font?type=pixel) by Vercel for a sharp, utilitarian terminal aesthetic.
- **Theme**: Strict Dark Mode. No light mode toggle. Pure blacks (`#000`), deep grays, and high contrast text.

## Backend (Next.js Serverless API Routes)
- **Data Fetching**: Native `fetch` against free X/Twitter meta-tag endpoints (e.g., `vxtwitter.com`, `fxtwitter.com`, or equivalent JSON APIs) to extract X Article content.
- **EPUB Generation**: `epub-gen-memory` (or a similar lightweight Node.js library to construct EPUBs from HTML/strings without touching the file system).
- **Email Dispatch**: **Resend** (Node.js SDK). Selected for its generous free tier and simplicity in sending attachments from serverless environments.
