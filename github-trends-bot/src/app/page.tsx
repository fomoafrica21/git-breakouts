'use client';

import { useState, useEffect } from 'react';
import PostCard from '@/components/PostCard';

export default function Dashboard() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [authChecking, setAuthChecking] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const auth = sessionStorage.getItem('isAuthenticated');
      if (auth === 'true') {
        setIsAuthenticated(true);
      }
    }
    setAuthChecking(false);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchPosts();
    }
  }, [isAuthenticated]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/posts');
      const data = await res.json();
      if (res.ok) {
        setPosts(data);
      } else {
        console.error('Failed to fetch posts:', data.error);
      }
    } catch (err) {
      console.error('Error fetching posts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
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
    } catch (err) {
      setError('Server connection error. Please try again.');
    }
  };

  const handleGenerate = async () => {
    if (isGenerating) return;
    setIsGenerating(true);

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
      });
      const data = await res.json();

      if (res.ok) {
        alert('✨ Discovery task complete! Curated breakout posts are ready.');
        fetchPosts();
      } else {
        alert(`❌ Generation failed: ${data.error || 'Unknown error'}`);
      }
    } catch (err) {
      alert('Failed to connect to the discovery backend. Please verify server status.');
    } finally {
      setIsGenerating(false);
    }
  };

  if (authChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-blue-500/10 rounded-full blur-[60px]" />
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-500/20 border-t-blue-500 relative z-10"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white px-4 relative overflow-hidden">
        {/* Sleek radial glowing background grids */}
        <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-blue-500/10 via-transparent to-transparent blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-[350px] h-[350px] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="w-full max-w-md bg-gray-900/40 backdrop-blur-2xl border border-gray-800/80 p-8 rounded-3xl shadow-2xl relative z-10">
          <div className="text-center mb-8">
            <span className="bg-gradient-to-r from-blue-500/20 to-indigo-500/20 border border-blue-500/25 text-blue-400 text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-widest inline-block">
              Moderation Portal
            </span>
            <h1 className="text-3xl font-black mt-4 tracking-tight bg-gradient-to-r from-white via-gray-100 to-gray-400 bg-clip-text text-transparent">
              Git Breakouts
            </h1>
            <p className="text-gray-400 text-xs mt-2">
              Unlock the scheduler dashboard to review and approve X postings
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-widest text-gray-400 mb-2">
                System Password
              </label>
              <input
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3.5 bg-gray-950/80 border border-gray-800 focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/60 rounded-xl text-white outline-none transition duration-200 placeholder-gray-700 text-sm"
                required
              />
            </div>

            {error && (
              <p className="text-xs text-red-400 font-medium bg-red-500/10 border border-red-500/20 px-3.5 py-2.5 rounded-xl flex items-center gap-2">
                <span>⚠️</span> {error}
              </p>
            )}

            <button
              type="submit"
              className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-[0.98] text-white text-sm font-bold rounded-xl shadow-lg hover:shadow-indigo-500/10 transition duration-200"
            >
              Access Dashboard
            </button>
          </form>
        </div>
      </div>
    );
  }

  const spotlightCount = posts.filter(p => p.type === 'spotlight').length;
  const listicleCount = posts.filter(p => p.type === 'listicle').length;

  return (
    <div className="min-h-screen bg-gray-950 text-white px-4 sm:px-8 py-10 relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-[150px] pointer-events-none" />

      <div className="max-w-5xl mx-auto relative z-10">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-10 pb-8 border-b border-gray-900">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent">
              Git Breakouts Dashboard
            </h1>
            <p className="text-gray-400 text-sm mt-1.5">
              Automated curation of breakout GitHub tech repositories
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => {
                sessionStorage.removeItem('isAuthenticated');
                setIsAuthenticated(false);
              }}
              className="px-4 py-2.5 bg-gray-900/60 hover:bg-gray-900 border border-gray-850 hover:border-gray-800 text-xs font-semibold rounded-xl text-gray-400 hover:text-gray-200 transition"
            >
              Sign Out
            </button>
            <button
              onClick={fetchPosts}
              disabled={loading || isGenerating}
              className="px-4 py-2.5 bg-gray-900/60 hover:bg-gray-900 border border-gray-850 hover:border-gray-800 text-xs font-semibold rounded-xl transition flex items-center justify-center gap-2 text-gray-300"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 border border-white/20 border-t-white"></div>
                  <span>Syncing...</span>
                </>
              ) : (
                <>
                  <span>🔄 Refresh</span>
                </>
              )}
            </button>
            <button
              onClick={handleGenerate}
              disabled={isGenerating || loading}
              className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:from-gray-900 disabled:to-gray-950 text-xs font-bold text-white rounded-xl transition shadow-lg shadow-emerald-950/20 flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white/20 border-t-white"></div>
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <span>⚡ Discover Breakouts</span>
                </>
              )}
            </button>
          </div>
        </header>

        {/* Stats Section */}
        {posts.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-gray-900/30 border border-gray-900/80 p-4 rounded-2xl flex flex-col justify-center">
              <span className="text-gray-500 text-[10px] uppercase font-bold tracking-widest">Queue Status</span>
              <span className="text-xl sm:text-2xl font-black mt-1 text-blue-400">{posts.length} pending</span>
            </div>
            <div className="bg-gray-900/30 border border-gray-900/80 p-4 rounded-2xl flex flex-col justify-center">
              <span className="text-gray-500 text-[10px] uppercase font-bold tracking-widest">Spotlights</span>
              <span className="text-xl sm:text-2xl font-black mt-1 text-cyan-400">{spotlightCount} posts</span>
            </div>
            <div className="bg-gray-900/30 border border-gray-900/80 p-4 rounded-2xl flex flex-col justify-center">
              <span className="text-gray-500 text-[10px] uppercase font-bold tracking-widest">Threads</span>
              <span className="text-xl sm:text-2xl font-black mt-1 text-purple-400">{listicleCount} listicles</span>
            </div>
          </div>
        )}

        {/* Content list */}
        {loading && posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 bg-gray-900/10 border border-gray-900/60 rounded-3xl">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500/20 border-t-blue-500 mb-4"></div>
            <p className="text-gray-400 text-xs font-semibold tracking-wide">Syncing post directory...</p>
          </div>
        ) : isGenerating && posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 bg-gray-900/10 border border-gray-900/60 rounded-3xl px-6 text-center">
            <div className="relative w-12 h-12 mb-6">
              <div className="absolute inset-0 rounded-full border border-emerald-500/20 animate-ping" />
              <div className="absolute inset-2 rounded-full border border-emerald-500/40 animate-pulse" />
              <div className="absolute inset-4 rounded-full border-t-2 border-b-2 border-emerald-500 animate-spin" />
            </div>
            <h3 className="text-lg font-bold">Discovering Breakouts</h3>
            <p className="text-gray-400 text-xs mt-2 max-w-sm leading-relaxed">
              Scraping active repositories, calculating quality scores, and leveraging Gemini to generate premium tweets. This takes around 15-30s.
            </p>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20 bg-gray-900/15 border border-gray-900/60 rounded-3xl px-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-gray-950/40 pointer-events-none" />
            <div className="relative z-10 max-w-md mx-auto">
              <div className="w-14 h-14 bg-gray-900/60 border border-gray-850 rounded-2xl flex items-center justify-center mx-auto mb-6 text-2xl shadow-inner select-none">
                📭
              </div>
              <h3 className="text-lg font-extrabold tracking-tight">Queue is Empty</h3>
              <p className="text-gray-400 text-xs mt-2 mb-8 leading-relaxed">
                There are no pending social posts in your curation buffer. Click the discover button below to run an immediate API scan and populate the dashboard.
              </p>
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="px-6 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-xs font-bold text-white rounded-xl shadow-lg active:scale-[0.98] transition duration-200 flex items-center justify-center gap-2 mx-auto"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border border-white/20 border-t-white"></div>
                    Generating Discoveries...
                  </>
                ) : (
                  <>
                    <span>🚀 Discover Breakout Repositories</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {posts.map((post, index) => (
              <PostCard key={post.id || index} post={post} onUpdate={fetchPosts} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
