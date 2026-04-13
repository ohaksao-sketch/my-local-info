'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export interface InfoItem {
  id: string | number;
  name: string;
  category: string;
  startDate: string;
  endDate: string;
  location: string;
  target: string;
  summary: string;
  link: string;
  slug: string;
}

const TAGS = [
  { label: '#전체', value: 'all' },
  { label: '#의정부', value: '의정부' },
  { label: '#남양주', value: '남양주' },
  { label: '#양주', value: '양주' },
  { label: '#동두천', value: '동두천' },
  { label: '#포천', value: '포천' },
];

function InfoCard({ item }: { item: InfoItem }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-orange-100 p-6 hover:shadow-md transition-shadow duration-300">
      <div className="flex justify-between items-start mb-4">
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-600">
          {item.category}
        </span>
        {item.startDate !== '-' && (
          <span className="text-sm text-gray-500 font-medium">
            {item.startDate}
            {item.endDate !== item.startDate && ` ~ ${item.endDate}`}
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
        href={`/blog/${item.slug}`}
        className="inline-block text-orange-500 font-bold text-sm hover:underline"
      >
        자세히 보기 →
      </Link>
    </div>
  );
}

export default function FilteredInfoList({ items }: { items: InfoItem[] }) {
  const [active, setActive] = useState('all');

  const filtered =
    active === 'all' ? items : items.filter((item) => item.location.includes(active));

  return (
    <div>
      {/* 해시태그 필터 */}
      <div className="flex flex-wrap gap-2 mb-8">
        {TAGS.map((tag) => (
          <button
            key={tag.value}
            onClick={() => setActive(tag.value)}
            className={`px-4 py-2 rounded-full text-sm font-bold transition-colors cursor-pointer ${
              active === tag.value
                ? 'bg-orange-500 text-white'
                : 'bg-white text-gray-600 border border-orange-200 hover:border-orange-400 hover:text-orange-500'
            }`}
          >
            {tag.label}
          </button>
        ))}
        <span className="ml-auto text-sm text-gray-400 self-center font-medium">
          {filtered.length}개
        </span>
      </div>

      {/* 카드 그리드 */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((item) => (
            <InfoCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-gray-400">
          <p className="text-4xl mb-4">📭</p>
          <p className="font-medium">해당 지역 정보가 없습니다.</p>
          <p className="text-sm mt-2">데이터는 매일 업데이트됩니다.</p>
        </div>
      )}
    </div>
  );
}
