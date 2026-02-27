# Application Flow

## 1. Initial Setup (First Visit)
1. User lands on the homepage. The UI is minimal, dark-mode only.
2. A settings section (or modal) prompts the user to enter their `@kindle.com` email address.
3. The UI includes a short text block instructing the user to:
   - Go to Amazon -> Manage Your Content & Devices -> Preferences -> Personal Document Settings.
   - Add `{our-delivery-email}` to the "Approved Personal Document E-mail List".
4. User enters their Kindle email. This is saved to `localStorage`.

## 2. Main Interaction
1. User retrieves an X Article URL (e.g., `https://x.com/username/status/123456789`).
2. User pastes the URL into the main input field.
3. User clicks **"Send to Kindle"**.

## 3. Processing (Backend API)
*State: Frontend shows a sleek, minimal loading indicator.*
1. **Extraction**: The Next.js API route takes the URL/ID, launches a headless Puppeteer browser instance, directly visits the specified X URL, and deeply parses the DOM tree to faithfully extract text, headers, and media.
2. **Conversion**: The backend parses the text and images and generates an `EPUB` file entirely in-memory.
3. **Delivery**: The backend uses the Resend API to email the generated EPUB file as an attachment to the user's `@kindle.com` address (retrieved from the frontend payload).

## 4. Completion
1. **Success**: The loading state is replaced with a success message ("Successfully sent to Kindle.").
2. **Failure**: The app displays exactly what went wrong in a clean way (e.g., "Error: Tweet is unavailable" or "Error: Email failed to send").
