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

function isAlreadyWritten(itemName) {
  if (!fs.existsSync(POSTS_DIR)) return false;
  const files = fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith('.md'));
  for (const file of files) {
    const content = fs.readFileSync(path.join(POSTS_DIR, file), 'utf-8');
    const match = content.match(/^title:\s*["']?(.*?)["']?\s*$/m);
    const title = match ? match[1] : '';
    if (content.includes(itemName) || title.includes(itemName)) {
      return true;
    }
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

function splitResponse(text) {
  const cleaned = stripCodeFence(text);

  // FILENAME 라인 추출
  const filenameMatch = cleaned.match(/FILENAME:\s*([^\n\r]+)/i);
  if (!filenameMatch) {
    throw new Error('Gemini 응답에서 FILENAME을 찾을 수 없습니다.');
  }

  let filename = filenameMatch[1].trim();
  // 확장자 제거 후 .md 보장
  filename = filename.replace(/\.md$/i, '');
  // 파일명에 안전하지 않은 문자 제거
  filename = filename.replace(/[^a-zA-Z0-9가-힣_\-]/g, '-').replace(/-+/g, '-');

  // FILENAME 라인을 본문에서 제거
  const body = cleaned.replace(/FILENAME:\s*[^\n\r]+/i, '').trim();

  return { filename, body };
}

function ensureUniqueFilename(baseName) {
  if (!fs.existsSync(POSTS_DIR)) {
    fs.mkdirSync(POSTS_DIR, { recursive: true });
  }

  let candidate = `${baseName}.md`;
  let counter = 2;
  while (fs.existsSync(path.join(POSTS_DIR, candidate))) {
    candidate = `${baseName}-${counter}.md`;
    counter += 1;
  }
  return candidate;
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

  if (isAlreadyWritten(latestItem.name)) {
    console.log('이미 작성된 글입니다');
    return;
  }

  const today = new Date().toISOString().slice(0, 10);

  const prompt = `아래 공공서비스 정보를 바탕으로 블로그 글을 작성해줘.

정보: ${JSON.stringify(latestItem, null, 2)}

아래 형식으로 출력해줘. 반드시 이 형식만 출력하고 다른 텍스트는 없이:
---
title: (친근하고 흥미로운 제목)
date: ${today}
summary: (한 줄 요약)
category: 정보
tags: [태그1, 태그2, 태그3]
---

(본문: 800자 이상, 친근한 블로그 톤, 추천 이유 3가지 포함, 신청 방법 안내)

마지막 줄에 FILENAME: ${today}-keyword 형식으로 파일명도 출력해줘. 키워드는 영문으로.`;

  let responseText;
  try {
    responseText = await callGemini(prompt);
  } catch (err) {
    console.error('[generate-blog-post] Gemini 호출 실패:', err.message);
    return;
  }

  let filename, body;
  try {
    ({ filename, body } = splitResponse(responseText));
  } catch (err) {
    console.error('[generate-blog-post] 응답 파싱 실패:', err.message);
    return;
  }

  if (!body || body.length === 0) {
    console.error('[generate-blog-post] 생성된 본문이 비어있습니다.');
    return;
  }

  const finalFilename = ensureUniqueFilename(filename);
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
