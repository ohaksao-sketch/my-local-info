@AGENTS.md

## 모델 사용 기준

현재 모델: **Sonnet 4.6** (기본)

아래 상황에서는 반드시 사용자에게 먼저 알리고 더 강력한 모델을 요청할 것:

### Opus 4.6 요청 기준
다음 중 하나라도 해당하면 "이 작업은 Opus 모델이 필요합니다. /model 로 변경해주세요" 라고 먼저 말할 것:
- 프로젝트 전체 구조를 한꺼번에 설계·리팩토링할 때
- 복잡한 버그로 여러 파일을 동시에 추론해야 할 때
- 에이전트 여러 개를 동시에 조율하는 복잡한 자동화 설계 시
- 코드 품질 리뷰나 보안 감사가 필요할 때

### Sonnet 1M context 요청 기준
다음 중 하나라도 해당하면 "컨텍스트가 부족할 수 있습니다. Sonnet 1M으로 변경해주세요" 라고 먼저 말할 것:
- 한 번에 읽어야 할 파일이 20개 이상일 때
- 매우 긴 로그나 데이터 파일 전체를 분석해야 할 때

# 프로젝트 현황 및 다음 단계

## 개발 환경
- 작업 폴더: `/Users/kim/my-seongnam-site` (맥북 로컬)
- 나스 백업: `/Volumes/docker/새 폴더/my-seongnam-site` (5분마다 자동 rsync)
- Node.js: `~/nodejs/bin` (PATH에 추가됨)
- 개발 서버 실행: `export PATH="$HOME/nodejs/bin:$PATH" && npm run dev`
- 접속 URL: http://localhost:3000

## 완료된 작업
- [x] Next.js 16 + TypeScript + Tailwind CSS 프로젝트 셋업
- [x] 메인 페이지 (행사/혜택 카드 목록) - `/src/app/page.tsx`
- [x] 상세 페이지 - `/src/app/details/[id]/page.tsx`
- [x] 샘플 데이터 - `/public/data/local-info.json`
- [x] Cloudflare Pages 배포 설정 (`wrangler.toml`)

## 다음 단계 (순서대로 진행)

### 1단계: 공공데이터 API 연동 (최우선)
- 공공데이터포털(data.go.kr)에서 성남시 행사/지원금 실제 데이터 가져오기
- API 키: `PUBLIC_DATA_API_KEY` (사용자에게 확인 필요)
- 스크립트 위치: `/scripts/fetch-data.js` (새로 만들어야 함)
- 결과물: `/public/data/local-info.json` 자동 업데이트

### 2단계: 블로그 페이지 구현
- `/src/app/blog/page.tsx` - 블로그 목록 페이지
- `/src/app/blog/[id]/page.tsx` - 블로그 상세 페이지
- 블로그 데이터: `/public/data/blog-posts.json`

### 3단계: Gemini AI 블로그 자동 생성
- API 키: `GEMINI_API_KEY` (사용자에게 확인 필요)
- 스크립트 위치: `/scripts/generate-blog.js` (새로 만들어야 함)
- 공공데이터 기반으로 블로그 글 자동 작성

### 4단계: GitHub Actions 자동화
- `.github/workflows/auto-update.yml` 작성
- 매일 오전 7시(한국시간) 자동 실행
- 순서: 데이터 수집 → AI 글 생성 → 커밋 → Cloudflare 배포

### 5단계: 수익화 코드 삽입
- Google AdSense: `NEXT_PUBLIC_ADSENSE_ID` 필요
- 쿠팡 파트너스: 블로그 글 하단 배너

## 환경변수 (.env.local에 저장)
```
PUBLIC_DATA_API_KEY=여기에입력
GEMINI_API_KEY=여기에입력
NEXT_PUBLIC_ADSENSE_ID=여기에입력
NEXT_PUBLIC_GA_ID=여기에입력
```
