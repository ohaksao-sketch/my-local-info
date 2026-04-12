import React from 'react';
import Link from 'next/link';
import { getAllPosts } from '../../lib/posts';

export default function BlogListPage() {
  const posts = getAllPosts();

  return (
    <div className="min-h-screen bg-orange-50 font-sans text-gray-900 pb-20">
      <header className="bg-white border-b border-orange-100 py-12 px-4 text-center mb-12">
        <h1 className="text-3xl md:text-4xl font-black text-orange-600 tracking-tight">
          📝 성남 생활 정보 블로그
        </h1>
        <p className="mt-2 text-gray-500 font-medium italic">
          AI가 전해드리는 생생한 지역 소식
        </p>
      </header>

      <main className="max-w-4xl mx-auto px-4">
        <div className="space-y-8">
          {posts.map((post) => (
            <Link href={`/blog/${post.slug}`} key={post.slug} className="block group">
              <article className="bg-white rounded-3xl shadow-sm border border-orange-100 p-8 hover:shadow-xl transition-all duration-300 group-hover:-translate-y-1">
                <div className="flex justify-between items-center mb-4">
                  <span className="px-3 py-1 bg-orange-100 text-orange-600 rounded-full text-xs font-bold uppercase tracking-wider">
                    {post.category || 'Post'}
                  </span>
                  <time className="text-sm text-gray-400 font-medium">{post.date}</time>
                </div>
                <h2 className="text-2xl font-black text-gray-800 mb-4 group-hover:text-orange-600 transition-colors">
                  {post.title}
                </h2>
                <p className="text-gray-600 leading-relaxed mb-6 line-clamp-3">
                  {post.summary}
                </p>
                {post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-6">
                    {post.tags.map((tag) => (
                      <span key={tag} className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex items-center text-orange-500 font-bold text-sm">
                  계속 읽기 <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </article>
            </Link>
          ))}
        </div>

        {posts.length === 0 && (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-orange-200">
            <p className="text-gray-400 font-medium">아직 게시된 글이 없습니다.</p>
          </div>
        )}
      </main>
    </div>
  );
}
