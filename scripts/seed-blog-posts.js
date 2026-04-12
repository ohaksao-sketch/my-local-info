/**
 * 일회성 스크립트: local-info.json 모든 항목에 대해
 * 공공데이터포털 원본 데이터를 재수집하고,
 * 팩트 기반이되 읽히는 블로그 형식으로 마크다운을 생성한다.
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
  if (!res.ok) throw new Error(`API ${res.status}`);
  const json = await res.json();
  return Array.isArray(json?.data) && json.data.length > 0 ? json.data[0] : null;
}

function sanitize(text) {
  if (typeof text !== 'string') return '';
  return text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
}

function formatAsList(text) {
  if (!text) return '';
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return '';
  if (lines.length === 1) return lines[0];
  return lines
    .map((l) => {
      const cleaned = l.replace(/^[○•※①②③④⑤⑥⑦⑧⑨⑩\-*·▶◆►◎□■]+\s*/, '').trim();
      return `- ${cleaned}`;
    })
    .join('\n');
}

function detectCity(agency) {
  if (!agency) return null;
  if (agency.includes('의정부')) return { ko: '의정부시', en: 'uijeongbu' };
  if (agency.includes('남양주')) return { ko: '남양주시', en: 'namyangju' };
  if (agency.includes('양주')) return { ko: '양주시', en: 'yangju' };
  if (agency.includes('동두천')) return { ko: '동두천시', en: 'dongducheon' };
  if (agency.includes('포천')) return { ko: '포천시', en: 'pocheon' };
  return null;
}

function generateMarkdown(raw, today) {
  const name = sanitize(raw['서비스명']) || '공공서비스';
  const purpose = sanitize(raw['서비스목적요약']);
  const target = sanitize(raw['지원대상']);
  const content = sanitize(raw['지원내용']);
  const criteria = sanitize(raw['선정기준']);
  const method = sanitize(raw['신청방법']);
  const deadline = sanitize(raw['신청기한']) || '공고 참조';
  const agency = sanitize(raw['소관기관명']);
  const dept = sanitize(raw['부서명']);
  const phone = sanitize(raw['전화문의']);
  const receiveAgency = sanitize(raw['접수기관']);
  const serviceField = sanitize(raw['서비스분야']);
  const supportType = sanitize(raw['지원유형']);
  const sourceUrl = sanitize(raw['상세조회URL']);
  const serviceId = sanitize(raw['서비스ID']);

  const city = detectCity(agency) || { ko: '경기북부', en: 'gyeonggi' };

  const tags = [city.ko, serviceField, supportType].filter(Boolean);

  // 한 줄 요약 (frontmatter용)
  const summaryLine = (purpose || name).split('\n')[0].replace(/"/g, '\\"').slice(0, 150);
  const escapedTitle = name.replace(/"/g, '\\"');

  let md = '';
  md += `---\n`;
  md += `title: "${escapedTitle}"\n`;
  md += `date: ${today}\n`;
  md += `summary: "${summaryLine}"\n`;
  md += `category: 정보\n`;
  md += `tags: [${tags.map((t) => t.replace(/,/g, '')).join(', ')}]\n`;
  md += `---\n\n`;

  // 친근한 인트로 — 팩트 기반 (서비스명, 담당기관만 참조)
  md += `## 🏡 ${city.ko}에 이런 혜택이 있다는 거, 알고 계셨나요?\n\n`;
  md += `안녕하세요! 오늘은 **${city.ko}**에서 운영하는 공공서비스 **"${name}"** 을 소개해드릴게요. ${purpose ? purpose : '해당 지역 주민이라면 꼭 체크해볼 만한 제도예요.'}\n\n`;
  md += `몰라서 놓치기 쉬운 혜택들, 하나하나 알아두면 실생활에 큰 도움이 된답니다. 아래 내용은 전부 **정부24 공식 데이터**를 바탕으로 정리한 내용이에요. ✍️\n\n`;

  // 핵심 정보 박스
  md += `## 📌 핵심 정보 한눈에 보기\n\n`;
  const coreInfo = [];
  if (agency) coreInfo.push(`- **담당 기관**: ${agency}${dept ? ` (${dept})` : ''}`);
  if (serviceField) coreInfo.push(`- **서비스 분야**: ${serviceField}`);
  if (supportType) coreInfo.push(`- **지원 유형**: ${supportType}`);
  if (deadline) coreInfo.push(`- **신청 기한**: ${deadline}`);
  if (receiveAgency) coreInfo.push(`- **접수 기관**: ${receiveAgency}`);
  md += coreInfo.join('\n') + '\n\n';

  // 지원 대상
  if (target) {
    md += `## 👥 누가 신청할 수 있나요?\n\n`;
    md += formatAsList(target) + '\n\n';
  }

  // 지원 내용
  if (content) {
    md += `## 💰 어떤 지원을 받나요?\n\n`;
    md += formatAsList(content) + '\n\n';
  }

  // 선정 기준
  if (criteria && criteria !== target && criteria !== content) {
    md += `## ✅ 선정 기준\n\n`;
    md += formatAsList(criteria) + '\n\n';
  }

  // 신청 방법
  if (method) {
    md += `## 📝 어떻게 신청하나요?\n\n`;
    md += formatAsList(method) + '\n\n';
  }

  // 추천 포인트 3가지 — 원본 데이터 필드에서만 도출 (팩트 기반)
  md += `## ⭐ 이 제도, 이런 분들께 특히 유용해요\n\n`;
  const points = [];

  if (supportType && /현금/.test(supportType)) {
    points.push(`**현금(감면) 지원**이에요. 바우처나 포인트가 아닌 **현금/감면 형태**라 실질적인 도움이 됩니다.`);
  } else if (supportType) {
    points.push(`**${supportType}** 형태로 지원됩니다. 원본 데이터에 명시된 지원 방식이에요.`);
  }

  if (deadline && /상시|수시|연중/.test(deadline)) {
    points.push(`**상시 신청**이 가능해요. 특정 접수 기간에 얽매이지 않고 자격이 되면 언제든 신청할 수 있습니다.`);
  } else if (deadline) {
    points.push(`신청 기한은 **${deadline}** 입니다. 놓치지 않도록 일정을 미리 체크해 두세요.`);
  }

  if (agency) {
    points.push(`**${agency}**에서 직접 운영하는 공식 제도예요. 공공데이터포털(정부24)에 등록된 신뢰할 수 있는 서비스입니다.`);
  }

  points.forEach((p, i) => {
    md += `### ${i + 1}. ${p.split('.')[0]}.\n${p.split('.').slice(1).join('.').trim()}\n\n`;
  });

  // 문의 및 원문
  md += `## ☎️ 문의 및 원문 확인\n\n`;
  if (phone) {
    md += `- **전화 문의**: ${phone}\n`;
  }
  if (sourceUrl) {
    md += `- **정부24 공식 페이지**: [${name} 상세보기](${sourceUrl})\n`;
  }
  md += `\n`;
  md += `공공서비스는 시기에 따라 내용이 변경될 수 있어요. 신청 전에 반드시 **위의 정부24 공식 페이지** 또는 **담당 기관 공식 공고**를 확인해 주세요! 🙏\n\n`;

  md += `---\n\n`;
  md += `> 📖 이 글은 공공데이터포털(정부24)에서 제공하는 **원본 데이터를 바탕으로 작성**되었습니다. 구체적인 금액·대상·조건·절차는 모두 공공데이터포털의 원본 필드를 그대로 인용했으며, 임의로 추측하거나 가공하지 않았습니다.\n`;

  return { md, serviceId, city };
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
  let success = 0, failed = 0;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const serviceId = String(item.id || '');
    if (!serviceId) {
      console.warn(`[seed] ${i + 1}/${items.length} 서비스ID 없음`);
      failed++;
      continue;
    }
    try {
      const raw = await fetchById(serviceId);
      if (!raw) {
        console.warn(`[seed] ${i + 1}/${items.length} ${item.name}: 원본 없음`);
        failed++;
        continue;
      }
      const { md, city } = generateMarkdown(raw, today);
      const filename = `${today}-${city.en}-${serviceId}.md`;
      fs.writeFileSync(path.join(POSTS_DIR, filename), md, 'utf-8');
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
