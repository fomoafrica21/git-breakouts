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
    setIsPosting(true);
    await onPost();
    setIsPosting(false);
  };

  const totalChars = editedContent.reduce((sum, text) => sum + text.length, 0);

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <span className="text-blue-400 uppercase text-xs font-medium tracking-wider">
            {post.type.toUpperCase()}
          </span>
          <h2 className="text-2xl font-bold mt-1">Post Editor</h2>
        </div>
        <div className="text-sm text-gray-400">
          {format(new Date(post.createdAt), 'MMM dd yyyy • HH:mm')}
        </div>
      </div>

      <div className="space-y-6 mb-8">
        {editedContent.map((tweet, index) => (
          <div key={index} className="space-y-2">
            <div className="flex justify-between items-center text-xs text-gray-400 px-1">
              <span>Tweet {index + 1} {post.type === 'listicle' && index === 0 && '(Opener)'}</span>
              <span className={tweet.length > MAX_CHARS ? 'text-red-500 font-medium' : ''}>
                {tweet.length} / {MAX_CHARS}
              </span>
            </div>

            <textarea
              value={tweet}
              onChange={(e) => handleChange(index, e.target.value)}
              className="w-full h-32 bg-gray-950 border border-gray-700 focus:border-blue-500 rounded-xl p-4 text-sm leading-relaxed resize-y min-h-[110px]"
              placeholder="Write your tweet here..."
            />
          </div>
        ))}
      </div>

      {/* Summary Bar */}
      <div className="bg-gray-950 border border-gray-800 rounded-xl p-4 mb-6 flex justify-between items-center text-sm">
        <span>Total Characters: <span className={totalChars > 1200 ? 'text-red-400' : 'text-gray-300'}>{totalChars}</span></span>
        <span className="text-gray-400">{post.repos?.length || 0} repositories • {editedContent.length} tweets</span>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <button
          onClick={onCancel}
          className="flex-1 py-3.5 border border-gray-600 hover:bg-gray-800 rounded-xl font-medium transition"
        >
          Cancel
        </button>

        <button
          onClick={handleSave}
          className="flex-1 py-3.5 bg-gray-700 hover:bg-gray-600 rounded-xl font-medium transition"
        >
          Save Changes
        </button>

        <button
          onClick={handlePostClick}
          disabled={isPosting || editedContent.some(text => text.length > MAX_CHARS)}
          className="flex-1 py-3.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 disabled:from-gray-700 disabled:to-gray-600 rounded-xl font-semibold transition flex items-center justify-center gap-2"
        >
          {isPosting ? 'Posting to X...' : '🚀 Post to X Now'}
        </button>
      </div>

      {editedContent.some(text => text.length > MAX_CHARS) && (
        <p className="text-red-500 text-xs mt-3 text-center">
          ⚠️ One or more tweets exceed the 280 character limit
        </p>
      )}
    </div>
  );
}