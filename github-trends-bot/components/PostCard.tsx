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

  const handleEditorSave = async (updatedContent: string