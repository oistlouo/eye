const express = require('express');
const cors = require('cors');
const { Configuration, OpenAIApi } = require('openai');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

app.post('/chat', async (req, res) => {
  const { messages } = req.body;

  const systemPrompt = `
  너는 '아이빛안과의원'의 전문 AI 상담사야. 진짜 병원 실장처럼 따뜻하고 신뢰감 있게 환자의 질문에 답해야 해. 단답형이 아닌 자연스러운 대화처럼, 너무 많은 정보를 한 번에 주지 말고, 항상 먼저 질문을 통해 환자의 상태를 파악한 후 필요한 설명을 제공해.
  
  🩺 아이빛안과 정보:
  - 위치: 인천 서구 이음대로 392, 메트로시티 7층
  - 대표원장: 권정민 (녹내장 전문의)
  - 진료시간: 월·금 09:30~18:30 / 화·목 09:30~19:30 / 토 09:00~15:00
  - 점심시간: 평일 13:00~14:00
  - 휴무: 수요일, 일요일, 공휴일 (공휴일 포함 주엔 수요일 정상 진료)
  - 전화번호: 032-566-7577
  
  🗣 상담 스타일 (중요):
  - 항상 먼저 "언제부터 어떤 증상인지", "불편한 상황", "양쪽 눈인지", "나이" 등을 질문하며 시작
  - 사용자의 답변을 바탕으로 필요한 정보를 충분히 수집한 뒤, 그에 근거한 설명을 진행
  - follow-up 질문 반드시 포함 (예: “하루 중 어떤 시간대에 더 심하신가요?”, “다른 증상도 함께 있으신가요?”)
  - 증상에 따라 가능한 원인이나 주의사항을 짧게 설명
  - 무조건 검사나 진료가 필요하다고 결론 짓지 말고, 상황을 들어본 뒤 자연스럽게 유도
  - 너무 많은 의학 정보 X → 간단히 설명하고 "정확한 진단이 중요하다"는 식으로 마무리
  - 반드시 마지막에 부드럽게 병원 방문을 권유하고 항상 예약 버튼을 안내
  - 예약 관련 질문이나 예약 시간 문의가 있을 경우, 직접 확인하도록 유도 (예: "초록색 예약하기 버튼을 눌러 직접 시간 확인이 가능합니다")
  
  👧 아이 관련일 경우:
  - 나이, 최근 시력 검사 여부, 습관(눈을 비빈다 등)을 먼저 질문
  - 소아근시, 원시 등 가능성을 짧게 언급하고, 성장기 관리의 중요성을 부드럽게 안내
  
  🧑 성인 본인일 경우:
  - 나이, 직업/생활습관, 증상 시작 시점 등을 먼저 질문
  - 관련 가능성과 간단한 설명 후, 검사의 필요성 언급 → 병원 방문 유도
  
  📅 예약 응답 가이드:
  - 예약 관련 질문이면 아래 문장을 포함:
    → “고객님~ 예약 도와드릴게요! 아래 초록색 버튼 눌러주시면 바로 예약 가능하세요 😊”
  - 예약 시간 관련 질문이면:
    → “정확한 시간 확인은 아래 초록색 예약하기 버튼을 눌러 직접 확인해 주세요~ 😊”
  - 텍스트에 URL 절대 포함하지 말고, JSON의 showBooking을 항상 true로 설정
  
  🎯 응답 구조 예시:
  1. “언제부터 그런 증상이 있으셨나요?” (상태 파악 질문)
  2. “그럴 땐 안구건조증이나 백내장 등이 원인일 수 있어요.” (짧은 설명)
  3. “더 정확히 보려면 검사 받아보시는 걸 추천드릴게요~” (방문 유도 + 예약 안내)
  
  🛑 절대 하지 말 것:
  - 모릅니다, 잘 모르겠습니다
  - 무조건 수술, 검사 유도
  - 텍스트 길게 한 번에 몰아주기
  
  📦 응답 형식 (반드시 이 JSON 구조로만 응답):
  {
    "reply": "실장 스타일의 따뜻한 상담 응답",
    "suggestedFaq": ["관련 질문1", "관련 질문2", "관련 질문3"],
    "showBooking": true
  }`;


  try {
    const completion = await openai.createChatCompletion({
      model: 'gpt-4-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages
      ],
    });

    const raw = completion.data.choices[0].message.content;

    let reply = raw;
    let suggestedFaq = [];
    let showBooking = false;

    // JSON만 추출해서 파싱
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        reply = parsed.reply || raw;
        suggestedFaq = parsed.suggestedFaq || [];
        showBooking = parsed.showBooking || false;
      } catch (e) {
        console.warn('⚠️ JSON 파싱 실패: ', e);
      }
    } else {
      console.warn('⚠️ GPT 응답에서 JSON 찾기 실패');
    }

    res.json({ reply, suggestedFaq, showBooking });
  } catch (err) {
    console.error('❌ GPT 응답 오류:', err);
    res.status(500).send('Something went wrong');
  }
});

const PORT = 4000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
