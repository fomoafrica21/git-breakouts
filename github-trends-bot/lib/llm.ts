// src/llm.ts
import OpenAI from "openai";
import { RepoInfo } from './github.js';

export class LLMService {
  private client: OpenAI | null = null;
  // Commenting out Grok for now
  // private modelName = 'grok-4.3';

  private modelName = 'gemini-2.5-flash';

  constructor(apiKey?: string) {
    // Commenting out xAI token extraction for now
    // const key = apiKey || process.env.XAI_API_KEY;
    const key = apiKey || process.env.GEMINI_API_KEY;

    if (!key) {
      console.warn('[LLM Service] XAI_API_KEY is not defined. Using mock mode.');
      this.client = null;
    } else {
      this.client = new OpenAI({
        apiKey: key,
        // baseURL: "https://api.x.ai/v1",

        // Directing requests to the Google AI Studio compatibility layer endpoint
        baseURL: "https://generativelanguage.googleapis.com/v1beta/openai",
      });
    }
  }

  /**
   * Generates a Spotlight tweet – now intelligently uses Twitter handle when available
   */
  async generateSpotlightTweet(repo: RepoInfo, readme: string): Promise<string> {
    if (!this.client) {
      return this.getFallbackSpotlight(repo);
    }

    const readmeSnippet = readme.slice(0, 7500);
    const authorTag = repo.twitterHandle 
      ? ` by @${repo.twitterHandle}` 
      : '';

    const prompt = `
You are a sharp senior developer sharing exciting new tools on X.

Repository:
- Name: ${repo.name}
- Owner: ${repo.owner}${authorTag}
- Description: ${repo.description}
- Language: ${repo.language}
- Stars: ${repo.stars}

README Snippet:
---
${readmeSnippet}
---

Write one spotlight tweet using this exact structure:

🚀 Breakout Open Source Find of the Day:
[${repo.name}]${authorTag ? ` by @${repo.twitterHandle}` : ''} — [Sharp, compelling hook under 75 characters]

Why it's blowing up (+[realistic momentum] stars recently):
• [Punchy bullet 1, under 55 chars]
• [Punchy bullet 2, under 55 chars]
• [Punchy bullet 3, under 55 chars]

Perfect for [specific developer audience/use case].

STRICT RULES:
- Maximum 255 characters total
- No hashtags
- No corporate buzzwords (revolutionizes, streamlines, cutting-edge, etc.)
- Sound like a helpful senior dev
- Do not include any links`;

    try {
      console.log(`[LLM] Generating Spotlight for ${repo.owner}/${repo.name}${repo.twitterHandle ? ` (@${repo.twitterHandle})` : ''}`);

      const response = await this.client.chat.completions.create({
        model: this.modelName,
        messages: [
          { 
            role: "system", 
            content: "You are an authentic, high-signal tech Twitter curator with excellent taste." 
          },
          { role: "user", content: prompt }
        ],
        max_tokens: 380,
        temperature: 0.76,
      });

      let text = response.choices[0]?.message?.content?.trim() || '';
      return this.cleanTweetText(text);

    } catch (error: any) {
      console.error('[LLM] Spotlight generation error:', error.message);
      return this.getFallbackSpotlight(repo);
    }
  }

  /**
   * Generates descriptions for Listicle threads
   */
  async generateListicleDescriptions(repos: RepoInfo[], theme?: string): Promise<string[]> {
    if (!this.client) {
      return repos.map(r => r.description?.slice(0, 105) || "Interesting new tool.");
    }

    const reposInput = repos.map((r, i) => {
      const handle = r.twitterHandle ? ` (@${r.twitterHandle})` : '';
      return `${i+1}. ${r.owner}/${r.name}${handle} — ${r.description} (${r.language})`;
    }).join('\n');

    const prompt = `
You are writing a high-quality tech thread on X.

Theme: ${theme || 'Developer Tools'}

Repositories:
${reposInput}

For each repo, write **one** natural, punchy sentence (max 108 characters).

Rules:
- Sound like a senior developer
- Focus on real value
- No hype words
- Output ONLY a valid JSON array of strings in the same order`;

    try {
      const response = await this.client.chat.completions.create({
        model: this.modelName,
        messages: [
          { role: "system", content: "You are concise and insightful." },
          { role: "user", content: prompt }
        ],
        max_tokens: 600,
        temperature: 0.7,
      });

      let text = response.choices[0]?.message?.content?.trim() || '';
      text = text.replace(/```json/g, '').replace(/```/g, '').trim();

      const descriptions = JSON.parse(text);
      return Array.isArray(descriptions) 
        ? descriptions.map(d => this.cleanTweetText(d))
        : repos.map(() => "Interesting new developer tool.");
    } catch (error) {
      console.error('[LLM] Listicle generation error:', error);
      return repos.map(r => r.description?.slice(0, 105) || "Cool new tool.");
    }
  }

  /** Fallback for when LLM fails */
 /** Fallback for when LLM fails */
  private getFallbackSpotlight(repo: RepoInfo): string {
    const handle = repo.twitterHandle ? ` by @${repo.twitterHandle}` : '';
    const desc = repo.description?.length > 50 
      ? repo.description.slice(0, 47) + '...' 
      : repo.description || 'A promising new developer tool';

    // 🚀 Unique ID suffix helps bypass Twitter's duplicate spam filters
    const uniqueId = Math.floor(1000 + Math.random() * 9000);

    return `🚀 Open Source Find: ${repo.name}${handle}\n\n"${desc}"\n\n• Built in ${repo.language || 'Code'}\n• Tracked live [Ref: #${uniqueId}]`;
  }

  private cleanTweetText(text: string): string {
    return text
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/#/g, '')
      .trim();
  }
}