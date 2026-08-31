# Frozen

Frozen is a simple, local-first PWA for saving cooking instructions for frozen and packaged foods.

Instead of keeping the packaging just to remember how long something needs to cook, Frozen lets you save the instructions on your phone and quickly look them up later.

## Features

- Save cooking instructions for packaged and frozen foods
- Oven instructions for:
  - Top/bottom heat
  - Fan / convection
- Air fryer instructions
- Optional minimum and maximum cooking times
- Optional brand and notes
- Search saved foods
- Sort by:
  - Date added
  - Name
- Edit and delete saved foods
- Light, dark and system themes
- English and German
- JSON backup and restore
- Fully offline after initial installation
- Installable as a PWA
- Local-first with no account required
- No backend or server-side database

## Offline Support

Frozen is designed to work without an internet connection.

After the initial installation, the application files are cached by a service worker. Saved foods are stored locally using IndexedDB.

The Settings page can be used to:

- Check whether the offline cache is ready
- Delete and rebuild the offline cache
- Check for app updates
- Install an available update
- Reset the application and its local data

## Data & Privacy

Frozen does not require an account and does not upload your saved foods to a server.

Food data is stored locally in your browser using IndexedDB. Settings are stored locally using browser storage.

You can export your data as a JSON backup and import it again later.

Deleting browser data or uninstalling the PWA may remove locally stored data, so creating backups is recommended for anything you want to keep.

## Installation

Frozen is a Progressive Web App and can be installed directly from a supported browser.

Open the hosted version of Frozen over HTTPS and use your browser's **Install app** or **Add to Home Screen** option.

Once installed and prepared for offline use, Frozen can be launched like a normal app.

## Development

Frozen is built with:

- TypeScript
- Vite
- IndexedDB
- Service Workers / Workbox
- Tabler Icons

### Requirements

- Node.js
- npm

### Install dependencies

```bash
npm install
```

### Start the development server

```bash
npm run dev
```

### Create a production build

```bash
npm run build
```

The production build is created in:

```text
dist/
```

### Preview the production build

```bash
npm run preview
```

To make the preview accessible from other devices on your local network:

```bash
npm run preview -- --host
```

> Service workers and PWA functionality generally require a secure context. Use HTTPS for normal deployment.

## Project Structure

```text
frozen/
├── public/
│   ├── favicon.svg
│   ├── apple-touch-icon.png
│   ├── pwa-192x192.png
│   ├── pwa-512x512.png
│   └── pwa-maskable-512x512.png
│
├── src/
│   ├── i18n/
│   │   ├── locales/
│   │   │   ├── de.json
│   │   │   └── en.json
│   │   └── i18n.ts
│   │
│   ├── storage/
│   │   └── database.ts
│   │
│   ├── types/
│   │   └── food.ts
│   │
│   ├── app.ts
│   ├── icons.ts
│   ├── main.ts
│   ├── pwa.ts
│   ├── pwa.css
│   ├── style.css
│   ├── theme.ts
│   └── vite-env.d.ts
│
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Backups

Frozen backups are regular JSON files containing the saved food entries.

Backups can be exported from **Settings → Data** and imported again from the same page.

This can be used to:

- Move your data to another device
- Restore data after clearing browser storage
- Keep an external copy of your saved foods

## License

See [LICENSE](LICENSE).