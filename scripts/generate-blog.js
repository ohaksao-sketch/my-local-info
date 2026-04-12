/**
 * public/data/local-info.json의 데이터를 기반으로
 * Gemini AI를 사용하여 블로그 글을 생성하고 public/data/blog-posts.json에 저장합니다.
 *
 * 실행: node scripts/generate-blog.js
 */

const { loadEnvConfig } = require('@next/env');
const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const projectDir = path.join(__dirname, '..');
loadEnvConfig(projectDir);

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const INFO_PATH = path.join(projectDir, 'public/data/local-info.json');
const BLOG_POSTS_PATH = path.join(projectDir, 'public/data/blog-posts.json');

async function generateWithGemini(prompt) {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY가 설정되지 않았습니다.');
  }

  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text();
}

async function main() {
  console.log('[generate-blog] 블로그 생성 프로세스 시작...');

  if (!fs.existsSync(INFO_PATH)) {
    console.error('[generate-blog] 정보 파일이 없습니다:', INFO_PATH);
    return;
  }

  const infoData = JSON.parse(fs.readFileSync(INFO_PATH, 'utf-8'));
  let blogPosts = [];
  if (fs.existsSync(BLOG_POSTS_PATH)) {
    blogPosts = JSON.parse(fs.readFileSync(BLOG_POSTS_PATH, 'utf-8'));
  }

  const allItems = [...infoData.events, ...infoData.benefits];
  const newPosts = [];

  for (const item of allItems) {
    // 이미 생성된 포스트인지 확인
    const exists = blogPosts.find(p => p.relatedInfoId === item.id);
    if (exists) {
      console.log(`[generate-blog] 이미 존재하는 포스트 스킵: ${item.name}`);
      continue;
    }

    console.log(`[generate-blog] 신규 포스트 생성 중: ${item.name}`);

    const prompt = `
당신은 성남시의 소식을 전하는 친절하고 유능한 블로거 '성남 정보 도우미'입니다.
다음 정보를 바탕으로 블로그 글을 작성해 주세요.

[정보]
- 제목: ${item.name}
- 카테고리: ${item.category}
- 장소: ${item.location}
- 대상: ${item.target}
- 주요 내용: ${item.summary}

[작성 가이드라인]
1. 제목은 독자의 클릭을 유도할 수 있도록 매력적이고 구체적으로 지어주세요.
2. 내용은 친근한 말투(~해요, ~합니다)로 작성해 주세요.
3. 이 정보가 성남 시민들에게 왜 유익한지 강조해 주세요.
4. 글 하단에 관련 해시태그를 3-5개 포함해 주세요.
5. 결과는 반드시 다음 JSON 형식으로만 출력해 주세요. 다른 설명은 포함하지 마세요.

{
  "title": "블로그 제목",
  "content": "블로그 본문 내용 (줄바꿈은 \\n 사용)",
  "excerpt": "글 요약 (2-3문장)"
}
    `;

    try {
      const aiResponse = await generateWithGemini(prompt);
      // AI 응답에서 JSON 부분만 추출 (가끔 마크다운 태그가 포함될 수 있음)
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const postData = JSON.parse(jsonMatch[0]);
        const newPost = {
          id: `post-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          title: postData.title,
          date: new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }),
          excerpt: postData.excerpt,
          content: postData.content,
          relatedInfoId: item.id
        };
        newPosts.push(newPost);
        console.log(`[generate-blog] 생성 완료: ${postData.title}`);
      }
    } catch (err) {
      console.error(`[generate-blog] 생성 실패 (${item.name}):`, err.message);
    }
  }

  if (newPosts.length > 0) {
    const updatedPosts = [...newPosts, ...blogPosts];
    fs.writeFileSync(BLOG_POSTS_PATH, JSON.stringify(updatedPosts, null, 2), 'utf-8');
    console.log(`[generate-blog] 총 ${newPosts.length}개의 새로운 포스트가 저장되었습니다.`);
  } else {
    console.log('[generate-blog] 새로 생성할 포스트가 없습니다.');
  }
}

main().catch(err => {
  console.error('[generate-blog] 치명적 오류:', err);
  process.exit(1);
});
