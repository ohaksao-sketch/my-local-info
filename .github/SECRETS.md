# GitHub Actions Secrets 설정 가이드

GitHub 저장소 → Settings → Secrets and variables → Actions 에서 아래 항목을 등록하세요.

| Secret 이름 | 설명 | 발급처 |
|---|---|---|
| `PUBLIC_DATA_API_KEY` | 공공데이터포털 API 인증키 | https://data.go.kr → 마이페이지 → 인증키 |
| `GEMINI_API_KEY` | Gemini AI API 키 | https://aistudio.google.com/app/apikey |
| `CLOUDFLARE_API_TOKEN` | Cloudflare API 토큰 | Cloudflare Dashboard → My Profile → API Tokens |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare 계정 ID | Cloudflare Dashboard → 우측 하단 |
| `NEXT_PUBLIC_ADSENSE_ID` | Google AdSense 퍼블리셔 ID | https://adsense.google.com |
| `NEXT_PUBLIC_GA_ID` | Google Analytics 측정 ID | https://analytics.google.com |

## 공공데이터포털 API 신청 방법
1. https://data.go.kr 접속 후 회원가입
2. 검색창에 "한국관광공사 행사정보서비스" 검색 → 활용신청
3. 검색창에 "복지로 복지서비스 목록조회" 검색 → 활용신청
4. 신청 승인 후 마이페이지에서 인증키 확인 (일반 인증키 사용)

## Cloudflare API 토큰 생성 방법
1. Cloudflare Dashboard → My Profile → API Tokens → Create Token
2. "Edit Cloudflare Workers" 템플릿 사용
3. Zone Resources: 해당 도메인 선택
