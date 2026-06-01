# Reway

<div align="center">
  <img src="app/opengraph-image.png" alt="Reway" width="800">
</div>

Reway is a bookmark manager built for speed and organization. It captures instantly, then enriches titles and icons in the background so saving never feels blocked. It includes a web dashboard and a Chrome extension to sync your bookmarks across devices.

## Why use Reway?

Most browser bookmarks are hard to manage:

- They stay stuck in one browser or device.
- Folders get messy and hard to search.
- Links often miss icons or clear titles, making them hard to recognize.
- You can't easily open a whole set of links at once.

Reway fixes this by putting everything in one place with fast search and clear visuals.

## How it works

- **Web App**: Built with Next.js 16 and React 19. It uses a real-time database so changes show up instantly on all your open tabs.
- **Database**: Powered by Supabase (PostgreSQL). Your data is private and only accessible by you.
- **Extension**: A Chrome extension for saving pages, grabbing multiple links from a site, or saving your entire current window session.
- **Enrichment**: Titles, descriptions, and icons are fetched asynchronously after save; new items can appear with minimal metadata until it finishes.
- **Analytics**: Privacy-friendly Umami analytics, proxied through Reway's own domain so basic traffic stats work even when adblockers are enabled.

## Features

### Saving Bookmarks

- **Quick Save**: Use the extension to save the page you're currently on.
- **Link Grabber**: Select text on a page and save all links found in that selection.
- **Session Import**: Save all open tabs in your current window as a new group.
- **X (Twitter) Integration**: Click the bookmark button on X.com to save the tweet directly to Reway.
- **Auto Data**: Reway fetches title, description, and icons after saving, so capture stays fast even if metadata takes time.
- **Duplicates**: If you save a link that already exists, a bar pops up to let you skip it or move it to a different group.

### Organization

- **View Modes**: Choose how you want to see your links: List, Cards, Icons, or a Folder Board.
- **Folder Board**: A specialized view for managing nested groups and reordering them easily.
- **Drag and Drop**: Move bookmarks between groups or change their order by dragging them.
- **Appearance**: Pick between "Compact" mode for more info on screen or "Extended" mode for more breathing room.
- **Themes**: Multiple color options like Stone, Notebook, and Cyberpunk. Supports dark and light modes.

### Speed and Tools

- **Instant Search**: Find any link by typing. The search is very fast even with thousands of bookmarks.
- **Undo**: If you delete something by mistake, you can click "Undo" to bring it back.
- **Command Bar**: Press Cmd/Ctrl + K to quickly add a link or search your library without using the mouse.
- **Sidebar**: A side panel for quick notes and todos that stay next to your bookmarks.

## Setup

### Prerequisites

- Node.js 20 or higher
- pnpm

### Installation

1. Clone the repo: `git clone https://github.com/mohamed-g-shoaib/reway.git`
2. Install dependencies: `pnpm install`
3. Environment: Copy `.env.example` to `.env.local` and add your Supabase keys.
4. Database: Run `pnpm run db:push` to set up the tables.
5. Development: Run `pnpm run dev` to start the local server.

### Development Bundler

Next.js 16 uses Turbopack by default for `pnpm dev` and `pnpm build`. If Turbopack hits a panic, memory issue, or severe slowdown, stop the existing dev server, run `pnpm dev:trace`, reproduce the issue, stop the server, then inspect the trace with `pnpm trace:turbopack`.

## Project Structure

- `app/`: The main pages and API logic.
- `components/`: All UI elements for the dashboard and landing page.
- `extension/`: Source code for the Chrome extension.
- `hooks/`: Reusable logic for real-time updates and UI state.
- `lib/`: Configuration for themes, filters, and the database.
- `public/`: Icons, images, and static assets.

## Credits

This project is developed and maintained by [Devloop](https://www.devloop.software/)
