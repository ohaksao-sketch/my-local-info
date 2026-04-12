import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "경기북부지원포탈",
  description: "의정부·양주·동두천·포천 등 경기북부 지역의 최신 행사, 지원금, 혜택 정보를 한눈에 확인하고 AI가 작성한 블로그 글을 만나보세요.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-orange-50 font-sans text-gray-900">
        <nav className="bg-white border-b border-orange-100 sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
            <Link href="/" className="text-xl font-black text-orange-600 flex items-center gap-2">
              🏘️ <span className="hidden sm:inline">경기북부지원포탈</span>
            </Link>
            <div className="flex gap-6">
              <Link href="/" className="font-bold text-gray-600 hover:text-orange-500 transition-colors">홈</Link>
              <Link href="/blog" className="font-bold text-gray-600 hover:text-orange-500 transition-colors">블로그</Link>
            </div>
          </div>
        </nav>
        <main className="flex-grow">
          {children}
        </main>
        {/* 푸터 영역 */}
        <footer className="bg-white border-t border-orange-100 py-12 px-4 text-center">
          <div className="max-w-4xl mx-auto space-y-4">
            <p className="text-gray-500 text-sm font-medium">
              데이터 출처: <span className="text-orange-600 font-bold">공공데이터포털 (data.go.kr)</span>
            </p>
            <p className="text-gray-400 text-xs">
              관리자: <span className="font-bold text-gray-600">ohaksao</span> | 프로젝트: <span className="text-orange-400">my-local-info</span>
            </p>
            <div className="pt-6 border-t border-gray-100">
              <p className="text-gray-300 text-xs tracking-widest uppercase">
                &copy; 2024 우리 동네 생활 정보. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
