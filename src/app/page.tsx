import React from 'react';
import Link from 'next/link';
import data from '../../public/data/local-info.json';
import FilteredInfoList, { type InfoItem } from '../components/FilteredInfoList';

function getBlogSlug(item: { id: string | number; location: string; startDate: string }): string {
  const idStr = String(item.id);
  const loc = item.location || '';
  let city = 'unknown';
  if (loc.includes('의정부')) city = 'uijeongbu';
  else if (loc.includes('남양주')) city = 'namyangju';
  else if (loc.includes('양주')) city = 'yangju';
  else if (loc.includes('동두천')) city = 'dongducheon';
  else if (loc.includes('포천')) city = 'pocheon';
  const date =
    item.startDate && item.startDate !== '-'
      ? item.startDate
      : new Date().toISOString().slice(0, 10);
  return `${date}-${city}-${idStr}`;
}

function sortByDate<T extends { startDate: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => (a.startDate < b.startDate ? 1 : -1));
}

const FAQ_ITEMS = [
  {
    q: '지원금 신청은 어디서 하나요?',
    a: '각 글 하단의 "정부24 공식 서비스 페이지 바로가기" 링크를 통해 해당 기관 공식 페이지에서 직접 신청하실 수 있습니다.',
  },
  {
    q: '정보는 얼마나 자주 업데이트되나요?',
    a: '공공데이터포털 API를 기반으로 매일 오전 7시 자동 업데이트됩니다. 최신 공공 정보가 반영됩니다.',
  },
  {
    q: '경기북부 외 지역 정보도 있나요?',
    a: '현재는 의정부·양주·동두천·포천·남양주 5개 시를 중심으로 운영 중입니다. 향후 경기북부 전 지역으로 확대 예정입니다.',
  },
  {
    q: '특정 지원금이 나에게 해당되는지 어떻게 알 수 있나요?',
    a: '각 카드의 "대상" 항목을 확인하세요. 자세한 신청 자격은 원문 출처 링크에서 확인하시기 바랍니다.',
  },
];

export default async function Home() {
  const allItems = sortByDate([
    ...(data.events as InfoItem[]),
    ...(data.benefits as InfoItem[]),
  ]).map((item) => ({ ...item, slug: getBlogSlug(item) }));

  const eventSchemas = (data.events as InfoItem[]).map((item) => ({
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: item.name,
    startDate: item.startDate,
    endDate: item.endDate,
    location: { '@type': 'Place', name: item.location },
    description: item.summary,
  }));

  const serviceSchemas = (data.benefits as InfoItem[]).map((item) => ({
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
      {eventSchemas.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(eventSchemas) }}
        />
      )}
      {serviceSchemas.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchemas) }}
        />
      )}

      <div className="min-h-screen bg-orange-50 font-sans text-gray-900">
        {/* 헤더 */}
        <header className="bg-white border-b border-orange-100 py-8 px-4 text-center sticky top-0 z-10 shadow-sm">
          <h1 className="text-3xl md:text-4xl font-black text-orange-600 tracking-tight">
            🏘️ 경기북부지원포탈
          </h1>
          <p className="mt-2 text-gray-500 font-medium">
            의정부·양주·동두천·포천 생활 정보를 한눈에
          </p>
        </header>

        <main className="max-w-6xl mx-auto px-4 py-12 space-y-20">
          {/* 지원금·혜택 섹션 */}
          <section>
            <div className="flex items-center gap-2 mb-8 border-l-4 border-orange-500 pl-4">
              <h2 className="text-2xl font-black text-gray-800">💰 지역 지원금·혜택 정보</h2>
            </div>
            <FilteredInfoList items={allItems} />
          </section>

          {/* FAQ 섹션 */}
          <section>
            <div className="flex items-center gap-2 mb-8 border-l-4 border-rose-400 pl-4">
              <h2 className="text-2xl font-black text-gray-800">🤔 자주 묻는 질문</h2>
            </div>
            <div className="space-y-4">
              {FAQ_ITEMS.map((item, idx) => (
                <details
                  key={idx}
                  className="bg-white rounded-2xl border border-orange-100 overflow-hidden group"
                >
                  <summary className="flex items-center justify-between px-6 py-5 cursor-pointer font-bold text-gray-800 hover:text-orange-500 transition-colors list-none">
                    <span>Q. {item.q}</span>
                    <span className="text-orange-400 text-lg group-open:rotate-45 transition-transform">+</span>
                  </summary>
                  <div className="px-6 pb-5 text-gray-600 text-sm leading-relaxed border-t border-orange-50 pt-4">
                    {item.a}
                  </div>
                </details>
              ))}
            </div>
            <div className="mt-6 text-center">
              <Link
                href="/about"
                className="inline-block text-sm text-orange-500 font-bold hover:underline"
              >
                사이트 소개 더 보기 →
              </Link>
            </div>
          </section>
        </main>

        {/* 푸터 */}
        <footer className="bg-white border-t border-orange-100 py-12 px-4 text-center mt-20">
          <div className="max-w-4xl mx-auto space-y-4">
            <p className="text-gray-500 text-sm font-medium">
              데이터 출처:{' '}
              <span className="text-orange-600 font-bold">공공데이터포털 (data.go.kr)</span>
            </p>
            <div className="pt-6 border-t border-gray-100 space-y-2">
              <p className="text-orange-600 text-base font-black">🏡 ohaksao의 경기북부지원포탈</p>
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
