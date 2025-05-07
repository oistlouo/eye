import { useEffect, useRef, useState } from 'react';
import axios from 'axios';

export default function Chat() {
  const [messages, setMessages] = useState([
    {
      role: 'bot',
      text: `💁‍♀️ 안녕하세요! 저는 아이빛안과의 AI 상담사입니다.

궁금하신 점이 있다면 언제든지 물어보세요!

💡 예시 질문:
- "라섹 수술 회복 기간은 얼마나 걸려요?"
- "안구건조증 치료 방법 알려주세요."
- "백내장 수술은 어떻게 진행되나요?"
- "진료 시간과 휴무일이 궁금해요."

편하게 말씀해 주세요. 😊`
    }
  ]);

  const chatEndRef = useRef(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isComposing, setIsComposing] = useState(false);

  const fullFaqList = [
    "아이 시력이 나빠지는 것 같아요. 어떻게 해야 하나요?",
    "아이가 눈을 자주 비벼요. 괜찮은 건가요?",
    "소아 근시는 어떻게 관리하나요?",
    "눈이 자주 충혈돼요. 왜 그런가요?",
    "비문증이 있는데 치료가 가능한가요?",
    "눈이 건조하고 따가울 때 어떻게 해야 하나요?",
    "라섹 수술 후 회복 기간이 얼마나 되나요?",
    "백내장 수술은 아프지 않나요?",
    "드림렌즈는 어떤 사람들이 착용하나요?",
    "노안 수술도 가능한가요?",
    "진료 예약은 어떻게 하면 되나요?",
    "진료 시간과 휴무일 알려주세요.",
    "병원은 어디에 위치해 있나요?",
    "주차는 가능한가요?"
  ];

  const initialFaqItems = [
    "라섹 수술 후 회복 기간이 얼마나 되나요?",
    "안구건조증은 어떻게 치료하나요?",
    "아이 시력이 나빠지는 것 같아요. 어떻게 해야 하나요?"
  ];

  const [faqItems, setFaqItems] = useState(initialFaqItems);
  const [faqVisible, setFaqVisible] = useState(true);
  const [showBooking, setShowBooking] = useState(false);

  const scrollToBottom = () => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const sendMessage = async (customMessage) => {
    const messageToSend = customMessage || input;
    if (!messageToSend.trim()) return;

    const newMessages = [...messages, { role: 'user', text: messageToSend }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const gptMessages = newMessages.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.text
      }));

      const res = await axios.post('https://eye-szg1.onrender.com/chat', {
        messages: gptMessages
      });

      const reply = res.data.reply;
      const suggestedFaq = res.data.suggestedFaq || [];
      const booking = res.data.showBooking || false;

      let adjustedReply = reply;
      if (booking && !reply.includes('초록색 버튼')) {
        adjustedReply += "\n\n고객님~ 예약 원하시면 아래 초록색 버튼을 눌러주세요 😊";
      }

      setMessages([...newMessages, { role: 'bot', text: adjustedReply }]);
      setShowBooking(booking);

      if (suggestedFaq.length > 0) {
        setFaqVisible(false);
        setTimeout(() => {
          setFaqItems(suggestedFaq);
          setFaqVisible(true);
        }, 250);
      }
    } catch {
      setMessages([
        ...newMessages,
        { role: 'bot', text: '⚠️ 죄송합니다. 오류가 발생했습니다. 다시 시도해 주세요.' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen p-6 relative bg-cover bg-center"
      style={{ backgroundImage: 'url("/chat-bg.jpg")' }}
    >
      <div className="absolute inset-0 bg-white/80 z-0" />

      <div
        className="relative max-w-2xl w-full mx-auto rounded-2xl shadow-xl border border-gray-200 overflow-hidden"
        style={{
          backgroundImage: 'url("/chat-bg.jpg")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="relative z-10 p-6 bg-white/80">
          <h2 className="text-2xl font-bold mb-4 text-center text-blue-600">
            👁 아이빛안과 AI 상담 챗봇
          </h2>

          <div className="space-y-3 mb-4 max-h-[450px] overflow-y-auto">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[75%] px-4 py-3 rounded-xl text-sm whitespace-pre-wrap shadow ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-br-none'
                      : 'bg-white text-black border border-gray-300 rounded-bl-none'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="text-sm text-gray-500 italic">입력 중입니다...</div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div
            className={`transition-opacity duration-300 ease-in-out ${
              faqVisible ? 'opacity-100' : 'opacity-0'
            } flex flex-wrap gap-2 mb-4`}
          >
            {faqItems.map((item, index) => (
              <button
                key={index}
                onClick={() => sendMessage(item)}
                className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-sm rounded-md text-gray-800 transition shadow-sm"
              >
                {item}
              </button>
            ))}

            {showBooking && (
              <a
                href="https://booking.naver.com/booking/13/bizes/1104353"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-md mt-2 font-semibold shadow-md"
              >
                📅 아이빛안과 예약하기
              </a>
            )}
          </div>

          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onCompositionStart={() => setIsComposing(true)}
              onCompositionEnd={() => setIsComposing(false)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isComposing) sendMessage();
              }}
              placeholder="궁금한 점을 입력하세요..."
              className="flex-1 px-4 py-2 rounded-md border border-gray-300 text-black shadow-sm"
            />
            <button
              onClick={() => sendMessage()}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition font-semibold"
            >
              {loading ? '...' : '전송'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
