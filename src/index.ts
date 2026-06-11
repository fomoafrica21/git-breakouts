// src/index.ts
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GitHubService, RepoInfo } from './github.js';
import { LLMService } from './llm.js';
import { TwitterService } from './twitter.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const STATE_FILE_PATH = path.join(__dirname, '..', 'tweeted.json');

const dryRunFlag = process.argv.includes('--dry-run');
const forceFlag = process.argv.includes('--force');
const runAllFlag = process.argv.includes('--all');

interface HistoryEntry {
  date: string;
  type: 'spotlight' | 'listicle';
  repoIds: number[];
}

interface BotState {
  tweetedIds: number[];
  history: HistoryEntry[];
}

// ====================== STATE ======================
function loadState(): BotState {
  try {
    if (fs.existsSync(STATE_FILE_PATH)) {
      return JSON.parse(fs.readFileSync(STATE_FILE_PATH, 'utf8'));
    }
  } catch (err) {
    console.error('[State] Error loading:', err);
  }
  return { tweetedIds: [], history: [] };
}

function saveState(state: BotState) {
  try {
    fs.writeFileSync(STATE_FILE_PATH, JSON.stringify(state, null, 2));
    console.log(`[State] Saved — ${state.tweetedIds.length} repos tracked`);
  } catch (err) {
    console.error('[State] Error saving:', err);
  }
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

// Exponential Backoff
async function withBackoff<T>(fn: () => Promise<T>, maxRetries = 4): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      if (attempt === maxRetries || (err.status !== 429 && !err.message?.includes('429'))) {
        throw err;
      }
      const delay = Math.pow(2, attempt) * 1000 + Math.random() * 500;
      console.warn(`[Backoff] Rate limited. Retrying in ${delay}ms...`);
      await sleep(delay);
    }
  }
  throw new Error('Max retries exceeded');
}

// ====================== MAIN ======================
async function main() {
  console.log('🚀 Trending Tech Bot started — Target: 3 Spotlights + 2 Threads/day');

  const isDryRun = dryRunFlag || process.env.DRY_RUN === 'true';
  if (isDryRun) console.log('🧪 DRY RUN MODE ENABLED');

  const state = loadState();
  const github = new GitHubService();
  const llm = new LLMService();
  const twitter = new TwitterService(isDryRun);

  // 1. Fetch & Rank Candidates
  let candidates = await fetchAndRankCandidates(github);
  console.log(`[Ingestion] ${candidates.length} candidates ranked.`);

  // 2. Filter already tweeted
  const freshCandidates = forceFlag 
    ? candidates 
    : candidates.filter(r => !state.tweetedIds.includes(r.id));

  console.log(`[Fresh] ${freshCandidates.length} new repositories available.`);

  if (runAllFlag) {
    await runFullBatch(freshCandidates, github, llm, twitter, state, isDryRun);
  } else {
    await runStaggeredPost(freshCandidates, github, llm, twitter, state, isDryRun);
  }
}

// ====================== SMART RANKING ======================
async function fetchAndRankCandidates(github: GitHubService): Promise<RepoInfo[]> {
  let allRepos: RepoInfo[] = [];

  try {
    allRepos = await github.fetchTrendingViaSearch(30, 60);
    const scraped = await github.fetchTrendingViaScraping();
    allRepos.push(...scraped);
  } catch (e) {
    console.error('[Ingestion] Error:', e);
  }

  // Deduplicate
  const seen = new Set<string>();
  allRepos = allRepos.filter(repo => {
    const key = `${repo.owner}/${repo.name}`.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Smart ranking
  return allRepos.sort((a, b) => {
    const scoreA = (a.starsGainedToday || 0) * 3 + (a.stars || 0) / 100;
    const scoreB = (b.starsGainedToday || 0) * 3 + (b.stars || 0) / 100;
    return scoreB - scoreA;
  });
}

// ====================== STAGGERED POSTING ======================
async function runStaggeredPost(
  freshCandidates: RepoInfo[],
  github: GitHubService,
  llm: LLMService,
  twitter: TwitterService,
  state: BotState,
  isDryRun: boolean
) {
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
  const recent = state.history.filter(h => new Date(h.date).getTime() > oneDayAgo);

  const spotlightsToday = recent.filter(h => h.type === 'spotlight').length;
  const threadsToday = recent.filter(h => h.type === 'listicle').length;

  console.log(`[Quota] Spotlights: ${spotlightsToday}/3 | Threads: ${threadsToday}/2`);

  let nextType: 'spotlight' | 'listicle' | null = null;

  if (spotlightsToday < 3 && threadsToday < 2) {
    nextType = spotlightsToday <= threadsToday ? 'spotlight' : 'listicle';
  } else if (spotlightsToday < 3) {
    nextType = 'spotlight';
  } else if (threadsToday < 2) {
    nextType = 'listicle';
  } else {
    console.log('[Quota] Daily target reached. Exiting.');
    return;
  }

  if (nextType === 'spotlight') {
    if (freshCandidates.length === 0) return;
    const repo = freshCandidates[0];
    const success = await postSingleSpotlight(repo, github, llm, twitter);
    if (success) {
      state.tweetedIds.push(repo.id);
      state.history.push({ date: new Date().toISOString(), type: 'spotlight', repoIds: [repo.id] });
      saveState(state);
    }
  } else {
    const reposPerThread = 4;
    if (freshCandidates.length < reposPerThread) return;

    const group = freshCandidates.slice(0, reposPerThread);
    const success = await postSingleListicle(group, llm, twitter);
    if (success) {
      group.forEach(r => state.tweetedIds.push(r.id));
      state.history.push({ date: new Date().toISOString(), type: 'listicle', repoIds: group.map(r => r.id) });
      saveState(state);
    }
  }
}

// ====================== POSTING FUNCTIONS ======================
/**
 * Handles generating and posting a single Spotlight tweet + its threaded reply.
 * Now intelligently tags the author when twitterHandle is available.
 */
async function postSingleSpotlight(
  repo: RepoInfo,
  github: GitHubService,
  llm: LLMService,
  twitter: TwitterService
): Promise<boolean> {
  try {
    console.log(`[Orchestrator] Processing Spotlight for ${repo.owner}/${repo.name}...`);

    const readme = await github.fetchReadme(repo.owner, repo.name);
    let tweetText = await llm.generateSpotlightTweet(repo, readme);

    // === Enhanced Author Tagging Logic ===
    let finalMainTweet = tweetText;

    if (repo.twitterHandle) {
      // If the LLM didn't already mention the handle, add it prominently
      if (!tweetText.includes(`@${repo.twitterHandle}`)) {
        finalMainTweet = tweetText.replace(
          'Breakout Open Source Find of the Day:',
          `Breakout Open Source Find of the Day:`
        );
        
        // Add credit line at the end of the main tweet
        finalMainTweet += `\n\ncc: @${repo.twitterHandle}`;
      }
    }

    const mainTweetWithLinkTeaser = `${finalMainTweet}\n\n🧵 Link + more info in replies 👇`;

    // Post Main Tweet
    const tweetId = await twitter.postTweet(mainTweetWithLinkTeaser);

    // Post Reply with GitHub link
    const replyText = `Repository link:\n👉 ${repo.url}`;
    await twitter.postReply(replyText, tweetId);

    // Optional: Second reply with direct credit (if handle exists)
    if (repo.twitterHandle) {
      await sleep(1500); // Small delay to avoid rate limits
      const creditReply = `Huge thanks to @${repo.twitterHandle} for building this! 🙌`;
      await twitter.postReply(creditReply, tweetId);
    }

    console.log(`✅ Spotlight posted successfully: ${repo.owner}/${repo.name}`);
    return true;
  } catch (err: any) {
    console.error(`❌ Failed to post Spotlight for ${repo.owner}/${repo.name}:`, err.message);
    return false;
  }
}

/**
 * Handles generating and posting a Listicle thread.
 * Now intelligently includes author Twitter handles when available.
 */
async function postSingleListicle(
  group: RepoInfo[],
  llm: LLMService,
  twitter: TwitterService
): Promise<boolean> {
  try {
    console.log(`[Orchestrator] Creating Listicle thread with ${group.length} repos...`);

    const summaries = await llm.generateListicleDescriptions(group, getSmartTheme(group));

    const thread: string[] = [];

    // Thread Opener
    thread.push(`Here are ${group.length} promising new ${getSmartTheme(group)} tools this week 🧵`);

    // Main repo entries with author tagging
    group.forEach((repo, i) => {
      const stars = repo.stars >= 1000 
        ? `${(repo.stars / 1000).toFixed(1)}k` 
        : repo.stars;

      let entry = `${i + 1}️⃣ ${repo.name} (+${stars} stars)\n${summaries[i]}`;

      // Add author handle if available
      if (repo.twitterHandle) {
        entry += `\nby @${repo.twitterHandle}`;
      }

      thread.push(entry);
    });

    // Final Links + Credits tweet
    let linksText = `🔗 All repositories:\n\n`;

    group.forEach((repo, i) => {
      linksText += `${i + 1}. ${repo.owner}/${repo.name}\n`;
      linksText += `   👉 ${repo.url}\n`;
      
      if (repo.twitterHandle) {
        linksText += `   cc: @${repo.twitterHandle}\n`;
      }
      linksText += `\n`;
    });

    thread.push(linksText.trim());

    // Post the thread with backoff
    await withBackoff(() => twitter.postThread(thread));

    console.log(`✅ Listicle thread posted successfully (${group.length} repos)`);
    return true;
  } catch (err: any) {
    console.error('❌ Listicle thread failed:', err.message);
    return false;
  }
}

// ====================== SMART THEME DETECTION ======================
function getSmartTheme(group: RepoInfo[]): string {
  const langCount = group.reduce((acc, r) => {
    acc[r.language] = (acc[r.language] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topLang = Object.entries(langCount).sort((a, b) => b[1] - a[1])[0]?.[0];

  if (!topLang || topLang === 'Unknown') return 'developer';

  const themes: Record<string, string> = {
    'TypeScript': 'TypeScript & Frontend',
    'JavaScript': 'JavaScript & Frontend',
    'Python': 'Python & AI/ML',
    'Rust': 'Rust & Systems',
    'Go': 'Go & Backend',
  };

  return themes[topLang] || `${topLang} Tools`;
}

// ====================== ENTRY POINT ======================
main().catch(err => {
  console.error('💥 Fatal error:', err);
  process.exit(1);
});