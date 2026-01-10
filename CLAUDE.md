# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Chrome Extension (Manifest v3) for LinkedIn data collection and webhook integration. Enables contact enrichment and company analysis by sending LinkedIn profile data to Clay.com webhook APIs.

## Development Setup

**No build system** - plain JavaScript (ES6 modules), HTML, and CSS served directly.

### Loading the Extension in Chrome

1. Open `chrome://extensions/`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Select the `chrome-extension_git_hub/` folder

### Reloading After Changes

- Click the refresh icon on the extension card in `chrome://extensions/`
- For popup changes: close and reopen the popup
- For background.js changes: reload the extension

## Architecture

```
chrome-extension_git_hub/
├── manifest.json          # Extension config (permissions, entry points)
├── srcs/
│   ├── background.js      # Service worker: context menus, right-click webhooks
│   ├── popup.html/js      # Main UI: email entry, single contact extraction
│   ├── upload.html/js     # CSV bulk import modal
│   └── webhook_tools.js   # Centralized webhook URL configuration
└── images/                # Extension icons
```

### Data Flow

1. **Single Contact**: User clicks extension on LinkedIn page → `popup.js` extracts data via `chrome.scripting.executeScript` → POST to Clay webhook
2. **Bulk Import**: User uploads CSV in `upload.html` → `upload.js` parses contacts → concurrent POST requests to webhook
3. **Context Menu**: Right-click LinkedIn link → `background.js` sends URL to webhook

### Webhook Payload Format

```javascript
{
  "LinkedIn Url": "https://linkedin.com/in/person",
  "Full Name": "John Doe",
  "Company Name": "ACME Corp",           // single contact only
  "LinkedIn Company Page": "https://...", // single contact only
  "creator": "user@example.com"
}
```

## Key Chrome APIs Used

- `chrome.storage.sync` - Persist user email across devices
- `chrome.scripting.executeScript` - Extract data from LinkedIn pages
- `chrome.contextMenus` - Right-click menu integration
- `chrome.tabs.query` - Get active tab info

## Configuration

Webhook URLs are in `srcs/webhook_tools.js`:
- `webhook1`: Contact enrichment endpoint
- `webhook2`: Company analysis endpoint

## CSV Import Format

Flexible column headers (case-insensitive):
- Name column: "Full Name" or "Name"
- URL column: "LinkedIn URL" or "LinkedIn Profile"
