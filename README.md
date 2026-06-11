# 🚀 Trending Tech Assets Twitter Bot

An automated, serverless Twitter (X) bot that tracks breakout open-source projects on GitHub, analyzes them using Google Gemini 2.5 Pro, and posts engaging tweets and threads. 

To maximize engagement and comply with X's algorithm, the bot runs on a staggered schedule to publish **5 Spotlight tweets** and **5 Listicle threads** (highlighting 3 repos each) every day (10 total daily posts).

---

## 🛠️ Tech Stack & Architecture

- **Runtime**: Node.js (TypeScript) via `tsx`
- **Ingestion**: Dual-engine pipeline:
  - **GitHub Search API**: Queries for breakout newcomers (created within 30 days, stars > 80, sorted by stars).
  - **HTML Scraper**: Fallback scraper to fetch from the main `github.com/trending` feeds.
- **Synthesis (LLM)**: **Google Gemini 2.5 Pro** (`gemini-2.5-pro` model) via `@google/generative-ai` to parse READMEs and write developer-focused, hype-free copy.
- **Publishing (X API)**: `twitter-api-v2` utilizing OAuth 1.0a User Context.
- **Automation & State**: 
  - **GitHub Actions**: Configured to run on a cron schedule every 2 hours.
  - **Serverless DB (Git)**: Saves state (avoiding duplicate tweets) by committing `tweeted.json` back to the GitHub repository at the end of each run.

---

## 📂 Project Structure

```
├── .github/workflows/
│   └── tweet-trends.yml     # GitHub Actions cron workflow (every 2 hours)
├── src/
│   ├── github.ts            # GitHub API & HTML scraping pipeline
│   ├── llm.ts               # Gemini 2.5 Pro text synthesis
│   ├── twitter.ts           # Twitter/X client wrapper
│   └── index.ts             # Orchestrator & scheduling engine
├── .env.example             # Secrets template
├── package.json             # NPM dependencies
├── tsconfig.json            # TypeScript configuration
├── tweeted.json             # Saved state (tweeted IDs & post history)
└── context-ai.md            # LLM progress log & project history
```

---

## 🔑 Setup & Configuration

### 1. Twitter/X Developer Setup
1. Apply for a developer account on the [X Developer Portal](https://developer.x.com/).
2. Create a Project and an App.
3. In App Settings, go to **User authentication settings**:
   - Set app permissions to **Read and Write**.
   - Set type of app to **Web App, Automated App or Bot**.
4. Generate and save the following credentials:
   - **Consumer API Key** & **Consumer Secret**
   - **Access Token** & **Access Token Secret**

### 2. Gemini API Setup
1. Go to [Google AI Studio](https://aistudio.google.com/).
2. Create an API Key and copy it.

### 3. Local Installation
1. Navigate to the project directory:
   ```bash
   cd C:\Users\PARFAIT\Desktop\trending-tech-bot
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env` and fill in your keys:
   ```bash
   cp .env.example .env
   ```

---

## 🚀 Running the Bot

### Dry-Run Mode (Testing)
Runs the entire pipeline (fetches candidate repos, grabs READMEs, queries Gemini, generates formatting) but **does not post to Twitter** or save the state. Instead, it logs the tweets to the console.

```bash
# Test a single staggered post
npm run dry-run

# Test a full daily batch (5 Spotlights + 5 Listicles)
npm run dry-run -- --all
```

### Production Mode
Runs the bot and posts the tweets to Twitter, then updates `tweeted.json`.

```bash
# Run a single scheduled staggered post
npm start

# Run the full daily batch
npm start -- --all
```

---

## 🤖 Staggered Scheduling (How it Works)

To avoid spamming and maximize reach across time zones, the bot uses a **Round-Robin Quota Engine**:
1. When the cron runs (every 2 hours via GitHub Actions), the script checks the last 24 hours of history inside `tweeted.json`.
2. It counts how many Spotlights and Listicles have been posted in that period.
3. If both are under the daily limit (5 each):
   - It alternates based on the last type posted (e.g. if last was Spotlight, post Listicle).
4. If one of the types has reached its daily limit, it posts the other type.
5. If the daily limits (5 Spotlights, 5 Listicles) are met, the script exits immediately without making any API calls, ensuring you never exceed X API rate limits or spam your feed.
