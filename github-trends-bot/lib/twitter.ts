// src/twitter.ts
import { TwitterApi } from 'twitter-api-v2';

export class TwitterService {
  private client: TwitterApi | null = null;
  private isDryRun: boolean = false;

  constructor(isDryRun = false) {
    // Explicitly enforce hardcoded 'false' if passed from index.ts, ignoring NODE_ENV shortcuts
    this.isDryRun = isDryRun;

    if (this.isDryRun) {
      console.log('[Twitter Service] ✅ Initialized in DRY-RUN mode');
      return;
    }

    // Fallback checks to catch both common naming strategies
    const appKey = process.env.TWITTER_API_KEY || process.env.TWITTER_CONSUMER_KEY;
    const appSecret = process.env.TWITTER_API_SECRET || process.env.TWITTER_CONSUMER_SECRET;
    const accessToken = process.env.TWITTER_ACCESS_TOKEN;
    const accessSecret = process.env.TWITTER_ACCESS_SECRET;

    if (!appKey || !appSecret || !accessToken || !accessSecret) {
      console.warn('[Twitter Service] ⚠️ Missing credentials → Falling back to DRY-RUN mode');
      this.isDryRun = true;
      return;
    }

    this.client = new TwitterApi({
      appKey,
      appSecret,
      accessToken,
      accessSecret,
    });

    console.log('[Twitter Service] ✅ Initialized in PRODUCTION mode');
  }

  /**
   * Posts a single tweet with retry logic
   */
  async postTweet(text: string): Promise<string> {
    this.validateTweetLength(text, "Tweet");

    if (this.isDryRun) {
      this.logDryRun('TWEET', text);
      return `dry-run-id-${Date.now()}`;
    }

    return this.withBackoff(async () => {
      if (!this.client) throw new Error('Twitter client not initialized');
      
      const response = await this.client.v2.tweet(text);
      console.log(`✅ [Twitter] Posted tweet → ${response.data.id}`);
      return response.data.id;
    });
  }

  /**
   * Posts a reply to an existing tweet
   */
  async postReply(text: string, replyToTweetId: string): Promise<string> {
    this.validateTweetLength(text, "Reply");

    if (this.isDryRun) {
      this.logDryRun(`REPLY to ${replyToTweetId}`, text);
      return `dry-run-reply-${Date.now()}`;
    }

    return this.withBackoff(async () => {
      if (!this.client) throw new Error('Twitter client not initialized');

      const response = await this.client.v2.tweet(text, {
        reply: { in_reply_to_tweet_id: replyToTweetId }
      });

      console.log(`✅ [Twitter] Posted reply → ${response.data.id}`);
      return response.data.id;
    });
  }

  /**
   * Posts a full thread
   */
  async postThread(tweets: string[]): Promise<string[]> {
    if (tweets.length === 0) throw new Error('Cannot post empty thread');

    if (this.isDryRun) {
      this.logDryRunThread(tweets);
      return tweets.map((_, i) => `dry-run-thread-${i}-${Date.now()}`);
    }

    return this.withBackoff(async () => {
      if (!this.client) throw new Error('Twitter client not initialized');

      console.log(`[Twitter] Posting thread with ${tweets.length} tweets...`);
      const response = await this.client.v2.tweetThread(tweets);

      const ids = response.map(r => r.data.id);
      console.log(`✅ [Twitter] Successfully posted thread (${ids.length} tweets)`);
      return ids;
    });
  }

  // ====================== HELPERS ======================

  private async withBackoff<T>(fn: () => Promise<T>, maxRetries = 5): Promise<T> {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error: any) {
        const isRateLimit = error.code === 429 || 
                           error.status === 429 || 
                           error.message?.includes('429') ||
                           error.message?.includes('Rate limit');

        if (!isRateLimit || attempt === maxRetries) {
          console.error(`❌ [Twitter] Failed after ${attempt + 1} attempts:`, error.message);
          throw error;
        }

        const delay = Math.min(Math.pow(2, attempt) * 1500, 30000); // max 30s
        console.warn(`⏳ [Twitter] Rate limited. Retrying in ${delay}ms... (Attempt ${attempt + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    throw new Error('Max retries exceeded');
  }

  private validateTweetLength(text: string, type: string): void {
    if (text.length > 280) {
      console.warn(`⚠️ [Twitter] ${type} exceeds 280 characters (${text.length}). It will be truncated by Twitter.`);
    }
  }

  private logDryRun(type: string, text: string): void {
    console.log(`\n🔍 [DRY RUN ${type}]`.padEnd(50, '-'));
    console.log(text);
    console.log('-'.repeat(50) + '\n');
  }

  private logDryRunThread(tweets: string[]): void {
    console.log(`\n🔍 [DRY RUN THREAD (${tweets.length} tweets)]`.padEnd(60, '-'));
    tweets.forEach((tweet, i) => {
      console.log(`Tweet ${i + 1}/${tweets.length}:\n${tweet}\n`);
    });
    console.log('-'.repeat(60) + '\n');
  }
}