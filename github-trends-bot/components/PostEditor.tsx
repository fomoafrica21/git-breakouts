'use client';

import { useState } from 'react';
import { format } from 'date-fns';

interface PostEditorProps {
  post: any;
  onSave: (updatedContent: string[]) => void;
  onCancel: () => void;
  onPost: () => void;
}

export default function PostEditor({ post, onSave, onCancel, onPost }: PostEditorProps) {
  const [editedContent, setEditedContent] = useState<string[]>(post.content);
  const [isPosting, setIsPosting] = useState(false);

  const MAX_CHARS = 280;

  const handleChange = (index: number, value: string) => {
    const updated = [...editedContent];
    updated[index] = value;
    setEditedContent(updated);
  };

  const handleSave = () => {
    onSave(editedContent);
  };

  const handlePostClick = async () => {
    if (editedContent.some(text => text.length > MAX_CHARS)) return;
    setIsPosting(true);
    await onPost();
    setIsPosting(false);
  };

  const totalChars = editedContent.reduce((sum, text) => sum + text.length, 0);
  const hasExceededLimit = editedContent.some(text => text.length > MAX_CHARS);

  return (
    <div className="bg-gray-900/60 backdrop-blur-xl border border-gray-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden transition-all duration-300">
      {/* Decorative accent gradients */}
      <div className={`absolute top-0 left-0 right-0 h-1.5 ${
        post.type === 'spotlight' ? 'bg-gradient-to-r from-blue-500 to-indigo-500' : 'bg-gradient-to-r from-purple-500 to-pink-500'
      }`} />

      {/* Editor Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${
            post.type === 'spotlight' 
              ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' 
              : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
          }`}>
            Editing {post.type}
          </span>
          <h2 className="text-2xl font-black mt-2 tracking-tight">Post Composer</h2>
        </div>
        <div className="text-xs text-gray-500 bg-gray-950/40 px-3.5 py-2 rounded-xl border border-gray-900">
          Created: {format(new Date(post.createdAt), 'MMM dd, yyyy • HH:mm')}
        </div>
      </div>

      {/* Tweet Composition Fields */}
      <div className="space-y-6 mb-8">
        {editedContent.map((tweet, index) => {
          const charCount = tweet.length;
          const isOver = charCount > MAX_CHARS;
          const percentage = Math.min((charCount / MAX_CHARS) * 100, 100);

          return (
            <div key={index} className="bg-gray-950/40 border border-gray-850 hover:border-gray-800 rounded-2xl p-5 transition space-y-3 relative group">
              <div className="flex justify-between items-center text-xs px-1">
                <span className="font-bold text-gray-400 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-gray-900 border border-gray-800 flex items-center justify-center text-[10px] text-gray-500">
                    {index + 1}
                  </span>
                  {post.type === 'listicle' && index === 0 ? 'Opener Tweet' : `Tweet Segment ${index + 1}`}
                </span>
                
                <div className="flex items-center gap-3">
                  {/* Miniature gauge */}
                  <div className="w-16 h-1.5 bg-gray-900 rounded-full overflow-hidden hidden sm:block">
                    <div 
                      className={`h-full rounded-full transition-all duration-300 ${
                        isOver ? 'bg-red-500' : charCount > 250 ? 'bg-yellow-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>

                  <span className={`font-mono text-xs font-semibold ${
                    isOver ? 'text-red-500' : charCount > 250 ? 'text-yellow-400' : 'text-gray-400'
                  }`}>
                    {charCount} <span className="text-gray-600 font-normal">/ {MAX_CHARS}</span>
                  </span>
                </div>
              </div>

              <textarea
                value={tweet}
                onChange={(e) => handleChange(index, e.target.value)}
                className={`w-full min-h-[120px] bg-gray-950/80 border rounded-xl p-4 text-sm leading-relaxed outline-none transition focus:ring-1 focus:ring-opacity-50 select-text font-normal resize-y ${
                  isOver 
                    ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500' 
                    : 'border-gray-850 focus:border-blue-500/50 focus:ring-blue-500'
                }`}
                placeholder="Compose tweet segment content..."
              />
            </div>
          );
        })}
      </div>

      {/* Summary Stat Bar */}
      <div className="bg-gray-950/80 border border-gray-900/60 rounded-2xl p-5 mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs">
        <div className="flex flex-wrap gap-4">
          <div className="flex flex-col">
            <span className="text-gray-500 uppercase tracking-widest text-[9px] font-bold">Total Characters</span>
            <span className="text-sm font-bold text-gray-300 mt-0.5">{totalChars}</span>
          </div>
          <div className="w-px h-8 bg-gray-900 hidden sm:block" />
          <div className="flex flex-col">
            <span className="text-gray-500 uppercase tracking-widest text-[9px] font-bold">Attached Repos</span>
            <span className="text-sm font-bold text-gray-300 mt-0.5">{post.repos?.length || 0} repositories</span>
          </div>
          <div className="w-px h-8 bg-gray-900 hidden sm:block" />
          <div className="flex flex-col">
            <span className="text-gray-500 uppercase tracking-widest text-[9px] font-bold">Segment Count</span>
            <span className="text-sm font-bold text-gray-300 mt-0.5">{editedContent.length} tweets</span>
          </div>
        </div>

        {hasExceededLimit && (
          <div className="text-red-400 font-semibold bg-red-500/10 border border-red-500/20 px-3.5 py-2.5 rounded-xl flex items-center gap-2 w-full sm:w-auto">
            <span>⚠️</span> Tweet text length limit exceeded (280 max).
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap sm:flex-nowrap gap-4">
        <button
          onClick={onCancel}
          className="w-full sm:flex-1 py-3.5 bg-transparent hover:bg-gray-900 border border-gray-850 hover:border-gray-800 text-sm font-semibold text-gray-400 hover:text-gray-200 rounded-xl transition duration-200"
        >
          Discard Changes
        </button>

        <button
          onClick={handleSave}
          className="w-full sm:flex-1 py-3.5 bg-gray-800 hover:bg-gray-700 text-sm font-bold text-gray-200 hover:text-white rounded-xl transition duration-200"
        >
          Save Draft
        </button>

        <button
          onClick={handlePostClick}
          disabled={isPosting || hasExceededLimit}
          className="w-full sm:flex-1 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:from-gray-900 disabled:to-gray-950 disabled:text-gray-500 text-sm font-bold text-white rounded-xl shadow-lg hover:shadow-indigo-500/10 transition duration-200 flex items-center justify-center gap-2"
        >
          {isPosting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white"></div>
              <span>Posting to X...</span>
            </>
          ) : (
            <>
              <span>🚀 Approve & Post to X</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}