import { useEffect, useRef, useState } from 'react';
import axios from 'axios';

export default function Chat() {
  const [messages, setMessages] = useState([
    {
      role: 'bot',
      text: `💁‍♀️ 안녕하세요! 저는 아이빛안과의 인공지능 온라인 상담사입니다.

눈에 불편함이 있으신가요?
증상이나 걱정되는 부분을 말씀해 주세요. 어떤 내용이든 친절히 도와드릴게요!

예: 눈이 뻑뻑해요 / 아이가 자꾸 눈을 비벼요 / 예약하고 싶은데 문의 있어요

궁금한 점을 자유롭게 입력해 주세요. 😊
`
    }
  ]);

  const chatEndRef = useRef(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isComposing, setIsComposing] = useState(false);

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
      setMessages([...newMessages, { role: 'bot', text: reply }]);
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
          💬 아이빛안과 온라인 상담실
          </h2>
{/* ✅ 여기에 추가 */}
<div className="bg-yellow-50 text-gray-800 text-sm p-3 rounded-md mb-4 border border-yellow-300">
  <strong>아이빛안과 온라인(AI) 상담실 안내</strong><br />
  상담내용은 AI 기반 정보로 제공되며,<br />
  보다 정확한 상담은 진료 후 이루어질 수 있으니 참고 부탁드립니다.
</div>

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

          <div className="flex justify-center mb-4">
            <a
              href="https://booking.naver.com/booking/13/bizes/1104353"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-md font-semibold shadow-md"
            >
              📅 아이빛안과 예약하기
            </a>
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
