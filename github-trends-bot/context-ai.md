# Project Context & Progress Tracking

## Goal
Build an automated Twitter (X) bot that posts trending open-source tools/repositories.
- Daily output target: 10 tweets/threads (5 Spotlight tweets + 5 Listicle threads/tweets).
- Uses Google Gemini API (`gemini-2.5-pro` model) for repository analysis and summary generation.
- Uses `twitter-api-v2` for posting to X.
- Serverless deployment via GitHub Actions cron, using git commits back to the repo to persist the `tweeted.json` state.

## Project Structure
- `C:\Users\PARFAIT\Desktop\trending-tech-bot`
  - `src/`
    - `index.ts` - Main orchestration and daily scheduling logic
    - `github.ts` - Data ingestion from GitHub (Search API + Web scraping)
    - `llm.ts` - Summary generation using Gemini 2.5 Pro
    - `twitter.ts` - Client to post tweets and threads
    - `verify.ts` - Programmatic verification tests for character limits and formats
  - `package.json` - Dependency configuration (ESM `"type": "module"`)
  - `tsconfig.json` - TypeScript settings
  - `tweeted.json` - Local state file keeping track of already posted repositories
  - `.github/workflows/tweet-trends.yml` - Automation cron job (runs every 2 hours)

## Progress Log

### 2026-06-02
- Created project folder on User's Desktop.
- Initialized configuration files (`package.json`, `tsconfig.json`, `.env.example`).
- Implemented `src/github.ts` to query Search API and fallback to scraping HTML.
- Implemented `src/llm.ts` to utilize Google Gemini 2.5 Pro for summary generation with resilient mock fallback.
- Implemented `src/twitter.ts` to support single tweets, replies, and multi-tweet threads using `twitter-api-v2`.
- Implemented `src/index.ts` with round-robin quota caps (5 spotlights and 5 listicles daily), and a staggered execution schedule.
- Set up GitHub Actions workflow in `.github/workflows/tweet-trends.yml` to run every 2 hours and commit state back.
- Fixed TS1470 build issue by adding `"type": "module"` to `package.json`.
- Ran full verification check via dry-run (`npx tsx src/index.ts --dry-run --all`), successfully fetching 61 candidate repositories and generating 5 Spotlights and 5 Listicles with 0 compile/runtime errors.
- Created programmatic verification script `src/verify.ts` to assert that fallback and generated templates strictly respect the 280-character Twitter constraint on edge-case inputs.
- Tweaked LLM fallback template sizes and description truncation thresholds (`maxDescLen = 70`) to guarantee character safety.
- Ran `npm run verify` successfully confirming all character limits and layouts pass boundary tests.

### 2026-06-12
- Fixed undefined `setError` error in `src/app/dashboard/page.tsx` by declaring `error` and `setError` states.
- Enhanced Dashboard authentication: checked `sessionStorage` on mount to persist authentication, wrapped login fields in a form for Enter key submission, and added premium glassmorphic dark mode styling.
- Repaired truncated `components/PostCard.tsx` file: implemented custom component rendering X-style thread timeline, linked repository list, active statuses, and "Post to X" / "Reject" button events.
- Added server support for updating post content and statuses via a new POST handler in `src/app/api/posts/route.ts` and general `updatePost` function in `lib/storage.ts`.
- Fixed TypeScript compiler warning in `lib/github.ts` by adding the missing `forks?: number` property to `RepoInfo` interface.
- Resolved ESM compatibility issues in `scripts/generate.ts` by replacing `require.main === module` with an ESM-compliant direct execution check using `import.meta.url`.
- Created `src/app/page.tsx` to serve the dashboard layout at the index route (`/`) to resolve the landing page Not Found compiler issue.
- Overhauled login screen, dashboard page, post composing editors, and X-style thread timeline cards with premium responsive styling (glowing gradients, progress bars, active validations, and visual timelines).
- Added manual "Discover Breakouts" action triggers in the dashboard to dynamically scan GitHub and curate new breakout posts when the queue is empty.
- Successfully verified build output readiness.


