import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Metadata } from 'next';
import { getAllPostSlugs, getPostBySlug } from '../../../lib/posts';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};

  const BASE_URL = 'https://infotoday.co.kr';
  const url = `${BASE_URL}/blog/${slug}/`;

  return {
    title: post.title,
    description: post.summary,
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      url,
      title: post.title,
      description: post.summary,
      publishedTime: post.date,
      locale: 'ko_KR',
      siteName: '경기북부지원포탈',
    },
  };
}

export async function generateStaticParams() {
  const slugs = getAllPostSlugs();
  if (slugs.length === 0) {
    return [{ slug: '__placeholder__' }];
  }
  return slugs.map((slug) => ({ slug }));
}

function getSourceUrl(slug: string): string | null {
  const parts = slug.split('-');
  const lastPart = parts[parts.length - 1];
  if (/^\d{9,12}$/.test(lastPart)) {
    return `https://www.gov.kr/portal/rcvfvrSvc/dtlEx/${lastPart}`;
  }
  return null;
}

export default async function BlogDetailPage({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const sourceUrl = getSourceUrl(slug);
  const BASE_URL = 'https://infotoday.co.kr';
  const url = `${BASE_URL}/blog/${slug}/`;

  const blogPostingSchema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    datePublished: post.date,
    description: post.summary,
    url,
    author: {
      '@type': 'Organization',
      name: '경기북부지원포탈',
      url: BASE_URL,
    },
    publisher: {
      '@type': 'Organization',
      name: '경기북부지원포탈',
      url: BASE_URL,
    },
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: '홈', item: BASE_URL },
      { '@type': 'ListItem', position: 2, name: '블로그', item: `${BASE_URL}/blog/` },
      { '@type': 'ListItem', position: 3, name: post.title, item: url },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogPostingSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
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
                {post.category || '지역 정보'}
              </span>
              <time dateTime={post.date} className="text-sm text-gray-400 font-medium">
                최종 업데이트: {post.date}
              </time>
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

          {/* 출처 및 AI 생성 안내 */}
          <footer className="p-8 md:p-12 border-t border-orange-50 bg-orange-50/30 space-y-4">
            {sourceUrl && (
              <div className="flex items-start gap-3 text-sm text-gray-600">
                <span className="text-orange-500 font-bold flex-shrink-0">📄 원문 출처</span>
                <a
                  href={sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-orange-500 font-bold hover:underline break-all"
                >
                  정부24 공식 서비스 페이지 바로가기 →
                </a>
              </div>
            )}
            <p className="text-xs text-gray-400 leading-relaxed">
              이 글은 공공데이터포털(
              <a href="https://data.go.kr" target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:underline">
                data.go.kr
              </a>
              )의 정보를 바탕으로 AI가 작성하였습니다. 정확한 내용은 원문 링크를 통해 확인해주세요.
            </p>
          </footer>
        </div>
      </article>
    </div>
    </>
  );
}
