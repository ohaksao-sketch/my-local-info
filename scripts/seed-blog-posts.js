/**
 * 일회성 스크립트: local-info.json의 모든 항목에 대해
 * 공공데이터포털 API에서 원본 데이터를 재수집하고
 * 팩트 기반 마크다운 블로그 글을 생성한다.
 *
 * 실행: node --env-file=.env.local scripts/seed-blog-posts.js
 */

'use strict';

const fs = require('fs');
const path = require('path');

const API_KEY = process.env.PUBLIC_DATA_API_KEY;
const LOCAL_INFO_PATH = path.join(process.cwd(), 'public/data/local-info.json');
const POSTS_DIR = path.join(process.cwd(), 'src/content/posts');

const API_URL = 'https://api.odcloud.kr/api/gov24/v3/serviceList';

async function fetchById(serviceId) {
  const url = new URL(API_URL);
  url.searchParams.set('serviceKey', API_KEY);
  url.searchParams.set('page', '1');
  url.searchParams.set('perPage', '1');
  url.searchParams.set('returnType', 'JSON');
  url.searchParams.set('cond[서비스ID::EQ]', serviceId);

  const res = await fetch(url.toString());
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API 오류 ${res.status}: ${body.slice(0, 150)}`);
  }
  const json = await res.json();
  return Array.isArray(json?.data) && json.data.length > 0 ? json.data[0] : null;
}

function sanitize(text) {
  if (typeof text !== 'string') return '';
  return text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
}

function toEnglishSlug(koreanName) {
  // 간단한 영문 slug 생성: 서비스ID 기반
  return '';
}

function generateMarkdown(rawItem, today) {
  const name = sanitize(rawItem['서비스명']) || '공공서비스';
  const purpose = sanitize(rawItem['서비스목적요약']);
  const target = sanitize(rawItem['지원대상']);
  const content = sanitize(rawItem['지원내용']);
  const criteria = sanitize(rawItem['선정기준']);
  const method = sanitize(rawItem['신청방법']);
  const deadline = sanitize(rawItem['신청기한']);
  const agency = sanitize(rawItem['소관기관명']);
  const dept = sanitize(rawItem['부서명']);
  const phone = sanitize(rawItem['전화문의']);
  const receiveAgency = sanitize(rawItem['접수기관']);
  const category_field = sanitize(rawItem['서비스분야']);
  const supportType = sanitize(rawItem['지원유형']);
  const serviceId = sanitize(rawItem['서비스ID']);

  // 태그 생성 (기관명에서 도시 추출)
  const cityMatch = agency.match(/(의정부시|양주시|동두천시|포천시|남양주시)/);
  const city = cityMatch ? cityMatch[1] : '경기북부';
  const tags = [city, category_field || '생활정보', supportType || '지원'].filter(Boolean);

  // frontmatter용 한줄 요약 (따옴표 이스케이프)
  const summary = purpose.split('\n')[0].replace(/"/g, '\\"').slice(0, 150) || name;
  const escapedTitle = name.replace(/"/g, '\\"');

  let body = '';
  body += `---\n`;
  body += `title: "${escapedTitle}"\n`;
  body += `date: ${today}\n`;
  body += `summary: "${summary}"\n`;
  body += `category: 정보\n`;
  body += `tags: [${tags.map((t) => t.replace(/,/g, '')).join(', ')}]\n`;
  body += `---\n\n`;

  body += `## 어떤 제도인가요?\n\n`;
  body += `${purpose || name}\n\n`;

  if (agency || dept) {
    body += `**담당 기관:** ${[agency, dept].filter(Boolean).join(' / ')}\n\n`;
  }

  if (target) {
    body += `## 지원 대상\n\n`;
    body += formatMultiline(target) + '\n\n';
  }

  if (content) {
    body += `## 지원 내용\n\n`;
    body += formatMultiline(content) + '\n\n';
  }

  if (criteria) {
    body += `## 선정 기준\n\n`;
    body += formatMultiline(criteria) + '\n\n';
  }

  if (method || receiveAgency) {
    body += `## 신청 방법\n\n`;
    if (method) body += formatMultiline(method) + '\n\n';
    if (receiveAgency) body += `**접수 기관:** ${receiveAgency}\n\n`;
  }

  if (deadline) {
    body += `## 신청 기한\n\n`;
    body += `${deadline}\n\n`;
  }

  if (phone) {
    body += `## 문의\n\n`;
    body += `☎️ ${phone}\n\n`;
  }

  body += `---\n\n`;
  body += `> 📌 이 글은 공공데이터포털(정부24)에서 제공하는 원본 데이터를 바탕으로 작성되었습니다.\n`;
  body += `> 자세한 사항과 최신 정보는 반드시 **담당 기관 공식 공고** 또는 **정부24 상세 페이지**를 확인해 주세요.\n`;

  return { body, serviceId };
}

function formatMultiline(text) {
  // 멀티라인 텍스트를 마크다운 리스트 또는 문단으로 변환
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return '';

  // 한 줄이면 그대로 반환
  if (lines.length === 1) return lines[0];

  // 여러 줄이면 마크다운 리스트로
  return lines
    .map((l) => {
      // 이미 리스트 마커(○, -, •, ※, ①②③ 등)가 있으면 "-"로 통일
      const cleaned = l.replace(/^[○•※①②③④⑤⑥⑦⑧⑨⑩\-*·]+\s*/, '').trim();
      return `- ${cleaned}`;
    })
    .join('\n');
}

function buildFilename(today, rawItem, index) {
  const serviceId = rawItem['서비스ID'] || `item-${index}`;
  const cityMatch = (rawItem['소관기관명'] || '').match(/(uijeongbu|yangju|dongducheon|pocheon|namyangju)/i);
  let cityEn = 'gyeonggi';
  const agency = rawItem['소관기관명'] || '';
  if (agency.includes('의정부')) cityEn = 'uijeongbu';
  else if (agency.includes('남양주')) cityEn = 'namyangju';
  else if (agency.includes('양주')) cityEn = 'yangju';
  else if (agency.includes('동두천')) cityEn = 'dongducheon';
  else if (agency.includes('포천')) cityEn = 'pocheon';
  return `${today}-${cityEn}-${serviceId}.md`;
}

async function main() {
  if (!API_KEY) {
    console.error('PUBLIC_DATA_API_KEY 환경변수가 필요합니다.');
    process.exit(1);
  }

  if (!fs.existsSync(POSTS_DIR)) {
    fs.mkdirSync(POSTS_DIR, { recursive: true });
  }

  const localInfo = JSON.parse(fs.readFileSync(LOCAL_INFO_PATH, 'utf-8'));
  const items = [
    ...(localInfo.events || []),
    ...(localInfo.benefits || []),
  ];

  console.log(`[seed] ${items.length}개 항목 처리 시작`);

  const today = new Date().toISOString().slice(0, 10);
  let success = 0;
  let failed = 0;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const serviceId = String(item.id || '');
    if (!serviceId) {
      console.warn(`[seed] ${i + 1}/${items.length} 서비스ID 없음, 스킵`);
      failed++;
      continue;
    }

    try {
      const raw = await fetchById(serviceId);
      if (!raw) {
        console.warn(`[seed] ${i + 1}/${items.length} ${item.name}: 원본 데이터 없음`);
        failed++;
        continue;
      }

      const { body } = generateMarkdown(raw, today);
      const filename = buildFilename(today, raw, i);
      const filepath = path.join(POSTS_DIR, filename);

      fs.writeFileSync(filepath, body, 'utf-8');
      console.log(`[seed] ${i + 1}/${items.length} ✓ ${filename}`);
      success++;
    } catch (err) {
      console.error(`[seed] ${i + 1}/${items.length} ${item.name} 오류:`, err.message);
      failed++;
    }
  }

  console.log(`[seed] 완료 - 성공: ${success}, 실패: ${failed}`);
}

main().catch((err) => {
  console.error('[seed] 치명적 오류:', err);
  process.exit(1);
});
