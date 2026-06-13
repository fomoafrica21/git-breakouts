'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import PostEditor from './PostEditor';

interface PostCardProps {
  post: any;
  onUpdate: () => void;
}

export default function PostCard({ post, onUpdate }: PostCardProps) {
  const [showEditor, setShowEditor] = useState(false);
  const [isPosting, setIsPosting] = useState(false);

  const handlePostDirectly = async () => {
    if (isPosting) return;
    setIsPosting(true);

    try {
      const res = await fetch('/api/twitter/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId: post.id,
          content: post.content,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        alert(`✅ ${post.type.toUpperCase()} posted successfully to X!`);
        onUpdate();
      } else {
        alert(`❌ Failed: ${data.error || 'Unknown error'}`);
      }
    } catch (err) {
      alert('Failed to post. Please check your connection.');
    } finally {
      setIsPosting(false);
    }
  };

  const handleEditorSave = async (updatedContent: string[]) => {
    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId: post.id,
          content: updatedContent,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        alert('✅ Changes saved successfully!');
        setShowEditor(false);
        onUpdate();
      } else {
        alert(`❌ Failed to save changes: ${data.error || 'Unknown error'}`);
      }
    } catch (err) {
      alert('Failed to save changes. Please check your connection.');
    }
  };

  const handleReject = async () => {
    if (!confirm('Are you sure you want to reject this post? It will be archived.')) return;
    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId: post.id,
          status: 'rejected',
        }),
      });

      if (res.ok) {
        onUpdate();
      } else {
        const data = await res.json();
        alert(`❌ Failed to reject: ${data.error || 'Unknown error'}`);
      }
    } catch (err) {
      alert('Failed to reject post.');
    }
  };

  const hasExceeded = post.content.some((tweet: string) => tweet.length > 280);

  if (showEditor) {
    return (
      <PostEditor
        post={post}
        onSave={handleEditorSave}
        onCancel={() => setShowEditor(false)}
        onPost={handlePostDirectly}
      />
    );
  }

  return (
    <div className="bg-gray-900/40 backdrop-blur-xl border border-gray-800 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition duration-300 relative overflow-hidden group">
      {/* Sleek type indicator line */}
      <div className={`absolute top-0 left-0 w-1.5 h-full ${
        post.type === 'spotlight' ? 'bg-blue-500' : 'bg-purple-500'
      }`} />

      {/* Header */}
      <div className="flex justify-between items-center mb-6 pl-2">
        <div className="flex items-center gap-3">
          <span className={`text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider ${
            post.type === 'spotlight' 
              ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' 
              : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
          }`}>
            {post.type}
          </span>
          <span className="text-xs text-gray-500">
            {post.repos?.length || 0} Repositories
          </span>
        </div>
        <div className="text-xs text-gray-500">
          {format(new Date(post.createdAt), 'MMM dd yyyy • HH:mm')}
        </div>
      </div>

      {/* Tweets Content list */}
      <div className="space-y-4 pl-2 relative">
        {/* Thread connector line */}
        {post.content.length > 1 && (
          <div className="absolute top-6 bottom-6 left-5 w-[2px] bg-gray-800 pointer-events-none" />
        )}
        
        {post.content.map((tweet: string, index: number) => {
          const isTweetOver = tweet.length > 280;
          return (
            <div key={index} className="flex gap-4 relative z-10 items-start">
              {/* Avatar block */}
              <div className={`w-8 h-8 rounded-full border flex items-center justify-center font-bold text-xs shrink-0 select-none ${
                isTweetOver 
                  ? 'bg-red-500/10 border-red-500/30 text-red-400' 
                  : 'bg-gray-800 border-gray-700 text-gray-400'
              }`}>
                {index + 1}
              </div>
              
              {/* Tweet bubble */}
              <div className={`flex-1 border p-4 rounded-xl transition ${
                isTweetOver 
                  ? 'bg-red-950/20 border-red-900/40 hover:border-red-900/60' 
                  : 'bg-gray-950/70 border-gray-850 hover:border-gray-800'
              }`}>
                <p className="text-gray-300 text-sm whitespace-pre-wrap leading-relaxed select-text font-normal">
                  {tweet}
                </p>
                <div className="flex justify-between items-center mt-2 text-[10px]">
                  {isTweetOver ? (
                    <span className="text-red-400 font-semibold">⚠️ Exceeds 280 limit</span>
                  ) : (
                    <span className="text-gray-500" />
                  )}
                  <span className={`font-mono font-semibold ${isTweetOver ? 'text-red-400' : 'text-gray-500'}`}>
                    {tweet.length} / 280
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Linked Repositories */}
      {post.repos && post.repos.length > 0 && (
        <div className="mt-8 border-t border-gray-950 pt-6 pl-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-4">
            Linked Repositories
          </h4>
          <div className="grid gap-4 sm:grid-cols-2">
            {post.repos.map((repo: any) => (
              <a
                key={repo.id}
                href={repo.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block bg-gray-950/50 hover:bg-gray-950 border border-gray-900 hover:border-gray-800 p-4 rounded-xl transition duration-200 group/repo"
              >
                <div className="flex justify-between items-start">
                  <span className="font-semibold text-sm text-blue-400 group-hover/repo:text-blue-300 transition truncate max-w-[80%]">
                    {repo.owner}/{repo.name}
                  </span>
                  {repo.stars !== undefined && (
                    <span className="text-xs text-yellow-500/90 flex items-center gap-1 font-medium shrink-0">
                      ★ {repo.stars >= 1000 ? `${(repo.stars / 1000).toFixed(1)}k` : repo.stars}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-2 line-clamp-2 leading-relaxed min-h-[2rem]">
                  {repo.description || 'No description.'}
                </p>
                <div className="flex justify-between items-center mt-3 pt-2 border-t border-gray-900/50 text-[10px] text-gray-500">
                  <span className="font-semibold uppercase tracking-wide">{repo.language || 'Code'}</span>
                  {repo.twitterHandle && (
                    <span className="text-blue-500/80 font-medium">@{repo.twitterHandle}</span>
                  )}
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Footer Buttons */}
      <div className="mt-8 pt-6 border-t border-gray-950 flex flex-wrap justify-between items-center gap-4 pl-2">
        <div className="flex items-center gap-3">
          <button
            onClick={handleReject}
            className="px-4 py-2.5 bg-transparent hover:bg-red-500/10 border border-gray-855 hover:border-red-500/20 text-xs font-semibold text-gray-400 hover:text-red-400 rounded-xl transition duration-200"
          >
            Reject Post
          </button>
          <button
            onClick={() => setShowEditor(true)}
            className="px-4 py-2.5 bg-gray-900/60 hover:bg-gray-855 border border-gray-855 hover:border-gray-800 text-xs font-semibold text-gray-300 rounded-xl transition duration-200"
          >
            Edit Post
          </button>
        </div>

        {hasExceeded ? (
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs text-red-400 font-semibold">
              ⚠️ Adjust tweet text length before posting
            </span>
            <button
              disabled
              className="px-5 py-2.5 bg-gray-900 border border-gray-850 text-gray-600 text-xs font-bold rounded-xl cursor-not-allowed select-none"
            >
              Post to X Now
            </button>
          </div>
        ) : (
          <button
            onClick={handlePostDirectly}
            disabled={isPosting}
            className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 disabled:from-gray-800 disabled:to-gray-850 text-xs font-bold text-white rounded-xl shadow-md hover:shadow-lg active:scale-[0.98] transition duration-200 flex items-center gap-2 select-none"
          >
            {isPosting ? (
              <>
                <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white/20 border-t-white"></div>
                Posting...
              </>
            ) : (
              <>
                <span>🚀 Post to X Now</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}