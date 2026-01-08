import { GoogleGenerativeAI } from '@google/generative-ai';

// 지연 초기화 (lazy initialization)
let genAI = null;

function getGenAI() {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY 환경변수가 설정되지 않았습니다.');
    }
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
}

export async function analyzeCompany(company) {
  const ai = getGenAI();
  const model = ai.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const prompt = `
다음 기업을 분석해주세요.

회사명: ${company.name}
업종: ${company.industry}
웹사이트: ${company.website || '없음'}

다음 형식의 JSON으로 응답해주세요:
{
  "priority": "high" | "medium" | "low",
  "bm_summary": "해시태그 형식 100자 이내 (예: #B2B마케팅 #콘텐츠제작)",
  "news_summary": "해시태그 형식 100자 이내 (예: #시리즈A유치 #신규채용)",
  "news_urls": ["관련 뉴스 URL 배열"],
  "priority_reason": "우선순위 판단 이유"
}

우선순위 판단 기준:
- high: AI 도입에 관심 있는 징후 (채용공고, 뉴스, 투자 등)
- medium: 잠재적 니즈가 있을 수 있음
- low: 당장 니즈가 낮아 보임
`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    throw new Error('AI 응답에서 JSON을 찾을 수 없습니다.');
  } catch (error) {
    console.error('Gemini 분석 오류:', error);
    throw new Error(`AI 분석 실패: ${error.message}`);
  }
}

export async function generateDraft(company, template, demoLink, senderName) {
  const ai = getGenAI();
  const model = ai.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const prompt = `
다음 기업에게 보낼 콜드메일 초안을 생성해주세요.

[기업 정보]
회사명: ${company.name}
업종: ${company.industry}
담당자: ${company.contact_name || '담당자'}
BM 요약: ${company.bm_summary || '정보 없음'}
최근 뉴스: ${company.news_summary || '정보 없음'}

[템플릿]
제목: ${template.subject}
본문: ${template.body}

[추가 정보]
데모 링크: ${demoLink}
발신자명: ${senderName}

[생성 규칙]
1. {{custom_intro}}: 기업의 BM을 언급하며 관심을 유도하는 1-2문장
2. {{custom_proposal}}: 해당 기업에 맞는 AI 솔루션 제안 2-3문장
3. 전체적으로 자연스럽고 개인화된 느낌으로
4. 모든 변수를 적절히 치환

다음 형식의 JSON으로 응답해주세요:
{
  "subject": "완성된 제목 (변수 치환됨)",
  "body": "완성된 본문 (변수 치환됨)",
  "custom_intro": "생성한 인트로",
  "custom_proposal": "생성한 제안"
}
`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    throw new Error('AI 응답에서 JSON을 찾을 수 없습니다.');
  } catch (error) {
    console.error('Gemini 초안 생성 오류:', error);
    throw new Error(`AI 초안 생성 실패: ${error.message}`);
  }
}
