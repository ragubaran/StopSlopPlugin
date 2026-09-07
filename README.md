<p align="center">
  <img src="icons/icon-128.png" width="96" height="96" alt="StopSlop Logo" />
</p>

# StopSlop — YouTube AI Slop & Clickbait Auto-Flagger 🚩

A lightweight, privacy-first Chromium Manifest V3 browser extension built with TypeScript, React, and Vite that automatically scans YouTube feeds, detects **AI slop, content farm, brainrot, and clickbait videos**, and filters them in real time.

---

## Features

- **Multi-Signal Detection Engine**:
  - 🤖 **AI Slop & Fake Concept Trailers**: Detects "I asked AI to...", Midjourney/ChatGPT buzzwords, fake AI trailers, and synthetic hooks.
  - 🚜 **Content Farms**: Catches hyper-curiosity listicles, "100 facts", repetitive psychological clickbait formulas.
  - 🧠 **Brainrot & Sensory Slop**: Flags Skibidi, sensory background videos (Subway Surfers, soap cutting), and brainrot memes.
  - 📢 **Reddit / TTS Bot Narrators**: Identifies automated AITA / AskReddit scraper channels with TTS voices.
  - ⚡ **Sensational Clickbait**: Flags excessive ALL-CAPS (>75%), excessive exclamation marks (???!!!), and emoji spam.
- **Three Filtering Modes**:
  1. **Blur & Dim (Default)**: Blurs thumbnail (18px) and dims card opacity with an "👁️ Reveal" button.
  2. **Badge Only**: Keeps the video visible, but overlays a high-visibility `🚩 SLOP` badge with confidence details.
  3. **Hide Completely**: Removes flagged cards from the YouTube feed.
- **Surface Adapters**:
  - Home feed (`ytd-rich-item-renderer`)
  - Search results (`ytd-video-renderer`)
  - Related / Watch Next sidebar (`ytd-compact-video-renderer`)
  - Shorts shelves & carousels (`ytd-reel-item-renderer`)
- **Quick Hover Actions**:
  - `🏳️ Unflag`: 1-click whitelist for false alarms.
  - `🚫 Block Channel`: Instantly adds the channel to your permanent blocklist.
- **Interactive React Dashboard Popup**:
  - Live scanned & flagged video counters.
  - Filter mode selector & category toggles.
  - Sensitivity slider (30% to 95%).
  - Channel Blocklist manager (add/remove).
  - Custom Keywords manager.
  - Flagged History log with quick whitelist buttons.
  - Instant live sync to active YouTube tabs without page reload.
- **🔄 Updateable Architecture & Portability**:
  - **Dynamic Rule Definitions**: Fetch and update pattern definitions & community blocklists on demand from remote URLs without reinstalling the extension.
  - **App Update Checks**: Integrates with Chrome runtime update checks (`chrome.runtime.requestUpdateCheck`).
  - **Backup & Portability**: 1-click Export and Import of settings, custom keywords, blocklists, and dynamic rules as JSON.

---

## How to Install & Run in Chrome

1. Build the extension:
   ```bash
   npm run build
   ```
2. Open Google Chrome (or any Chromium browser: Brave, Edge).
3. Navigate to:
   ```
   chrome://extensions
   ```
4. Enable **Developer mode** (toggle in the top-right corner).
5. Click **Load unpacked** (top-left button).
6. Select the **`dist`** folder inside this repository:
   ```
   /Users/ragu/Code/StopSlopPlugin/dist
   ```
7. Visit [YouTube](https://www.youtube.com/) — StopSlop will automatically start scanning and flagging slop videos!

---

## Development & Testing

- **Run Unit Tests (Vitest)**:
  ```bash
  npm test
  ```
- **Type Checking**:
  ```bash
  npm run type-check
  ```
- **Build Extension**:
  ```bash
  npm run build
  ```

---

## Architecture

```
StopSlopPlugin/
├── src/
│   ├── background/service-worker.ts   # Extension service worker & badge counter
│   ├── content/                       # Content script & DOM integration
│   │   ├── adapters/                  # Modular YouTube Surface Adapters
│   │   ├── extractor.ts               # Metadata extraction
│   │   ├── renderer.ts                # Visual badges, blur filter & overlays
│   │   └── observer.ts                # MutationObserver & navigation handler
│   ├── detection/                     # Detection heuristics & Scorer
│   │   ├── patterns/                  # AI slop, content-farm, brainrot, TTS, reddit-bot
│   │   ├── scorer.ts                  # Multi-signal aggregator & confidence calculator
│   │   └── detector.ts                # Master detection engine
│   ├── storage/                       # Type-safe Chrome storage repositories
│   └── popup/                         # React popup UI & settings dashboard
├── tests/                             # Vitest automated test suite (26 tests)
└── dist/                              # Compiled Manifest V3 production bundle
```
