(function () {
    const chatUrl = "https://aes-chatbot.vercel.app/eyebit"; // 👉 너의 챗봇 페이지 URL
    const widgetId = "chatbot-widget";
  
    if (document.getElementById(widgetId)) return;
  
    const style = document.createElement("style");
    style.textContent = `
      #${widgetId}-button {
        position: fixed;
        bottom: 24px;
        right: 24px;
        background-color: #007bff;
        color: white;
        padding: 12px 16px;
        border-radius: 999px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        font-weight: bold;
        cursor: pointer;
        z-index: 9999;
        border: none;
      }
  
      #${widgetId}-iframe {
        position: fixed;
        bottom: 80px;
        right: 24px;
        width: 360px;
        height: 540px;
        border: none;
        border-radius: 12px;
        box-shadow: 0 8px 24px rgba(0,0,0,0.25);
        z-index: 9999;
        display: none;
      }
    `;
    document.head.appendChild(style);
  
    const button = document.createElement("button");
    button.id = `${widgetId}-button`;
    button.innerText = "💬 상담하기";
    document.body.appendChild(button);
  
    const iframe = document.createElement("iframe");
    iframe.id = `${widgetId}-iframe`;
    iframe.src = chatUrl;
    document.body.appendChild(iframe);
  
    let open = false;
    button.onclick = () => {
      open = !open;
      iframe.style.display = open ? "block" : "none";
      button.innerText = open ? "❌ 닫기" : "💬 상담하기";
    };
  })();
  