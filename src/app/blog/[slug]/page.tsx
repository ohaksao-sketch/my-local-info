import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getAllPostSlugs, getPostBySlug } from '../../../lib/posts';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const slugs = getAllPostSlugs();
  if (slugs.length === 0) {
    return [{ slug: '__placeholder__' }];
  }
  return slugs.map((slug) => ({ slug }));
}

export default async function BlogDetailPage({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-orange-50 font-sans text-gray-900 pb-20">
      <article className="max-w-4xl mx-auto px-4 py-12">
        <Link
          href="/blog"
          className="inline-flex items-center text-orange-500 font-bold mb-8 hover:translate-x-1 transition-transform"
        >
          ← 목록으로 돌아가기
        </Link>

        <div className="bg-white rounded-[3rem] shadow-xl border border-orange-100 overflow-hidden">
          <header className="p-8 md:p-12 border-b border-orange-50 bg-gradient-to-br from-white to-orange-50/30">
            <div className="flex items-center gap-4 mb-6">
              <span className="px-4 py-1.5 bg-rose-100 text-rose-600 rounded-full text-xs font-black uppercase tracking-widest">
                {post.category || 'Seongnam Local Info'}
              </span>
              <time className="text-sm text-gray-400 font-medium">{post.date}</time>
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-gray-900 leading-tight mb-6">
              {post.title}
            </h1>
            {post.summary && (
              <p className="text-lg text-gray-600 leading-relaxed">{post.summary}</p>
            )}
            {post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-6">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full font-medium"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </header>

          <div className="p-8 md:p-12 prose prose-orange max-w-none prose-headings:font-black prose-headings:text-gray-800 prose-a:text-orange-500 prose-a:font-bold">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content}</ReactMarkdown>
          </div>
        </div>
      </article>
    </div>
  );
}
