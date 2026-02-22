# Product Requirements Document (PRD)

## Project: X Article to Kindle
A minimalist, zero-friction web utility for converting X (Twitter) Articles into EPUB format and delivering them directly to a user's Kindle device.

## Core Objective
To allow users to read long-form X content offline on their e-readers without dealing with clutter, complex setups, or thread-unrolling tools.

## Key Features
1. **Stateless Processing**: No backend database. No user accounts.
2. **Local Settings**: The user's specific `@kindle.com` address is saved securely in the browser's Local Storage.
3. **One-Click Delivery**: Paste the X Article URL, click send, and the app handles fetching, EPUB generation, and email delivery.
4. **Onboarding Tutorial**: A persistent or easily accessible help section explaining how to find the Kindle email and whitelist the sender's email address in Amazon settings.

## Out of Scope (Non-Goals)
- Scraping or unrolling standard Twitter Threads (focus is purely on native X Articles / long-form tweets).
- Video and Audio extraction (Kindle focuses on text/images).
- Paid third-party APIs for Twitter data (must use free/open endpoints).
- User authentication systems (NextAuth, Supabase, etc.).

## Error Handling
- Invalid URLs or missing content should fail gracefully with "Tweet is unavailable".
- Email delivery failures via Resend should surface a clear error to the user.
