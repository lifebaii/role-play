# Role-Play

[Chinese](../README.md) | English

<img src="../public/pwa-192x192.png" alt="Role-Play Logo" width="128" />

Role-Play is a Vue 3, Vite, and TypeScript frontend for character-based AI conversations. It runs in frontend-only mode by default. No account or companion backend is required. Characters, conversations, model settings, and the user's display name are stored in the current browser.

## Live Site

GitHub Pages: **[https://lifebaii.github.io/role-play/](https://lifebaii.github.io/role-play/)**

## Features

- Create, import, export, and edit characters.
- Import two bundled characters automatically on first visit.
- Support character cards in JSON and PNG formats.
- Stream role-play conversations through custom model APIs.
- Support OpenAI-compatible and Anthropic API protocols.
- Manage multiple model configurations and fetch available model lists.
- Import a model configuration by pasting three or four lines of text.
- Support lorebooks, regex scripts, presets, and character backgrounds.
- Import and export complete conversations as JSONL.
- Export readable conversations as plain-text TXT files.
- Back up and restore local user data by category or as a complete archive.
- Support responsive layouts, light and dark themes, and PWA installation.

## First Visit

1. Enter the name that characters should use for you. No default guest name is assigned.
2. Complete the custom model configuration.
3. Enter your own API key and verify the API URL and model name.
4. Select a character from the sidebar and start chatting.

New model configurations include these public defaults. No API key is embedded in the source code:

| Setting | Default |
|---|---|
| Configuration name | Meituan LongCat |
| Provider | OpenAI Compatible |
| API URL | `https://api.longcat.chat/openai/v1` |
| Model | `LongCat-2.0` |
| API key | Empty; each user enters their own key |

Switching providers does not overwrite the API URL.

### Quick Model Configuration

Paste these three lines into the quick configuration field:

```text
Configuration name
API URL
API key
```

An optional fourth line can specify the model:

```text
Configuration name
API URL
API key
Model name
```

When the model name is omitted, the application attempts to fetch the model list and selects the first result. A model name can still be entered manually when discovery is unavailable.

## Bundled Characters

Bundled character assets are stored under `public/1/`. They are imported into IndexedDB on the first visit:

- `v1.96 Pantheon of Adis Lite Preview`
- `Release That Witch`

The initialization runs only once. Refreshing the page does not restore a bundled character that the user intentionally removed. Clearing all site data resets the initialization.

The **Edit Character** action in the chat page's three-dot menu edits the current character directly.

## Local Data and Multiple Users

A frontend-only deployment can be shared by multiple users through the same IP address, domain, and port. Browser storage is isolated by scheme, host, port, and browser profile:

- Different devices, browsers, or browser profiles do not share data.
- The same browser profile uses the same local data when visiting the same site.
- API keys remain in the current browser and are not committed to the repository.
- Clearing site data removes characters, conversations, and model configurations.

Export backups regularly. TXT exports are intended for reading only. Use JSONL or a complete local backup when data must be restored.

> A frontend-only application cannot securely distribute a shared API key or enforce a reliable per-user server quota. A server-side proxy is required for those capabilities.

## Runtime Modes

| Feature | Frontend-only mode | Backend mode |
|---|---|---|
| Characters and conversations | Stored in the browser | Stored in the browser |
| Custom models | Each user provides a key | Supported |
| Character import and export | Supported | Supported |
| JSONL backup and restore | Supported | Supported |
| TXT export | Supported | Supported |
| Login, check-in, online characters | Disabled | Depends on the backend implementation |
| Conversation sync and built-in models | Disabled | Depends on the backend implementation |

This repository uses frontend-only mode by default.

## Local Development

### Requirements

- Node.js 22
- npm

### Install and Start

```bash
npm ci
npm run dev
```

The development server is available at:

```text
http://localhost:3000/#/chat
```

For access from another device on the same network, use:

```text
http://SERVER_IP:3000/#/chat
```

### Build and Preview

```bash
npm run build
npm run preview
```

Production files are written to `dist/`. Because GitHub Pages serves this repository under `/role-play/`, the preview URL is normally:

```text
http://localhost:4173/role-play/#/chat
```

Vite uses port `4174` automatically when `4173` is already occupied. To require a fixed port, run:

```bash
npm run preview -- --port=4173 --strictPort
```

## Environment Variables

Copy `.env.example` or create `.env`:

```env
# Backend API URL; leave empty in frontend-only mode
VITE_API_BASE_URL=

# Companion backend is disabled by default
VITE_BACKEND_ENABLED=false

# Only affects login and administration when the backend is enabled
VITE_SHOW_AUTH_ENTRY=false
```

Restart the development server or rebuild after changing environment variables.

## GitHub Pages

The repository includes `.github/workflows/static.yml`:

- It runs on pushes to `master`.
- It uses Node.js 22 and `npm ci`.
- It runs `npm run build`.
- It uploads `dist/` and deploys it to GitHub Pages.
- The production Vite base path is `/role-play/`.

Pushing to `master` triggers deployment through GitHub Actions.

## Technology

- Vue 3
- TypeScript
- Vite 5
- Tailwind CSS
- Pinia
- Vue Router with hash history
- IndexedDB
- Dexie
- vite-plugin-pwa
- marked and DOMPurify

## License

[MIT License](../LICENSE)
