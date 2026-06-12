import { NextRequest, NextResponse } from 'next/server';
import { TwitterService } from '@/lib/twitter';
import { updatePostStatus, getPendingPosts } from '@/lib/storage';

export async function POST(request: NextRequest) {
  try {
    const { postId, content } = await request.json();

    if (!postId || !content) {
      return NextResponse.json({ error: 'Missing postId or content' }, { status: 400 });
    }

    const twitter = new TwitterService(false); // Production mode
    const posts = await getPendingPosts();
    const post = posts.find(p => p.id === postId);

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    console.log(`📤 Posting to X: ${post.type} (${postId})`);

    if (post.type === 'spotlight') {
      // Post main tweet
      const tweetId = await twitter.postTweet(content[0]);

      // Post link reply
      if (post.repos?.[0]?.url) {
        await twitter.postReply(`👉 ${post.repos[0].url}`, tweetId);
      }

    } else if (post.type === 'listicle') {
      // Post full thread
      await twitter.postThread(content);
    }

    // Mark as posted
    await updatePostStatus(postId, 'posted');

    return NextResponse.json({ 
      success: true, 
      message: `${post.type} posted successfully to X!` 
    });

  } catch (error: any) {
    console.error('Error posting to Twitter:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to post to X' 
    }, { status: 500 });
  }
}