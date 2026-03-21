import React from 'react';
import Link from 'next/link';

import data from '../../../../public/data/local-info.json';

// 정적 배포(Static Export)를 위해 가능한 모든 ID 경로를 미리 생성합니다.
export async function generateStaticParams() {
  const paths = [
    ...data.events.map((e) => ({ id: e.id })),
    ...data.benefits.map((b) => ({ id: b.id })),
  ];
  return paths;
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  // 데이터에서 해당 ID 찾기
  const allItems = [...data.events, ...data.benefits];
  const item = allItems.find((i) => i.id === id);

  if (!item) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold text-gray-800">정보를 찾을 수 없습니다. 😢</h1>
        <Link href="/" className="mt-4 text-orange-500 hover:underline">목록으로 돌아가기</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-orange-50 font-sans text-gray-900 pb-20">
      {/* 상단 네비게이션 */}
      <nav className="bg-white border-b border-orange-100 py-4 px-4 sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center">
          <Link href="/" className="text-orange-500 font-bold flex items-center gap-1 hover:text-orange-600 transition-colors">
            ← 목록으로 돌아가기
          </Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 mt-12">
        <article className="bg-white rounded-3xl shadow-sm border border-orange-100 overflow-hidden">
          {/* 헤더 섹션 */}
          <div className={`p-8 md:p-12 ${
            item.category === '행사' ? 'bg-orange-50' : 'bg-rose-50'
          }`}>
            <span className={`inline-block px-4 py-1.5 rounded-full text-sm font-black mb-6 ${
              item.category === '행사' ? 'bg-orange-200 text-orange-700' : 'bg-rose-200 text-rose-700'
            }`}>
              {item.category}
            </span>
            <h1 className="text-3xl md:text-5xl font-black text-gray-900 leading-tight">
              {item.name}
            </h1>
          </div>

          {/* 정보 섹션 */}
          <div className="p-8 md:p-12 space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-10 border-b border-gray-100">
              <div className="space-y-2">
                <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">기간</p>
                <p className="text-lg font-bold text-gray-800">
                  {item.startDate !== '-' ? `${item.startDate} ~ ${item.endDate}` : '상시 진행'}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">장소</p>
                <p className="text-lg font-bold text-gray-800">{item.location}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">대상</p>
                <p className="text-lg font-bold text-gray-800">{item.target}</p>
              </div>
            </div>

            <div className="space-y-6">
              <h2 className="text-xl font-black text-gray-800">상세 설명</h2>
              <p className="text-lg text-gray-600 leading-relaxed whitespace-pre-wrap">
                {item.summary}
                {"\n\n"}
                이 사업은 성남시 시민들의 더 나은 삶을 위해 마련되었습니다. 
                정확한 일정과 신청 방법은 아래 공식 홈페이지 버튼을 통해 확인해 주세요.
              </p>
            </div>

            <div className="pt-10 flex flex-col sm:flex-row gap-4">
              <a
                href={item.link}
                className="flex-1 inline-flex items-center justify-center bg-orange-500 text-white text-lg font-black py-5 rounded-2xl hover:bg-orange-600 transition-all shadow-lg shadow-orange-200"
              >
                원본 사이트에서 자세히 보기 →
              </a>
              <Link
                href="/"
                className="flex-1 inline-flex items-center justify-center bg-gray-100 text-gray-600 text-lg font-black py-5 rounded-2xl hover:bg-gray-200 transition-all font-medium"
              >
                목록으로 돌아가기
              </Link>
            </div>
          </div>
        </article>
      </main>
    </div>
  );
}
