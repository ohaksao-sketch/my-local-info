import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '사이트 소개',
  description: '경기북부지원포탈은 의정부·양주·동두천·포천·남양주 지역 주민을 위한 생활 정보 제공 사이트입니다.',
  alternates: { canonical: 'https://infotoday.co.kr/about/' },
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-orange-50 pb-20">
      <div className="max-w-3xl mx-auto px-4 py-16">
        <div className="bg-white rounded-[3rem] shadow-xl border border-orange-100 overflow-hidden">
          <header className="p-8 md:p-12 border-b border-orange-50 bg-gradient-to-br from-white to-orange-50/30">
            <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">사이트 소개</h1>
            <p className="text-gray-500 text-lg">경기북부지원포탈에 대해 안내드립니다.</p>
          </header>

          <div className="p-8 md:p-12 space-y-10 text-gray-700 leading-relaxed">
            <section>
              <h2 className="text-xl font-black text-gray-900 mb-3">운영 목적</h2>
              <p>
                경기북부지원포탈은 <strong>의정부·양주·동두천·포천·남양주</strong> 등 경기북부 지역 주민이 지역 행사, 축제,
                지원금, 생활 혜택 정보를 쉽고 빠르게 찾을 수 있도록 만들어진 사이트입니다.
                흩어진 공공 정보를 한곳에 모아 주민 생활에 실질적인 도움을 드리는 것이 목표입니다.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-black text-gray-900 mb-3">데이터 출처</h2>
              <p>
                이 사이트에서 제공하는 모든 혜택·행사 정보는{' '}
                <a
                  href="https://data.go.kr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-orange-500 font-bold hover:underline"
                >
                  공공데이터포털 (data.go.kr)
                </a>
                에서 제공하는 공개 API를 기반으로 수집됩니다.
                원본 데이터는 각 지자체 및 정부 기관이 공식 등록한 정보이며, 정확한 내용은 해당 기관 공식 페이지에서 확인하시기 바랍니다.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-black text-gray-900 mb-3">콘텐츠 작성 방식</h2>
              <p>
                블로그 글은 공공데이터 API에서 수집한 정보를 바탕으로 <strong>AI(Gemini)</strong>가 초안을 작성합니다.
                작성된 글은 출처 데이터와의 일관성을 유지하도록 관리되며, 각 글 하단에 원문 출처 링크를 함께 제공합니다.
                AI 생성 콘텐츠이므로 세부 내용은 반드시 원문 출처를 통해 확인하시기 바랍니다.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-black text-gray-900 mb-3">운영자 정보</h2>
              <p>
                본 사이트는 개인이 운영하는 비영리 정보 제공 서비스입니다.
                오류나 부정확한 정보를 발견하셨다면 아래로 문의해 주세요.
              </p>
              <p className="mt-2 text-sm text-gray-500">
                운영자: <span className="font-bold text-gray-700">ohaksao</span>
              </p>
            </section>

            <section className="bg-orange-50 rounded-2xl p-6 text-sm text-gray-500">
              <p className="font-bold text-gray-700 mb-2">이용 안내</p>
              <ul className="list-disc list-inside space-y-1">
                <li>본 사이트의 정보는 참고용이며, 정확한 내용은 해당 기관 공식 채널을 통해 확인하세요.</li>
                <li>지원금·혜택 신청은 각 기관의 공식 페이지에서 진행하시기 바랍니다.</li>
                <li>데이터는 매일 자동으로 업데이트되며 일부 정보는 시차가 있을 수 있습니다.</li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
