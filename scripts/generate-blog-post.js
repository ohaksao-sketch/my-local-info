/**
 * 매일 1회 자동 실행되어 최신 공공서비스 정보로 블로그 글 1개를 생성하는 스크립트.
 *
 * 실행: node scripts/generate-blog-post.js
 *
 * 환경변수:
 *   GEMINI_API_KEY - Gemini API 키
 */

'use strict';

const fs = require('fs');
const path = require('path');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const LOCAL_INFO_PATH = path.join(process.cwd(), 'public/data/local-info.json');
const POSTS_DIR = path.join(process.cwd(), 'src/content/posts');
const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

function loadLatestItem() {
  const raw = fs.readFileSync(LOCAL_INFO_PATH, 'utf-8');
  const data = JSON.parse(raw);

  const events = Array.isArray(data.events) ? data.events : [];
  const benefits = Array.isArray(data.benefits) ? data.benefits : [];
  const all = [...events, ...benefits];

  if (all.length === 0) return null;
  return all[all.length - 1];
}

/**
 * item.location 에서 도시명을 추출해 영문 city slug 반환.
 * page.tsx getBlogSlug 과 동일한 로직.
 */
function getCitySlug(location) {
  const loc = location || '';
  if (loc.includes('의정부')) return 'uijeongbu';
  if (loc.includes('남양주')) return 'namyangju';
  if (loc.includes('양주')) return 'yangju';
  if (loc.includes('동두천')) return 'dongducheon';
  if (loc.includes('포천')) return 'pocheon';
  return 'gyeonggi';
}

/**
 * 아이템의 서비스 ID 를 포함한 파일명을 빌드.
 * 형식: {startDate}-{city}-{id}
 * → page.tsx getBlogSlug 과 완전히 동일해야 함.
 */
function buildFilename(item) {
  const idStr = String(item.id || Date.now());
  const city = getCitySlug(item.location);
  const date = item.startDate && item.startDate !== '-'
    ? item.startDate
    : new Date().toISOString().slice(0, 10);
  return `${date}-${city}-${idStr}`;
}

function isAlreadyWritten(item) {
  if (!fs.existsSync(POSTS_DIR)) return false;
  const files = fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith('.md'));

  // 1) 파일명에 서비스 ID 가 포함되어 있으면 이미 작성됨
  const idStr = String(item.id || '');
  if (idStr && files.some((f) => f.includes(idStr))) {
    return true;
  }

  // 2) 파일 내용에 서비스명이 포함되어 있으면 이미 작성됨
  for (const file of files) {
    const content = fs.readFileSync(path.join(POSTS_DIR, file), 'utf-8');
    if (content.includes(item.name)) return true;
  }
  return false;
}

async function callGemini(prompt) {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY 환경변수가 설정되지 않았습니다.');
  }

  const res = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Gemini API 오류: ${res.status} - ${body.slice(0, 200)}`);
  }

  const json = await res.json();
  const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (typeof text !== 'string' || text.trim().length === 0) {
    throw new Error('Gemini 응답이 비어있습니다.');
  }
  return text;
}

function stripCodeFence(text) {
  let cleaned = text.trim();
  cleaned = cleaned.replace(/^```(?:markdown|md)?\s*/i, '');
  cleaned = cleaned.replace(/\s*```$/i, '');
  return cleaned.trim();
}

async function main() {
  let latestItem;
  try {
    latestItem = loadLatestItem();
  } catch (err) {
    console.error('[generate-blog-post] local-info.json 읽기 실패:', err.message);
    return;
  }

  if (!latestItem || !latestItem.name) {
    console.error('[generate-blog-post] 최신 항목을 찾을 수 없습니다.');
    return;
  }

  console.log(`[generate-blog-post] 최신 항목: ${latestItem.name}`);

  if (isAlreadyWritten(latestItem)) {
    console.log('[generate-blog-post] 이미 작성된 글입니다. 건너뜁니다.');
    return;
  }

  const today = new Date().toISOString().slice(0, 10);

  const prompt = `아래 공공서비스 정보를 바탕으로 블로그 글을 작성해줘.

[원본 정보]
${JSON.stringify(latestItem, null, 2)}

⚠️ 반드시 지켜야 할 규칙:
1. 공공 정보이므로 사실(팩트)만 써야 해. 원본에 없는 내용은 절대 지어내지 마.
2. 구체적인 금액, 지원 대상, 신청 기간, 조건은 원본에 명시된 값만 인용해.
3. 원본에 없는 숫자나 절차는 절대 추가하지 마.
4. 불확실한 내용은 "자세한 내용은 담당 기관에 문의하세요"로 넘겨.
5. 친근하고 자연스러운 블로그 문체로 써. 딱딱한 행정 문서 느낌 X.
6. 제목(##), 소제목(###) 등 마크다운 헤더로 구조를 나눠줘.
7. 글 길이는 반드시 1000자 이상으로 작성해.
8. 마지막 줄에는 반드시 다음 문장을 그대로 넣어:
   > 📖 이 글은 공공데이터포털(정부24)의 원본 데이터를 바탕으로 작성되었습니다.

출력 형식 (아래 형식만 출력, 다른 텍스트 없이):
---
title: "(서비스명을 살린 흥미로운 제목)"
date: ${today}
summary: "(원본 summary 기반 한 줄 요약)"
category: 정보
tags: [태그1, 태그2, 태그3]
---

(본문: 마크다운 형식, 1000자 이상, 팩트만, 블로그 문체)

> 📖 이 글은 공공데이터포털(정부24)의 원본 데이터를 바탕으로 작성되었습니다.`;

  let responseText;
  try {
    responseText = await callGemini(prompt);
  } catch (err) {
    console.error('[generate-blog-post] Gemini 호출 실패:', err.message);
    return;
  }

  let body = stripCodeFence(responseText);

  // Gemini가 item의 날짜를 쓸 수 있으므로 오늘 날짜로 강제 교체
  body = body.replace(/^date:.*$/m, `date: ${today}`);

  if (!body || body.length < 100) {
    console.error('[generate-blog-post] 생성된 본문이 너무 짧습니다.');
    return;
  }

  if (!fs.existsSync(POSTS_DIR)) {
    fs.mkdirSync(POSTS_DIR, { recursive: true });
  }

  // 파일명: {startDate}-{city}-{id}.md  ← page.tsx getBlogSlug 과 동일 패턴
  const baseFilename = buildFilename(latestItem);
  let finalFilename = `${baseFilename}.md`;
  let counter = 2;
  while (fs.existsSync(path.join(POSTS_DIR, finalFilename))) {
    finalFilename = `${baseFilename}-${counter}.md`;
    counter += 1;
  }

  const finalPath = path.join(POSTS_DIR, finalFilename);
  try {
    fs.writeFileSync(finalPath, body + '\n', 'utf-8');
    console.log(`[generate-blog-post] 완료: ${finalFilename}`);
  } catch (err) {
    console.error('[generate-blog-post] 파일 저장 실패:', err.message);
  }
}

main().catch((err) => {
  console.error('[generate-blog-post] 치명적 오류:', err);
  process.exit(1);
});
