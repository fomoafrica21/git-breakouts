// src/verify.ts
import { GitHubService, RepoInfo } from './github.js';
import { LLMService } from './llm.js';

async function runVerification() {
  console.log('🔍 [Verification] Starting full layout, character limit & handle integration test...\n');

  const llm = new LLMService('MOCK_KEY'); // Forces mock/fallback mode

  // More realistic mock repos (including one with Twitter handle)
  const mockRepos: RepoInfo[] = [
    {
      id: 1,
      owner: 'shadcn',
      name: 'ui',
      url: 'https://github.com/shadcn/ui',
      description: 'Beautifully designed components that you can copy and paste into your apps.',
      language: 'TypeScript',
      stars: 68200,
      forks: 4200,
      starsGainedToday: 890,
      twitterHandle: 'shadcn',
      createdAt: new Date().toISOString(),
    },
    {
      id: 2,
      owner: 'test-owner-with-very-long-name',
      name: 'mega-project-with-extremely-long-repository-name',
      url: 'https://github.com/test-owner-with-very-long-name/mega-project-with-extremely-long-repository-name',
      description: 'An extremely long description designed to test truncation logic, character boundaries, and how the system handles verbose content while maintaining tweet quality and engagement potential.',
      language: 'Rust',
      stars: 2450,
      forks: 189,
      starsGainedToday: 320,
      twitterHandle: undefined,
      createdAt: new Date().toISOString(),
    },
    {
      id: 3,
      owner: 'small',
      name: 'tiny',
      url: 'https://github.com/small/tiny',
      description: 'Short and sweet.',
      language: 'Python',
      stars: 87,
      forks: 12,
      starsGainedToday: 14,
      twitterHandle: 'tinyauthor',
      createdAt: new Date().toISOString(),
    }
  ];

  let testFailed = false;

  // ====================== SPOTLIGHT VERIFICATION ======================
  console.log('📍 Testing Spotlight Tweets (with author handles)...');
  for (const repo of mockRepos) {
    const tweetText = await llm.generateSpotlightTweet(repo, 'Mock README content for testing...');
    const finalTweet = `${tweetText}\n\n🧵 Link in replies 👇`;

    console.log(`\nRepo: ${repo.owner}/${repo.name}`);
    console.log(`Length: ${finalTweet.length} chars`);
    console.log(`Contains handle: ${finalTweet.includes('@' + repo.twitterHandle) ? 'YES' : 'NO'}`);

    if (finalTweet.length > 265) {   // Conservative safe limit
      console.error(`❌ FAIL: Spotlight exceeds safe limit (${finalTweet.length})`);
      testFailed = true;
    } else {
      console.log('✅ Spotlight OK');
    }
  }

  // ====================== LISTICLE / THREAD VERIFICATION ======================
  console.log('\n🧵 Testing Listicle Thread...');
  const summaries = await llm.generateListicleDescriptions(mockRepos, 'Developer Tools');

  const thread: string[] = [];

  thread.push(`Here are ${mockRepos.length} promising new ${getSmartTheme(mockRepos)} tools this week 🧵`);

  mockRepos.forEach((repo, i) => {
    const stars = repo.stars >= 1000 ? `${(repo.stars / 1000).toFixed(1)}k` : repo.stars;
    let entry = `${i + 1}️⃣ ${repo.name} (+${stars} stars)\n${summaries[i]}`;
    if (repo.twitterHandle) entry += `\nby @${repo.twitterHandle}`;
    thread.push(entry);
  });

  // Final links tweet
  let linksText = `🔗 All repositories:\n\n`;
  mockRepos.forEach((repo, i) => {
    linksText += `${i + 1}. ${repo.owner}/${repo.name}\n   👉 ${repo.url}\n`;
    if (repo.twitterHandle) linksText += `   cc: @${repo.twitterHandle}\n`;
    linksText += `\n`;
  });
  thread.push(linksText.trim());

  // Check each tweet in thread
  thread.forEach((tweet, idx) => {
    console.log(`\nThread Tweet ${idx + 1}: ${tweet.length} chars`);
    if (tweet.length > 265) {
      console.error(`❌ FAIL: Thread tweet ${idx + 1} too long`);
      testFailed = true;
    } else {
      console.log('✅ Thread tweet OK');
    }
  });

  // Final Result
  if (testFailed) {
    console.error('\n❌ VERIFICATION FAILED — Fix character limits or prompt logic.');
    process.exit(1);
  } else {
    console.log('\n🏆 VERIFICATION PASSED — All formats are within safe limits!');
  }
}

function getSmartTheme(group: RepoInfo[]): string {
  const langs = [...new Set(group.map(r => r.language).filter(Boolean))];
  return langs.length > 0 ? langs.slice(0, 2).join(' & ') : 'developer';
}

runVerification().catch(err => {
  console.error('Fatal verification error:', err);
  process.exit(1);
});