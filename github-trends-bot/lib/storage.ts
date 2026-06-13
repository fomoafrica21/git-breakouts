import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const PENDING_FILE = path.join(DATA_DIR, 'pending-posts.json');

export type PostType = 'spotlight' | 'listicle';

export interface PendingPost {
  id: string;
  type: PostType;
  content: string[];
  repos: any[];
  createdAt: string;
  status: 'pending' | 'posted' | 'rejected';
}

export async function savePendingPosts(posts: PendingPost[]) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(PENDING_FILE, JSON.stringify(posts, null, 2));
}

export async function getPendingPosts(): Promise<PendingPost[]> {
  if (!fs.existsSync(PENDING_FILE)) return [];
  const data = fs.readFileSync(PENDING_FILE, 'utf8');
  return JSON.parse(data);
}

export async function updatePostStatus(postId: string, status: 'posted' | 'rejected') {
  const posts = await getPendingPosts();
  const updated = posts.map(p => p.id === postId ? { ...p, status } : p);
  await savePendingPosts(updated);
}

export async function updatePost(postId: string, updates: Partial<PendingPost>) {
  const posts = await getPendingPosts();
  const updated = posts.map(p => p.id === postId ? { ...p, ...updates } : p);
  await savePendingPosts(updated);
}