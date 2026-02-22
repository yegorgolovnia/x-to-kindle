# Implementation Plan

## Phase 1: Initialization & Tooling
- [ ] Initialize Next.js app (`npx create-next-app@latest`).
- [ ] Clean up default boilerplate and configure Tailwind CSS for strict dark mode.
- [ ] Import and configure the local `Geist Pixel` font.
- [ ] Install essential backend dependencies: `resend`, an epub generation library (e.g., `epub-gen-memory`), `cheerio` (if HTML parsing is needed).

## Phase 2: Frontend Layout & State
- [ ] Build the main view: centered input field for the X link and a submit button.
- [ ] Build the settings view: input field for the `@kindle.com` email and the Amazon whitelist instructions.
- [ ] Implement `localStorage` logic to save and retrieve the Kindle email automatically.
- [ ] Implement UI states: Idle, Loading (fetching/generating/sending), Success, Error.

## Phase 3: Extraction API (Backend)
- [ ] Create `POST /api/process` standard route.
- [ ] Implement URL parsing to safely extract the tweet/article ID.
- [ ] Fetch the data using a reliable open endpoint (e.g., `api.vxtwitter.com` or similar) to bypass auth walls.
- [ ] Handle missing content / private account errors gracefully.

## Phase 4: EPUB Generation (Backend)
- [ ] Map the fetched text and image URLs into clean HTML suitable for an EPUB.
- [ ] Stream or buffer the HTML into the EPUB generation library.
- [ ] Output a raw Buffer or Base64 string of the `.epub` file directly in memory.

## Phase 5: Resend Delivery (Backend)
- [ ] Set up the `RESEND_API_KEY` environment variable.
- [ ] Implement the `resend.emails.send` function.
- [ ] Attach the in-memory EPUB Buffer to the Resend payload.
- [ ] Route the email to the user-provided `@kindle.com` address.

## Phase 6: Testing & Polish
- [ ] Test the full end-to-end flow locally with a real Kindle.
- [ ] Polish the Geist Pixel animations, loading states, and error handling.
- [ ] Deploy to Vercel.
