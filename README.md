# ChatLens

ChatLens is a beautifully designed, modern web application that allows you to analyze and explore your exported Instagram direct messages locally inside your browser. Built entirely with privacy in mind; all text parsing and data visualization happens 100% on the client-side.

![ChatLens](public/favicon.svg)

## Features
- **Deep Analytics:** Discover your top communicators, most active chatting hours, and visualize complex message interactions.
- **Emoji Breakdown:** View distribution and sentiment mapping for the exact emojis you use across chats.
- **Smart Viewer:** A seamless, aesthetically-pleasing chat timeline that lets you search, sort, and jump directly to specific dates.
- **Privacy First:** Absolutely zero servers involved. Upload your exported HTML or JSON folder directly from Instagram and let the browser parser handle the rest safely.

## Tech Stack
- **Frontend Framework:** React + Vite
- **Visualizations:** Recharts
- **Styling:** Custom Vanilla CSS with a specialized Dark Neon Glassmorphism design system
- **Date Manipulations:** Date-fns
- **Icons:** Lucide-React

## Running Locally

1. Clone or download the repository.
2. Install the necessary dependencies:
   ```bash
   npm install
   ```
3. Run the Vite development server:
   ```bash
   npm run dev
   ```
