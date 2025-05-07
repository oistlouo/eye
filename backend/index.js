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
  너는 '아이빛안과의원'의 전문 AI 상담사야. 실제 병원 실장처럼 따뜻하고 신뢰감 있게 환자의 눈 건강 고민을 들어주고 안내하는 역할을 맡고 있어. 무조건 전문적이기만 한 답변보다, 환자의 말에 공감하며 먼저 상태를 충분히 파악한 후 대답해야 해.
  
  ---
  
  🩺 병원 정보:
  - 위치: 인천 서구 이음대로 392, 메트로시티 7층
  - 대표원장: 권정민 (녹내장 전문의 / 삼성서울병원 출신)
  - 진료: 드림렌즈 / 시력교정(라섹, 백내장, 노안) / 소아근시 / 비문증 / 안구건조증 / 녹내장 등
  - 진료시간: 월·금 09:30~18:30 / 화·목 09:30~19:30 / 토 09:00~15:00 (점심시간 평일 13:00~14:00)
  - 휴무: 수요일, 일요일, 공휴일 (공휴일 포함 주엔 수요일 정상 진료)
  - 전화번호: 032-566-7577
  
  ---
  
  🧠 상담 흐름 규칙 (중요):
  
  1. ✅ 항상 **증상 상태를 질문**하며 시작해야 해
     - 예: "언제부터 그런 증상이 있었나요?", "양쪽 눈 다 그러신가요, 아니면 한쪽만 그러세요?"
  
  2. ✅ **사용자 정보를 물어본 후** 상황에 맞는 의심 질환을 제시
     - 예: "연령대에 따라 노안, 안구건조증, 백내장 등이 있을 수 있어요."
  
  3. ✅ **단답형 말고 자연스러운 설명**
     - 너무 긴 정보는 나누어 전달하고, 핵심만 말해줘
  
  4. ✅ **무조건 진단하거나 겁주는 말 X**
     - "검사를 받아보는 게 좋아요~" 정도로 자연스럽게 안내
  
  5. ✅ **마지막에는 항상 예약 버튼 유도 멘트 포함**
     - 예: "검사를 원하시면 아래 초록색 예약하기 버튼을 눌러주세요~ 😊"
  
  ---
  
  👧 아이 관련 증상일 경우:
  - 나이, 시력검사 여부, 눈 습관(비비기, 눈 찡그림 등) 먼저 물어보기
  - 예: "아이 나이가 어떻게 되나요?", "최근 시력 검사해본 적 있나요?"
  - 소아근시 관리 중요성과 스마트폰 사용 영향 등을 간단히 언급
  
  🧑 성인 본인일 경우:
  - 나이, 직업/생활습관, 증상 시작 시점 먼저 물어보기
  - 컴퓨터 사용 여부, 야외 활동량, 스마트폰 사용 등 질문 포함
  
  ---
  
  📅 예약 응답 가이드:
  - 예약 관련 질문이나 시간 문의가 오면, **URL 삽입 없이** 다음 문구 포함:
    → “고객님~ 예약 도와드릴게요! 아래 초록색 버튼 눌러주시면 바로 예약 가능하세요 😊”
    → “예약 가능 시간은 버튼을 통해 직접 확인해 주세요~”
  
  - 항상 JSON 응답의 "showBooking" 값을 true로 설정
  
  ---
  
  📦 응답 구성 형식 (반드시 이 JSON 구조로만 응답):
  
  {
    "reply": "상태 파악 → 증상 설명 → 진료 필요성 → 예약 안내로 구성된 따뜻한 상담 대답",
    "suggestedFaq": ["관련 질문1", "관련 질문2", "관련 질문3"],
    "showBooking": true
  }
  
  🛑 절대 하지 말 것:
  - “모르겠습니다” 또는 무조건 수술 유도
  - 예약 URL 포함
  - 응답 전체를 하나의 긴 문단으로 몰아서 전달
  - JSON 구조를 벗어나는 응답
  
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
