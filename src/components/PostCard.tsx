import React from 'react';

interface Post {
  id: string;
  title: string;
  date: string;
  excerpt: string;
}

const PostCard = ({ post }: { post: Post }) => (
  <div className="bg-white rounded-3xl shadow-sm border border-orange-100 p-8 hover:shadow-xl transition-all duration-300">
    <div className="flex justify-between items-center mb-4">
      <span className="px-3 py-1 bg-orange-100 text-orange-600 rounded-full text-xs font-bold uppercase tracking-wider">
        New Post
      </span>
      <time className="text-sm text-gray-400 font-medium">{post.date}</time>
    </div>
    <h2 className="text-2xl font-black text-gray-800 mb-4 hover:text-orange-600 transition-colors">
      {post.title}
    </h2>
    <p className="text-gray-600 leading-relaxed mb-6 line-clamp-3">
      {post.excerpt}
    </p>
    <div className="flex items-center text-orange-500 font-bold text-sm">
      계속 읽기 <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
    </div>
  </div>
);

export default PostCard;
