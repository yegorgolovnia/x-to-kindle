# X to Kindle
> **RAW TEXT DELIVERY SYSTEM**

A highly opinionated, minimalist utility to extract long-form X (Twitter) Articles and beam them directly to your Kindle as `.epub` files. No databases, no user accounts, no friction. Just paste a link and send.

![X to Kindle Interface](./public/screenshot.png)

## Core Features
1. **Headless DOM Extraction**: Bypasses strict API paywalls and rate limits by utilizing a headless Puppeteer browser to faithfully scrape public article DOMs (including text and images).
2. **Stateless Architecture**: Operates entirely in-memory. Your data is not stored on any database.
3. **Local Storage Configurations**: Your Kindle delivery email is saved locally in your browser cache.
4. **Resend Email Delivery**: Generates the `.epub` in node memory and ships it instantly as an email attachment via the Resend API.
5. **Geist Pixel Aesthetic**: A strict, dark-mode-only terminal UI.

---

## 🛠️ Local Setup & Forking

If you want to fork this project and run your own instance, you will need to configure your own email delivery service. We use [Resend](https://resend.com/).

### 1. Clone & Install
```bash
git clone https://github.com/your-username/x-to-kindle.git
cd x-to-kindle
npm install
```

### 2. Configure Environment Variables
Create a `.env.local` file in the root directory. You will need a free API key from Resend.
```env
# .env.local
RESEND_API_KEY=re_your_secret_resend_key
```

### 3. Setting Up Resend (Crucial for Forks)
By default, the application sends emails *from* `delivery@x-to-kindle.com` to the Kindle address provided in the UI. 

If you fork this, you must:
1. Register a domain with Resend.
2. Update the `from` email address in `src/app/api/process/route.ts` to match your registered domain.
```typescript
// Inside src/app/api/process/route.ts
const { data: emailData, error: emailError } = await resend.emails.send({
  from: 'X to Kindle <your-custom-email@yourdomain.com>', // MUST UPDATE THIS
  to: [kindleEmail],
  // ...
});
```

### 4. Run the development server
```bash
npm run dev
```

---

## 📱 Kindle Setup (For End Users)

Amazon restricts who can send documents to your Kindle email address to prevent spam. Before using this app, you must whitelist the sender email.

1. Go to **Amazon.com** -> **Account & Lists** -> **Manage Your Content and Devices**.
2. Click the **Preferences** tab.
3. Scroll down to **Personal Document Settings**.
4. Under **Approved Personal Document E-mail List**, add the sending email address (e.g., `delivery@x-to-kindle.com`, or your custom domain if you forked it).
5. Find your specific **Send-to-Kindle E-Mail Address** on the same page (looks like `username_xx@kindle.com`). Note: This is *different* from your standard Amazon login email.
6. Paste that `@kindle.com` address into the Settings section of this app!

---

## Security Warning for Contributors
**Never** commit your `.env.local` or `.env` files. The `RESEND_API_KEY` provides access to your email quota and domain reputation. It should only exist on your local machine and in your hosting provider's environment settings.

## Contributing
All development happens on feature branches. Create a PR against `main` when features are stable.

## Tech Stack
- **Framework**: Next.js (App Router)
- **Scraping**: `puppeteer-core` & `@sparticuz/chromium`
- **Conversion**: `epub-gen-memory`
- **Delivery**: Resend API
- **Styling**: Tailwind CSS v4 & Geist Pixel Font
