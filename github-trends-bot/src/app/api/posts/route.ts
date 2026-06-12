import { NextResponse } from 'next/server';
import { getPendingPosts } from '@/lib/storage';

export async function GET() {
  const posts = await getPendingPosts();
  return NextResponse.json(posts.filter(p => p.status === 'pending'));
}