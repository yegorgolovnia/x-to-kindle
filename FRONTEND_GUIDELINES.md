# Frontend Guidelines

## Core Aesthetic Philosophy
- **Utilitarian & Raw**: The app should feel like a developer tool or a high-end terminal interface. No fluff, no unnecessary gradients, no marketing copy.
- **Geist Pixel**: This font dictates the entire vibe. It must be used for headings, labels, buttons, and status messages. 
- **Dark Mode Only**: The background should default to `#000000` or a very dark `#0A0A0A`. Borders and dividers should be incredibly subtle (e.g., `#333333`).

## Component Guidelines
- **Input Fields**: No bulky borders. Consider a bottom-border only (like a physical form) or a slightly elevated dark gray box that lights up (`#1A1A1A`) on focus.
- **Buttons**: Sharp corners (no `rounded-full` or thick border radii). High contrast hover states (e.g., pure white background with black text on hover).
- **Loading State**: Avoid generic spinners. Use a blinking cursor `_`, a pixelated progress bar, or cycling text (`[FETCHING...] -> [GENERATING EPUB...] -> [DELIVERING...]`).

## Layout
- Single column, vertically centered.
- The "Settings" (Kindle Email input & instructions) should be easily collapsible or subtly placed so it doesn't distract from the main input field once set up.

## Typography Scale (Geist Pixel)
- `h1`: App Title (Used sparingly)
- `body`: Main inputs and instructional text
- `small`: Error messages and Amazon Whitelist instructions (muted text color)
