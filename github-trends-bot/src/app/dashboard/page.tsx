'use client';

import { useState, useEffect } from 'react';
import PostCard from '@/components/PostCard';

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'breakouts2025';

export default function Dashboard() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (isAuthenticated) fetchPosts();
  }, [isAuthenticated]);

  const fetchPosts = async () => {
    const res = await fetch('/api/posts');
    const data = await res.json();
    setPosts(data);
    setLoading(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  setError('');

  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });

  const data = await res.json();

  if (data.success) {
    setIsAuthenticated(true);
    sessionStorage.setItem('isAuthenticated', 'true');
  } else {
    setError(data.message || 'Incorrect password');
  }
};

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">
        <div className="bg-gray-900 p-8 rounded-xl w-96">
          <h1 className="text-2xl font-bold mb-6">Git Breakouts Dashboard</h1>
          <input
            type="password"
            placeholder="Enter admin password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 bg-gray-800 rounded mb-4"
          />
          <button
            onClick={handleLogin}
            className="w-full bg-blue-600 hover:bg-blue-700 p-3 rounded font-medium"
          >
            Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Git Breakouts Dashboard</h1>
          <button
            onClick={() => fetchPosts()}
            className="bg-gray-800 hover:bg-gray-700 px-5 py-2 rounded-lg"
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <p>Loading discoveries...</p>
        ) : posts.length === 0 ? (
          <p>No pending posts. Run generation via GitHub Actions.</p>
        ) : (
          <div className="grid gap-6">
            {posts.map((post, index) => (
              <PostCard key={index} post={post} onUpdate={fetchPosts} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}