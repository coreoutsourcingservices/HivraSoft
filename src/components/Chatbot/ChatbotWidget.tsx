"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { API_URL } from "@/lib/api";

/** Original Hivra chatbot markup, CSS, assets and multilingual UI. */
export default function ChatbotWidget() {
  const path = usePathname();
  const hideInAdmin = path?.startsWith("/admin") ?? false;
  useEffect(() => {
    // Script is intentionally loaded only after the chatbot DOM exists.
    (window as Window & { HIVRA_CHATBOT_API_BASE?: string }).HIVRA_CHATBOT_API_BASE = API_URL;
    if (document.getElementById("hivra-chatbot-script")) return;
    const script = document.createElement("script");
    script.id = "hivra-chatbot-script";
    script.src = "/chatbot/chatbot.js?v=product-first-20261009";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  return (
    <>
      <div id="launcher-wrapper" style={hideInAdmin ? { display: "none" } : undefined}>
        <div id="name-bubble" aria-live="polite">Hi, Guest</div>
        <div className="pulse-ring" />
        <button id="chatbot-button" type="button" aria-label="Open HivraSoft Assistant">
          <img src="/chatbot/chatbot-logo.webp" alt="Chat assistant" className="animated-girl-gif" />
        </button>
      </div>
      <div id="chatbot-container" role="dialog" aria-label="HivraSoft Assistant" style={hideInAdmin ? { display: "none" } : undefined}>
        <div className="chat-header">
          <div className="header-brand-box">
            <img src="/chatbot/hivrasoft.jpeg" alt="HivraSoft" className="brand-logo-img" />
            <div className="brand-text">
              <span className="company-name">HivraSoft</span>
              <div className="status-indicator">
                <span className="pulse-dot" />
                <small>Active Now</small>
              </div>
            </div>
          </div>
          <div className="header-actions">
            <button id="reset-chat" type="button" title="Refresh conversation" aria-label="Reset chat">↺</button>
            <button id="close-chat" type="button" title="Close" aria-label="Close chat">×</button>
          </div>
        </div>
        <div id="chat-messages" role="log" aria-live="polite" />
        <div id="chat-input-area">
          <input id="user-input" type="text" placeholder="Ask us anything..." aria-label="Message" maxLength={200} />
          <button id="send-btn" type="button">Send</button>
        </div>
        <div className="chat-footer-note"><strong>⚡ Hivra Soft VIP Support</strong></div>
      </div>
    </>
  );
}
