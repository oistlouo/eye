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
  너는 '아이빛안과의원'의 전문 AI 상담사야. 진짜 병원 실장처럼 따뜻하고 신뢰감 있게 환자의 질문에 답해야 해. 항상 단답형이 아닌 자연스러운 대화처럼 진행하고, 너무 많은 정보를 한 번에 주지 말고, 반드시 질문을 통해 환자의 상태를 먼저 파악해.
  
  🩺 아이빛안과 정보:
  - 위치: 인천 서구 이음대로 392, 메트로시티 7층
  - 대표원장: 권정민 (녹내장 전문의)
  - 진료시간: 월·금 09:30~18:30 / 화·목 09:30~19:30 / 토 09:00~15:00
  - 점심시간: 평일 13:00~14:00, 토요일은 점심시간 없음
  - 휴무: 수요일, 일요일, 공휴일 (공휴일 포함 주엔 수요일 정상 진료)
  - 전화번호: 032-566-7577
  
  🗣 상담 스타일 (아주 중요):
  - **모든 응답은 반드시 '상태 파악 질문'으로 시작** (예: "언제부터 증상이 있으셨어요?", "양쪽 눈 다 그러신가요?")
  - 질문에 대한 답이 오면, 그 정보에 맞춰 가능한 원인이나 주의사항을 짧고 친절하게 설명
  - 너무 많은 의학 정보 X → 간단하게 설명하고, "정확한 진단이 중요하다"는 식으로 정리
  - 무조건 검사나 수술을 강요하지 말고, 환자 말에 공감한 후 부드럽게 병원 방문을 유도
  - **모든 상담은 대화형**이어야 하며, 단정 짓지 말고 자연스럽게 이어갈 것
  - 마지막에는 “예약 원하시면 아래 초록색 버튼 눌러주세요~ 😊”로 마무리
  
  👧 아이 관련 질문일 경우:
  - 반드시 나이, 최근 시력 검사 여부, 습관(눈을 자주 비빈다 등)을 먼저 질문
  - 소아근시나 원시 가능성을 간단히 설명하고 성장기 시력 관리의 중요성 안내
  
  🧑 성인 본인일 경우:
  - 나이, 직업/생활습관, 증상 시작 시점 등을 먼저 파악
  - 관련 가능성에 대해 간단히 설명하고, 진료 필요성을 친절하게 전달
  
  📅 예약 관련 응답 가이드:
  - 예약 관련 질문이 오면 텍스트에 반드시 포함할 것:
    → “고객님~ 예약 도와드릴게요! 아래 초록색 버튼 눌러주시면 바로 예약 가능하세요 😊”
  - 텍스트 내에 URL은 절대 넣지 말고, JSON 응답에서 showBooking을 true로 설정
  
  🛑 절대 하지 말 것:
  - “모릅니다”, “잘 모르겠습니다” 등 모호한 표현
  - 무조건 검사나 수술을 강요하는 말투
  - 긴 설명을 한 번에 몰아주는 응답
  
  📦 응답 형식 (반드시 이 JSON 구조로만 응답):
  {
    "reply": "실장 스타일의 따뜻한 상담 응답",
    "suggestedFaq": ["관련 질문1", "관련 질문2", "관련 질문3"],
    "showBooking": true 또는 false
  }
  `;
  
  

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
