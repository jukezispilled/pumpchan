'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import Post from '@/app/components/Post';
import PostForm from '@/app/components/PostForm';

export default function ThreadPage({ params }) {
  // Unwrap the params Promise using React.use()
  const { boardCode, threadNumber } = use(params);
  
  const [thread, setThread] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hiddenPosts, setHiddenPosts] = useState(new Set());

  const fetchThread = async () => {
    try {
      const response = await fetch(`/api/${boardCode}/threads/${threadNumber}`);
      if (response.ok) {
        const data = await response.json();
        setThread(data.thread);
        setPosts(data.posts);
      }
    } catch (error) {
      console.error('Failed to fetch thread:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchThread();
  }, [boardCode, threadNumber]);

  const handlePostCreated = (newPost) => {
    setPosts(prev => [...prev, newPost]);
    setThread(prev => ({
      ...prev,
      replies: prev.replies + 1,
      images: prev.images + (newPost.imageUrl ? 1 : 0)
    }));
  };

  const togglePostVisibility = (postNumber) => {
    setHiddenPosts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(postNumber)) {
        newSet.delete(postNumber);
      } else {
        newSet.add(postNumber);
      }
      return newSet;
    });
  };

  const toggleOPVisibility = () => {
    setHiddenPosts(prev => {
      const newSet = new Set(prev);
      const opKey = `op-${threadNumber}`;
      if (newSet.has(opKey)) {
        newSet.delete(opKey);
      } else {
        newSet.add(opKey);
      }
      return newSet;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <img
          src="/load.gif"
          alt="Loading..."
          className="w-24 h-24"
        />
      </div>
    );
  }

  if (!thread) {
    return <div className="text-center p-8">Thread not found</div>;
  }

  const isOPHidden = hiddenPosts.has(`op-${threadNumber}`);

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-6">
          <div className='absolute left-1/2 -translate-x-1/2 hidden md:block'>
            <h1 className="text-2xl font-bold text-[#890000]">
              /{boardCode}/ - {thread.subject || `Thread #${thread.threadNumber}`}
            </h1>
          </div>
          <div className='absolute top-2 right-5 block md:hidden'>
            <h1 className="text-xl font-bold text-[#890000]">
              /{boardCode}/ - {thread.subject || `Thread #${thread.threadNumber}`}
            </h1>
          </div>
          <div className="space-x-4 absolute top-4 left-4">
            <Link href={`/${boardCode}`} className="text-blue-600 hover:underline">
              [Return to Board]
            </Link>
            <Link href="/" className="text-blue-600 hover:underline invisible md:visible">
              [Boards]
            </Link>
          </div>
        </div>

        {thread.isLocked && (
          <div className="bg-gray-100 border border-gray-400 text-gray-700 px-4 py-2 mb-4">
            <strong>Thread Locked:</strong> No new replies can be posted
          </div>
        )}
      </div>

      {!thread.isLocked && (
        <div className='flex justify-center'>
            <PostForm 
                boardCode={boardCode} 
                threadNumber={threadNumber}
                onPostCreated={handlePostCreated}
            />
        </div>
      )}

      <div className="bg-white border border-gray-300 mb-2">
        <div className="p-1 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center">
            <button
              onClick={toggleOPVisibility}
              className="text-gray-600 hover:text-gray-800 font-mono text-xs mr-2 select-none cursor-pointer"
              title={isOPHidden ? "Show original post" : "Hide original post"}
            >
              [{isOPHidden ? '+' : '−'}]
            </button>
            <span className="text-xs text-gray-600 font-semibold">
              OP #{thread.threadNumber}
              {thread.subject && ` - ${thread.subject}`}
            </span>
          </div>
        </div>
        {!isOPHidden && (
          <div className="p-2">
            <Post post={thread} isOP={true} boardCode={boardCode} />
          </div>
        )}
      </div>

      <div className="space-y-1">
        {posts.map((post) => {
          const isPostHidden = hiddenPosts.has(post.postNumber);
          
          return (
            <div key={post.postNumber} className="bg-gray-50 border border-gray-300">
              <div className="p-1 border-b border-gray-200 bg-gray-100">
                <div className="flex items-center">
                  <button
                    onClick={() => togglePostVisibility(post.postNumber)}
                    className="text-gray-600 hover:text-gray-800 font-mono text-xs mr-2 select-none cursor-pointer"
                    title={isPostHidden ? "Show post content" : "Hide post content"}
                  >
                    [{isPostHidden ? '+' : '−'}]
                  </button>
                  <span className="text-xs text-gray-600">
                    Post #{post.postNumber}
                    {post.name && post.name !== 'Anonymous' && ` by ${post.name}`}
                    {post.timestamp && ` • ${new Date(post.timestamp).toLocaleString()}`}
                  </span>
                </div>
              </div>
              {!isPostHidden && (
                <div className="p-4">
                  <Post post={post} boardCode={boardCode} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="text-center mt-6 text-gray-500 text-sm">
        {posts.length} replies • {thread.images} images
      </div>
    </div>
  );
}