/**
 * 매일 1회 자동 실행되어 공공서비스 정보 1건을 추가하는 스크립트.
 *
 * 실행: node scripts/fetch-public-data.js
 *
 * 환경변수:
 *   PUBLIC_DATA_API_KEY - 공공데이터포털 인증키
 *   GEMINI_API_KEY      - Gemini API 키
 */

'use strict';

const fs = require('fs');
const path = require('path');

const PUBLIC_DATA_API_KEY = process.env.PUBLIC_DATA_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const OUTPUT_PATH = path.join(process.cwd(), 'public/data/local-info.json');

const PUBLIC_DATA_URL = 'https://api.odcloud.kr/api/gov24/v3/serviceList';
const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

// 경기북부 대상 도시
const TARGET_CITIES = ['의정부', '양주', '동두천', '포천'];

function loadLocalInfo() {
  try {
    return JSON.parse(fs.readFileSync(OUTPUT_PATH, 'utf-8'));
  } catch {
    return { events: [], benefits: [] };
  }
}

function containsKeyword(item, keyword) {
  const fields = [
    item['서비스명'],
    item['서비스목적요약'],
    item['지원대상'],
    item['소관기관명'],
  ];
  return fields.some((v) => typeof v === 'string' && v.includes(keyword));
}

async function fetchByCondition(condKey, condValue, perPage = 20) {
  const url = new URL(PUBLIC_DATA_URL);
  url.searchParams.set('serviceKey', PUBLIC_DATA_API_KEY);
  url.searchParams.set('page', '1');
  url.searchParams.set('perPage', String(perPage));
  url.searchParams.set('returnType', 'JSON');
  if (condKey && condValue) {
    url.searchParams.set(condKey, condValue);
  }

  const res = await fetch(url.toString());
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`공공데이터 API 오류: ${res.status} - ${body.slice(0, 200)}`);
  }
  const json = await res.json();
  return Array.isArray(json?.data) ? json.data : [];
}

function dedupeByServiceId(items) {
  const seen = new Set();
  const result = [];
  for (const item of items) {
    const id = item['서비스ID'];
    if (id && !seen.has(id)) {
      seen.add(id);
      result.push(item);
    }
  }
  return result;
}

async function fetchPublicData() {
  if (!PUBLIC_DATA_API_KEY) {
    throw new Error('PUBLIC_DATA_API_KEY 환경변수가 설정되지 않았습니다.');
  }

  // 각 대상 도시별로 소관기관명 LIKE 필터로 호출 후 병합
  const all = [];
  for (const city of TARGET_CITIES) {
    try {
      const items = await fetchByCondition('cond[소관기관명::LIKE]', city, 20);
      console.log(`[fetch-public-data] ${city}: ${items.length}건 수신`);
      all.push(...items);
    } catch (err) {
      console.error(`[fetch-public-data] ${city} 조회 실패:`, err.message);
    }
  }
  return dedupeByServiceId(all);
}

function filterByPriority(allItems) {
  // fetchPublicData가 이미 대상 도시로 필터링했으므로 그대로 반환
  return allItems;
}

function excludeExisting(items, localInfo) {
  const existingNames = new Set();
  for (const arr of [localInfo.events || [], localInfo.benefits || []]) {
    for (const entry of arr) {
      if (entry && typeof entry.name === 'string') {
        existingNames.add(entry.name);
      }
    }
  }
  return items.filter((it) => {
    const name = it['서비스명'];
    return typeof name === 'string' && !existingNames.has(name);
  });
}

function extractJson(text) {
  if (typeof text !== 'string') return null;

  let cleaned = text.trim();
  // 마크다운 코드블록 제거
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');

  // 첫 { 부터 마지막 } 까지 추출
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1 || end < start) return null;

  const jsonStr = cleaned.slice(start, end + 1);
  try {
    return JSON.parse(jsonStr);
  } catch {
    return null;
  }
}

/**
 * 원본 공공데이터 항목에서 상세 URL 조립.
 * 우선순위:
 *   1. 원본 API의 `상세조회URL` 필드 (정부24 보조금24 서비스 상세 페이지)
 *   2. 서비스ID 기반 정부24 URL 직접 조립
 *   3. 네이버 검색 URL (마지막 안전장치)
 */
function buildServiceLink(rawItem) {
  const directUrl = rawItem['상세조회URL'];
  if (typeof directUrl === 'string' && /^https?:\/\//.test(directUrl.trim())) {
    return directUrl.trim();
  }

  const serviceId = rawItem['서비스ID'];
  if (typeof serviceId === 'string' && serviceId.length > 0) {
    return `https://www.gov.kr/portal/rcvfvrSvc/dtlEx/${serviceId}`;
  }

  const serviceName = rawItem['서비스명'];
  if (typeof serviceName === 'string' && serviceName.length > 0) {
    return `https://search.naver.com/search.naver?query=${encodeURIComponent(serviceName + ' 정부24')}`;
  }

  return 'https://www.gov.kr';
}

/**
 * Gemini 없이 원본 API 필드를 직접 매핑해서 목표 형식으로 변환.
 * Gemini API 할당량 초과/장애 시 fallback으로 사용.
 */
function mapDirectly(rawItem) {
  const today = new Date().toISOString().slice(0, 10);
  const supportType = rawItem['지원유형'] || '';

  // 지원유형에 "행사"/"축제" 키워드가 있으면 행사, 아니면 혜택
  const category =
    /행사|축제|대회|공연/.test(supportType) ||
    /행사|축제|대회|공연/.test(rawItem['서비스명'] || '')
      ? '행사'
      : '혜택';

  const deadline = rawItem['신청기한'] || '';
  const isAlways = /상시|수시|연중/.test(deadline);

  return {
    id: rawItem['서비스ID'] || String(Date.now()),
    name: rawItem['서비스명'] || '제목 없음',
    category,
    startDate: today,
    endDate: isAlways ? '상시' : (deadline || '상시'),
    location: rawItem['소관기관명'] || '경기북부',
    target: (rawItem['지원대상'] || '해당자').slice(0, 100),
    summary: (rawItem['서비스목적요약'] || rawItem['서비스명'] || '').slice(0, 200),
  };
}

async function processWithGemini(rawItem) {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY 환경변수가 설정되지 않았습니다.');
  }

  const today = new Date().toISOString().slice(0, 10);

  const prompt = `아래 공공데이터 1건을 분석해서 JSON 객체로 변환해줘. 형식:
{id: 숫자, name: 서비스명, category: '행사' 또는 '혜택', startDate: 'YYYY-MM-DD', endDate: 'YYYY-MM-DD', location: 장소 또는 기관명, target: 지원대상, summary: 한줄요약}
category는 내용을 보고 행사/축제면 '행사', 지원금/서비스면 '혜택'으로 판단해.
startDate가 없으면 오늘 날짜(${today}), endDate가 없으면 '상시'로 넣어.
link 필드는 넣지 마. 링크는 스크립트에서 직접 조립해.
반드시 JSON 객체만 출력해. 다른 텍스트 없이.

[원본 데이터]
${JSON.stringify(rawItem, null, 2)}`;

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
  const parsed = extractJson(text);

  if (!parsed) {
    throw new Error('Gemini 응답에서 JSON을 파싱하지 못했습니다.');
  }

  return parsed;
}

async function main() {
  const localInfo = loadLocalInfo();

  let newItem = null;

  try {
    const allItems = await fetchPublicData();
    if (allItems.length === 0) {
      console.log('[fetch-public-data] API 응답에 데이터가 없습니다.');
      return;
    }

    const filtered = filterByPriority(allItems);
    const candidates = excludeExisting(filtered, localInfo);

    if (candidates.length === 0) {
      console.log('새로운 데이터가 없습니다');
      return;
    }

    const chosen = candidates[0];
    console.log(`[fetch-public-data] 신규 1건 선정: ${chosen['서비스명']}`);

    try {
      newItem = await processWithGemini(chosen);
    } catch (geminiErr) {
      console.warn('[fetch-public-data] Gemini 실패, 직접 매핑으로 fallback:', geminiErr.message);
      newItem = mapDirectly(chosen);
    }

    // link는 원본 데이터 기반으로 직접 조립
    newItem.link = buildServiceLink(chosen);
  } catch (err) {
    console.error('[fetch-public-data] 오류:', err.message);
    console.error('[fetch-public-data] 기존 local-info.json을 유지합니다.');
    return;
  }

  if (!newItem || !newItem.name) {
    console.error('[fetch-public-data] 가공된 항목이 올바르지 않습니다. 기존 데이터 유지.');
    return;
  }

  const updated = {
    events: Array.isArray(localInfo.events) ? [...localInfo.events] : [],
    benefits: Array.isArray(localInfo.benefits) ? [...localInfo.benefits] : [],
  };

  if (newItem.category === '행사') {
    updated.events.push(newItem);
  } else {
    updated.benefits.push(newItem);
  }

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(updated, null, 2), 'utf-8');
  console.log(`[fetch-public-data] 완료: ${newItem.name} (${newItem.category}) 추가됨`);
}

main().catch((err) => {
  console.error('[fetch-public-data] 치명적 오류:', err);
  process.exit(1);
});
