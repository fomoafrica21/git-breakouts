import { GitHubService } from '@/lib/github';
import { LLMService } from '@/lib/llm';
import { savePendingPosts } from '@/lib/storage';
import { PendingPost } from '@/lib/storage';

async function generateDailyContent() {
  console.log('🚀 Starting daily content generation...');

  const github = new GitHubService();
  const llm = new LLMService();

  // Fetch and rank candidates
  let candidates = await github.fetchTrendingViaSearch(25, 40);
  const scraped = await github.fetchTrendingViaScraping();
  candidates.push(...scraped);

  // Deduplicate
  const seen = new Set<string>();
  candidates = candidates.filter(repo => {
    const key = `${repo.owner}/${repo.name}`.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Sort by quality
  candidates.sort((a, b) => (b.qualityScore || 0) - (a.qualityScore || 0));

  const freshCandidates = candidates.slice(0, 15); // Take top 15 for processing

  const pendingPosts: PendingPost[] = [];
  const usedRepos: any[] = [];

  // === Generate 3 Spotlights ===
  console.log('📍 Generating 3 Spotlight posts...');
  for (let i = 0; i < 3 && i < freshCandidates.length; i++) {
    const repo = freshCandidates[i];
    const readme = await github.fetchReadme(repo.owner, repo.name);
    const content = await llm.generateSpotlightTweet(repo, readme);

    pendingPosts.push({
      id: `spotlight-${Date.now()}-${i}`,
      type: 'spotlight',
      content: [content],
      repos: [repo],
      createdAt: new Date().toISOString(),
      status: 'pending'
    });

    usedRepos.push(repo);
  }

  // === Generate 2 Listicle Threads ===
  console.log('🧵 Generating 2 Listicle threads...');
  const remaining = freshCandidates.slice(3);

  for (let i = 0; i < 2; i++) {
    const group = remaining.slice(i * 4, i * 4 + 4);
    if (group.length < 3) break;

    const summaries = await llm.generateListicleDescriptions(group, undefined);
    const threadContent: string[] = [];

    threadContent.push(`Here are ${group.length} promising new ${getTheme(group)} tools this week 🧵`);

    group.forEach((repo, idx) => {
      const stars = repo.stars >= 1000 ? `${(repo.stars / 1000).toFixed(1)}k` : repo.stars;
      let entry = `${idx + 1}️⃣ ${repo.name} (+${stars} stars)\n${summaries[idx]}`;
      if (repo.twitterHandle) entry += `\nby @${repo.twitterHandle}`;
      threadContent.push(entry);
    });

    let links = `🔗 All repositories:\n\n`;
    group.forEach((repo, idx) => {
      links += `${idx + 1}. ${repo.owner}/${repo.name}\n👉 ${repo.url}\n`;
      if (repo.twitterHandle) links += `cc: @${repo.twitterHandle}\n`;
      links += `\n`;
    });
    threadContent.push(links.trim());

    pendingPosts.push({
      id: `listicle-${Date.now()}-${i}`,
      type: 'listicle',
      content: threadContent,
      repos: group,
      createdAt: new Date().toISOString(),
      status: 'pending'
    });
  }

  await savePendingPosts(pendingPosts);
  console.log(`✅ Generated ${pendingPosts.length} pending posts successfully!`);
}

function getTheme(group: any[]): string {
  const langs = [...new Set(group.map(r => r.language).filter(Boolean))];
  return langs.length > 0 ? langs.slice(0, 2).join(' & ') : 'developer';
}

import { fileURLToPath } from 'url';
import fs from 'fs';

// Run if called directly
const isMain = () => {
  if (typeof require !== 'undefined' && require.main === module) {
    return true;
  }
  try {
    if (import.meta.url && process.argv[1]) {
      const modulePath = fileURLToPath(import.meta.url);
      const scriptPath = fs.realpathSync(process.argv[1]);
      return modulePath === scriptPath;
    }
  } catch (e) {}
  return false;
};

if (isMain()) {
  generateDailyContent().catch(console.error);
}

export { generateDailyContent };