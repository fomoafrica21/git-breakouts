import { NextRequest, NextResponse } from 'next/server';
import { getPendingPosts, updatePost } from '@/lib/storage';

export async function GET() {
  const posts = await getPendingPosts();
  return NextResponse.json(posts.filter(p => p.status === 'pending'));
}

export async function POST(request: NextRequest) {
  try {
    const { postId, content, status } = await request.json();

    if (!postId) {
      return NextResponse.json({ error: 'Missing postId' }, { status: 400 });
    }

    const updates: any = {};
    if (content !== undefined) updates.content = content;
    if (status !== undefined) {
      if (!['pending', 'posted', 'rejected'].includes(status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
      }
      updates.status = status;
    }

    await updatePost(postId, updates);
    return NextResponse.json({ success: true, message: 'Post updated successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update post' }, { status: 500 });
  }
}