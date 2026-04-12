/**
 * 공공데이터포털에서 성남시 지원금/혜택 정보를 수집하여
 * public/data/local-info.json 파일을 갱신합니다.
 *
 * 실행: node scripts/fetch-data.js
 *
 * 사용하는 API:
 *   행정안전부 대한민국 공공서비스(혜택) 정보
 *   https://api.odcloud.kr/api/gov24/v3/serviceList
 */

'use strict';

const { loadEnvConfig } = require('@next/env');
const fs = require('fs');
const path = require('path');

const projectDir = path.join(__dirname, '..');
loadEnvConfig(projectDir);

const API_KEY = process.env.PUBLIC_DATA_API_KEY;
const OUTPUT_PATH = path.join(projectDir, 'public/data/local-info.json');

function loadCurrentData() {
  try {
    return JSON.parse(fs.readFileSync(OUTPUT_PATH, 'utf-8'));
  } catch {
    return { events: [], benefits: [] };
  }
}

/**
 * 행정안전부 공공서비스 목록 API
 * 소관기관명에 "성남" 포함된 서비스 조회
 */
async function fetchBenefits() {
  if (!API_KEY) {
    console.warn('[fetch-data] PUBLIC_DATA_API_KEY 없음 → 혜택 데이터 스킵');
    return null;
  }

  const url = new URL('https://api.odcloud.kr/api/gov24/v3/serviceList');
  url.searchParams.set('serviceKey', API_KEY);
  url.searchParams.set('page', '1');
  url.searchParams.set('perPage', '20');
  url.searchParams.set('returnType', 'JSON');
  url.searchParams.set('cond[소관기관명::LIKE]', '성남');

  console.log('[fetch-data] 혜택/지원금 정보 수집 중...');
  const res = await fetch(url.toString());
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`혜택 API 오류: ${res.status} - ${body.slice(0, 200)}`);
  }

  const json = await res.json();
  const items = json?.data;
  if (!items || items.length === 0) {
    console.warn('[fetch-data] 혜택 API: 성남시 결과 없음, 전체 조회 시도...');
    return fetchBenefitsFallback();
  }

  console.log(`[fetch-data] 성남시 서비스 ${items.length}건 수신`);
  return items.map((item, idx) => ({
    id: `benefit-${item['서비스ID'] || idx + 1}`,
    name: item['서비스명'] || '제목 없음',
    category: '혜택',
    startDate: '-',
    endDate: '-',
    location: item['소관기관명'] || '성남시',
    target: item['지원대상'] || item['사용자구분'] || '해당자',
    summary: item['서비스목적'] || item['서비스명'] || '',
    link: item['신청방법URL'] || item['상세조회URL'] || 'https://www.gov.kr',
  }));
}

/**
 * 성남시 결과가 없을 때: 경기도 지원 서비스 조회
 */
async function fetchBenefitsFallback() {
  const url = new URL('https://api.odcloud.kr/api/gov24/v3/serviceList');
  url.searchParams.set('serviceKey', API_KEY);
  url.searchParams.set('page', '1');
  url.searchParams.set('perPage', '20');
  url.searchParams.set('returnType', 'JSON');
  url.searchParams.set('cond[소관기관명::LIKE]', '경기');

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`fallback API 오류: ${res.status}`);

  const json = await res.json();
  const items = json?.data || [];
  console.log(`[fetch-data] 경기도 서비스 ${items.length}건 수신 (fallback)`);

  return items.map((item, idx) => ({
    id: `benefit-${item['서비스ID'] || idx + 1}`,
    name: item['서비스명'] || '제목 없음',
    category: '혜택',
    startDate: '-',
    endDate: '-',
    location: item['소관기관명'] || '경기도',
    target: item['지원대상'] || item['사용자구분'] || '해당자',
    summary: item['서비스목적'] || item['서비스명'] || '',
    link: item['신청방법URL'] || item['상세조회URL'] || 'https://www.gov.kr',
  }));
}

async function main() {
  const current = loadCurrentData();
  let benefits = null;

  try {
    benefits = await fetchBenefits();
  } catch (err) {
    console.error('[fetch-data] 혜택 API 실패:', err.message);
  }

  const result = {
    events: current.events, // 행사 정보는 별도 API 신청 전까지 기존 데이터 유지
    benefits: (benefits && benefits.length > 0) ? benefits : current.benefits,
  };

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(result, null, 2), 'utf-8');

  const benefitsSource = (benefits && benefits.length > 0) ? `API (${benefits.length}건)` : '기존 데이터 유지';
  console.log(`[fetch-data] 완료 - 행사: 기존 데이터 유지 / 혜택: ${benefitsSource}`);
  console.log(`[fetch-data] 저장 위치: ${OUTPUT_PATH}`);
}

main().catch((err) => {
  console.error('[fetch-data] 치명적 오류:', err);
  process.exit(1);
});
