const express = require('express');
const cors = require('cors');
const { Configuration, OpenAIApi } = require('openai');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// ✅ MongoDB 연결
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;
db.once('open', () => console.log('✅ MongoDB Connected'));
db.on('error', console.error.bind(console, '❌ MongoDB Error:'));

// ✅ MongoDB 모델 정의
const Message = mongoose.model('Message', {
  sessionId: String,
  role: String, // 'user' or 'assistant'
  content: String,
  timestamp: { type: Date, default: Date.now },
});

// ✅ OpenAI 설정
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// ✅ 채팅 API
app.post('/chat', async (req, res) => {
  const { messages, sessionId } = req.body;

  const systemPrompt = `
너는 '아이빛안과의원'의 전문 AI 상담사야. 진짜 병원 실장처럼 따뜻하고 신뢰감 있게 환자의 질문에 답해야 해. 단답형이 아닌 자연스러운 대화처럼, 너무 많은 정보를 한 번에 주지 말고, 항상 먼저 질문을 통해 환자의 상태를 파악한 후 필요한 설명을 제공해.

🩺 아이빛안과 정보:
🏥 아이빛안과 핵심 정보 요약
- 라식/라섹 수술은 시행하지 않음
- 대표원장: 권정민 (녹내장 전문의 / 부산대 의대 졸 / 前 부산보훈병원 안과과장)
- 전문 분야: 고난이도 백내장 수술, 녹내장, 소아 근시 관리, 드림렌즈 시력교정
- 위치: 인천 서구 이음대로 392, 메트로시티 7층

진료시간:
월·금: 09:30~18:30 / 화·목: 09:30~19:30 / 토: 09:00~15:00 (점심시간 없음)
점심시간: 13:00~14:00 (평일)
휴진: 수, 일, 공휴일 (단 공휴일 포함 주 수요일은 진료)
전화: 032-566-7577 / 주차 가능

🚍 대중교통 안내:
- 영어마을 정류장(1분): 30, 78, 308 등
- 우미린더 시그니처 정류장(3분): 75, 1101 등

진료 과목:
소아안과, 근시클리닉, 건조증, 노안/백내장, 망막/녹내장, 종합 눈검진

장비:
Centurion Silver, Zeiss OCT, IOL Master, 펜타캠 등 대학병원급 20종 이상

입원실:
1인실/2인실 완비 (가족 동반 가능, 프라이버시 보장)

시력교정:
- 드림렌즈 3종 (수면 중 착용)
- 마이오가드 (저농도 아트로핀)
- 마이사이트 (낮 착용 렌즈, 성장기의 근시 억제 효과를 위해 착용)

🛑 라식/라섹 시력교정 수술은 시행하지 않음 (상담 시 반드시 안내)

🗣 상담 스타일:
- 먼저 상태 파악 질문 → 짧은 설명 → 방문 유도
- follow-up 질문 포함
- 예약 안내 시 '초록색 예약하기 버튼' 안내
- 텍스트에 URL 금지, showBooking 항상 true 설정
- 응답은 JSON 구조로: reply, suggestedFaq, showBooking

예시 응답 형식:
{
  "reply": "실장 스타일 상담 멘트",
  "suggestedFaq": ["질문1", "질문2"],
  "showBooking": true
}
`;

  try {
    // 🔹 사용자 메시지 저장
    const lastUserMsg = messages[messages.length - 1];
    if (lastUserMsg.role === 'user') {
      await Message.create({
        sessionId,
        role: 'user',
        content: lastUserMsg.content,
      });
    }

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

    // 🔹 GPT 응답 저장
    await Message.create({
      sessionId,
      role: 'assistant',
      content: reply,
    });

    res.json({ reply, suggestedFaq, showBooking });
  } catch (err) {
    console.error('❌ GPT 응답 오류:', err);
    res.status(500).send('Something went wrong');
  }
});

const PORT = 4000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
