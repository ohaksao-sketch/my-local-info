import React from 'react';
import Link from 'next/link';
import data from '../../public/data/local-info.json';

interface InfoItem {
  id: string | number;
  name: string;
  category: string;
  startDate: string;
  endDate: string;
  location: string;
  target: string;
  summary: string;
  link: string;
}

function getBlogSlug(item: InfoItem): string {
  const idStr = String(item.id);
  const loc = item.location || '';
  let city = 'unknown';
  if (loc.includes('의정부')) city = 'uijeongbu';
  else if (loc.includes('남양주')) city = 'namyangju';
  else if (loc.includes('양주')) city = 'yangju';
  else if (loc.includes('동두천')) city = 'dongducheon';
  else if (loc.includes('포천')) city = 'pocheon';
  const date = item.startDate && item.startDate !== '-' ? item.startDate : new Date().toISOString().slice(0, 10);
  return `${date}-${city}-${idStr}`;
}

const InfoCard = ({ item }: { item: InfoItem }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-orange-100 p-6 hover:shadow-md transition-shadow duration-300">
    <div className="flex justify-between items-start mb-4">
      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
        item.category === '행사' ? 'bg-orange-100 text-orange-600' : 'bg-rose-100 text-rose-600'
      }`}>
        {item.category}
      </span>
      {item.startDate !== '-' && (
        <span className="text-sm text-gray-500 font-medium">
          {item.startDate} {item.endDate !== item.startDate && `~ ${item.endDate}`}
        </span>
      )}
    </div>
    <h3 className="text-xl font-bold text-gray-800 mb-2 leading-tight">{item.name}</h3>
    <div className="space-y-2 mb-4">
      <p className="text-sm text-gray-600">
        <span className="font-semibold text-gray-800">장소:</span> {item.location}
      </p>
      <p className="text-sm text-gray-600">
        <span className="font-semibold text-gray-800">대상:</span> {item.target}
      </p>
      <p className="text-sm text-gray-600 leading-relaxed line-clamp-2">{item.summary}</p>
    </div>
    <Link
      href={`/blog/${getBlogSlug(item)}`}
      className="inline-block text-orange-500 font-bold text-sm hover:underline"
    >
      자세히 보기 →
    </Link>
  </div>
);

function sortByDate<T extends { startDate: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => (a.startDate < b.startDate ? 1 : -1));
}

export default async function Home() {
  const events = sortByDate(data.events);
  const benefits = sortByDate(data.benefits);

  const eventSchemas = (events as InfoItem[]).map((item) => ({
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: item.name,
    startDate: item.startDate,
    endDate: item.endDate,
    location: { '@type': 'Place', name: item.location },
    description: item.summary,
  }));

  const serviceSchemas = (benefits as InfoItem[]).map((item) => ({
    '@context': 'https://schema.org',
    '@type': 'GovernmentService',
    name: item.name,
    description: item.summary,
    provider: {
      '@type': 'GovernmentOrganization',
      name: item.location || '경기북부 지자체',
    },
  }));

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(eventSchemas) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchemas) }}
      />
    <div className="min-h-screen bg-orange-50 font-sans text-gray-900">
      {/* 1. 상단 헤더 */}
      <header className="bg-white border-b border-orange-100 py-8 px-4 text-center sticky top-0 z-10 shadow-sm">
        <h1 className="text-3xl md:text-4xl font-black text-orange-600 tracking-tight">
          🏘️ 경기북부지원포탈
        </h1>
        <p className="mt-2 text-gray-500 font-medium">의정부·양주·동두천·포천 생활 정보를 한눈에</p>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-12 space-y-16">
        {/* 2. 이번 달 행사/축제 */}
        <section>
          <div className="flex items-center gap-2 mb-8 border-l-4 border-orange-500 pl-4">
            <h2 className="text-2xl font-black text-gray-800">🌸 이번 달 행사/축제</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event, idx) => (
              <InfoCard key={idx} item={event} />
            ))}
          </div>
        </section>

        {/* 3. 지원금/혜택 정보 */}
        <section>
          <div className="flex items-center gap-2 mb-8 border-l-4 border-rose-500 pl-4">
            <h2 className="text-2xl font-black text-gray-800">💰 지원금/혜택 정보</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((benefit, idx) => (
              <InfoCard key={idx} item={benefit} />
            ))}
          </div>
        </section>
      </main>

      {/* 4. 하단 푸터 */}
      <footer className="bg-white border-t border-orange-100 py-12 px-4 text-center mt-20">
        <div className="max-w-4xl mx-auto space-y-4">
          <p className="text-gray-500 text-sm font-medium">
            데이터 출처: <span className="text-orange-600 font-bold">공공데이터포털 (data.go.kr)</span>
          </p>
          <div className="pt-6 border-t border-gray-100 space-y-2">
            <p className="text-orange-600 text-base font-black">
              🏡 ohaksao의 경기북부지원포탈
            </p>
            <p className="text-gray-500 text-xs">
              Made by <span className="font-bold text-gray-700">ohaksao</span> ·{' '}
              <a
                href="https://github.com/ohaksao-sketch/my-local-info"
                target="_blank"
                rel="noopener noreferrer"
                className="text-orange-500 hover:underline"
              >
                github.com/ohaksao-sketch
              </a>
            </p>
            <p className="text-gray-300 text-xs tracking-widest uppercase">
              &copy; 2026 ohaksao. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
    </>
  );
}
