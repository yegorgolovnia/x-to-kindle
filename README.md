# X to Kindle
> RAW TEXT DELIVERY SYSTEM

A highly opinionated, minimalist utility to extract long-form X (Twitter) Articles and beam them directly to your Kindle as `.epub` files. No databases, no user accounts, no friction. Just paste a link and send.

## Core Features
- **Stateless Architecture**: Operates entirely in-memory. Your data is not stored on any database.
- **Local Storage Configurations**: Your Kindle delivery email is saved locally in your browser cache.
- **Headless Extraction**: Bypasses API paywalls by utilizing Puppeteer to scrape public article DOMs.
- **Geist Pixel Aesthetic**: A strict, dark-mode-only terminal UI for maximum focus.

## Tech Stack
- **Framework**: Next.js (App Router)
- **Scraping**: Puppeteer
- **Conversion**: `epub-gen-memory`
- **Delivery**: Resend API
- **Styling**: Tailwind CSS v4

## Local Setup
1. Clone the repository:
   ```bash
   git clone <your-repo-url>
   cd x-to-kindle
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure Environment Variables:
   Create a `.env.local` file in the root directory (this file is git-ignored to keep your keys safe).
   ```env
   # .env.local
   RESEND_API_KEY=re_your_secret_resend_key
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to view the application.

## Security Warning for Contributors
**Never** commit your `.env.local` or `.env` files. The `RESEND_API_KEY` provides access to your email quota and domain reputation. It should only exist on your local machine and in your Vercel (or hosting provider) environment settings.

## Contributing
All development happens on the `dev` branch or feature branches. Please do not push directly to `main`. Create a PR against `main` when features are stable.
