
// utils.ts

// 참고: 이 함수는 토큰 수를 글자 수로 대략적으로 추정합니다.
// 실제 토큰 수는 모델의 토크나이저에 따라 달라지며, 특히 다국어 환경에서 차이가 클 수 있습니다.
// 가능하다면, 서버 측에서 모델의 공식 토크나이저 라이브러리를 사용하거나,
// SDK에서 제공하는 토큰 계산 기능을 활용하는 것이 가장 정확합니다.
// 현재 @google/genai SDK는 클라이언트 측 countTokens API를 직접 제공하지 않을 수 있습니다.

// 일반적인 가정: 영문은 1토큰 ~4자, 한글은 1토큰 ~2-3자. 안전 계수를 적용합니다.
const AVG_CHARS_PER_TOKEN = 2; // 한글 등을 고려하여 보수적으로 설정 (1토큰당 평균 글자수)

export function truncateInputForAI(text: string, maxTokens: number): string {
  if (!text) return "";
  
  const estimatedMaxChars = maxTokens * AVG_CHARS_PER_TOKEN;
  
  if (text.length > estimatedMaxChars) {
    console.warn(
      `입력 텍스트가 추정된 최대 글자 수를 초과하여 잘라냅니다. ` +
      `(원문: ${text.length}자, 제한: ${estimatedMaxChars}자, 최대 토큰 추정치: ${maxTokens})`
    );
    return text.substring(0, estimatedMaxChars);
  }
  return text;
}