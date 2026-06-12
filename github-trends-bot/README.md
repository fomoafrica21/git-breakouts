# Git Breakouts

An autonomous open-source trend aggregator and X (Twitter) bot that finds breakout GitHub repositories early and posts high-quality content daily.

**Current Target:** 3 Spotlight tweets + 2 Listicle threads per day (5 total posts)

---

## Features

- Powered by **Grok-4.3** (xAI)
- Smart breakout detection using GitHub Search + Trending scraping
- Author Twitter handle detection and tagging (`@mention`)
- Link-in-reply strategy for better reach
- Robust retry logic with exponential backoff
- Stateful posting (prevents duplicates)
- Dry-run mode for safe testing

---

## Tech Stack

- Node.js + TypeScript (ESM)
- Grok API
- GitHub Actions (cron)
- twitter-api-v2

---

## Setup

1. Clone the repo
2. Copy `.env.example` to `.env` and fill in your keys
3. Install dependencies:
   ```bash
   npm install