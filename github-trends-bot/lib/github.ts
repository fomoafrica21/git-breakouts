import axios from 'axios';
import * as cheerio from 'cheerio';

export interface RepoInfo {
  id: number;
  owner: string;
  name: string;
  url: string;
  description: string;
  language: string;
  stars: number;
  forks?: number;
  starsGainedToday?: number;
  twitterHandle?: string;
  createdAt: string;
  qualityScore?: number;
}

export class GitHubService {
  private token: string | undefined;

  constructor(token?: string) {
    this.token = token || process.env.GITHUB_TOKEN;
    if (this.token) {
      console.log('[GitHub Service] ✅ GitHub token loaded (higher rate limits)');
    }
  }

  private getHeaders() {
    const headers: Record<string, string> = {
      'User-Agent': 'TrendingTechAssetsBot/1.0',
      'Accept': 'application/vnd.github.v3+json',
    };
    if (this.token) {
      headers['Authorization'] = `token ${this.token}`;
    }
    return headers;
  }

  /**
   * Fetch trending repos with improved breakout detection
   */
  async fetchTrendingViaSearch(daysAgo = 25, minStars = 40): Promise<RepoInfo[]> {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    const dateString = date.toISOString().split('T')[0];

    // Stronger query for high-velocity breakouts
    const q = `created:>${dateString} stars:>${minStars} fork:false pushed:>${dateString}`;
    const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(q)}&sort=stars&order=desc&per_page=60`;

    try {
      console.log(`[GitHub] Search API → Query: created > ${dateString}, stars > ${minStars}`);
      const response = await axios.get(url, { headers: this.getHeaders() });
      const items = response.data.items || [];

      return items.map((item: any) => this.mapSearchRepo(item, daysAgo));
    } catch (error: any) {
      console.error('[GitHub] Search API failed:', error.message);
      if (error.response?.status === 403) {
        console.warn('[GitHub] Rate limit hit on Search API');
      }
      return [];
    }
  }

  /**
   * Scrape GitHub Trending page (best for real daily velocity)
   */
  async fetchTrendingViaScraping(): Promise<RepoInfo[]> {
    const url = 'https://github.com/trending';

    try {
      console.log('[GitHub] Scraping official Trending page...');
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        timeout: 15000,
      });

      const $ = cheerio.load(response.data);
      const repos: RepoInfo[] = [];

      $('.Box-row').each((_, element) => {
        try {
          const repo = this.parseTrendingRow($, element);
          if (repo) repos.push(repo);
        } catch (_) {}
      });

      return repos;
    } catch (error: any) {
      console.error('[GitHub] Scraping failed:', error.message);
      return [];
    }
  }

  /**
   * Fetch README with multiple fallback strategies
   */
  async fetchReadme(owner: string, repo: string): Promise<string> {
    const possibleFiles = ['README.md', 'README', 'README.txt', 'Readme.md'];

    for (const file of possibleFiles) {
      try {
        const url = `https://api.github.com/repos/${owner}/${repo}/contents/${file}`;
        const response = await axios.get(url, { headers: this.getHeaders() });

        if (response.data?.content) {
          const content = Buffer.from(response.data.content, 'base64').toString('utf8');
          console.log(`[GitHub] README fetched: ${file}`);
          return content;
        }
      } catch (_) {}
    }

    console.warn(`[GitHub] No README found for ${owner}/${repo}`);
    return '';
  }

  // ====================== INTERNAL HELPERS ======================

  private mapSearchRepo(item: any, daysAgo: number): RepoInfo {
    return {
      id: item.id,
      owner: item.owner.login,
      name: item.name,
      url: item.html_url,
      description: item.description || '',
      language: item.language || 'Unknown',
      stars: item.stargazers_count,
      forks: item.forks_count,
      createdAt: item.created_at,
      starsGainedToday: Math.round((item.stargazers_count || 0) / Math.max(daysAgo, 1)),
      qualityScore: this.calculateQualityScore(item),
    };
  }

  private parseTrendingRow($: cheerio.CheerioAPI, element: any): RepoInfo | null {
    const titleAnchor = $(element).find('h2.h3 a');
    const href = titleAnchor.attr('href') || '';
    if (!href) return null;

    const parts = href.split('/').filter(Boolean);
    if (parts.length < 2) return null;

    const [owner, name] = parts;
    const description = $(element).find('p.col-9').text().trim();
    const language = $(element).find('span[itemprop="programmingLanguage"]').text().trim() || 'Unknown';

    const starsText = $(element).find('a[href$="/stargazers"]').text().trim().replace(/,/g, '');
    const starsGainedText = $(element).find('span.d-inline-block.float-sm-right').text().trim();

    const twitterHandle = this.extractTwitterHandle($, element);

    return {
      id: Math.abs(hashCode(`${owner}/${name}`)),
      owner,
      name,
      url: `https://github.com/${owner}/${name}`,
      description: description || '',
      language,
      stars: parseInt(starsText, 10) || 0,
      forks: 0,
      starsGainedToday: parseInt(starsGainedText.replace(/[^0-9]/g, ''), 10) || 0,
      twitterHandle,
      createdAt: new Date().toISOString(),
      qualityScore: this.calculateScrapedQualityScore(starsGainedText),
    };
  }

  private extractTwitterHandle($: cheerio.CheerioAPI, element: any): string | undefined {
    // Look for Twitter/X links in repo description or meta
    const link = $(element).find('a').filter((_, el) => {
      const href = $(el).attr('href') || '';
      return href.includes('twitter.com') || href.includes('x.com');
    }).first().attr('href');

    if (link) {
      const match = link.match(/(?:twitter\.com|x\.com)\/([^\/]+)/);
      return match ? match[1] : undefined;
    }
    return undefined;
  }

  private calculateQualityScore(item: any): number {
    const stars = item.stargazers_count || 0;
    const recentActivity = item.updated_at ? 1 : 0;
    return Math.log10(stars + 1) * 10 + recentActivity * 5;
  }

  private calculateScrapedQualityScore(starsGainedText: string): number {
    const gained = parseInt(starsGainedText.replace(/[^0-9]/g, ''), 10) || 0;
    return gained * 2.5; // Heavy weight on daily velocity
  }
}

// Simple hash for scraped repos
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const chr = str.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0;
  }
  return hash;
}