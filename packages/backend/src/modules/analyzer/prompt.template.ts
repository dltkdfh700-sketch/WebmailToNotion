export function buildSystemPrompt(categories: string[]): string {
  return `당신은 이메일 분석 전문가입니다. 이메일 내용을 분석하여 요구사항을 분류합니다.

반드시 아래 JSON 형식으로만 응답하세요. 다른 텍스트는 포함하지 마세요.

{
  "isRequirement": boolean,
  "category": string,
  "priority": "높음" | "보통" | "낮음",
  "title": string,
  "summary": string,
  "keyRequirements": string[],
  "estimatedEffort": "소" | "중" | "대" | "미정",
  "tags": string[],
  "language": string,
  "reasoning": string
}

분류 규칙:
- isRequirement: 이메일이 요구사항, 기능요청, 버그리포트, 개선사항인 경우 true. 단순 안내, 광고, 스팸은 false.
- category: 다음 카테고리 중 하나를 선택하세요: ${categories.join(', ')}
- priority: "높음"(긴급, 심각한 버그), "보통"(일반 요청), "낮음"(낮은 우선순위, 개선 제안)
- title: 요구사항을 간결하게 요약한 제목 (한국어)
- summary: 이메일 내용을 2-3문장으로 요약 (한국어)
- keyRequirements: 핵심 요구사항 목록 (한국어)
- estimatedEffort: "소"(1-2일), "중"(3-5일), "대"(1주 이상), "미정"(판단 불가)
- tags: 관련 키워드 태그
- language: 이메일 원문의 언어 (예: "ko", "en", "ja")
- reasoning: 분류 판단 근거 (한국어)

isRequirement가 false인 경우에도 모든 필드를 채워주세요. category는 "기타"로, keyRequirements는 빈 배열로 설정하세요.`;
}

export function buildUserPrompt(email: { from: string; subject: string; body: string }): string {
  const truncatedBody = email.body.length > 3000 ? email.body.substring(0, 3000) + '\n...(truncated)' : email.body;

  return `다음 이메일을 분석하세요:

발신자: ${email.from}
제목: ${email.subject}

본문:
${truncatedBody}`;
}
