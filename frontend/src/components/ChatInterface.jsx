import { useEffect, useMemo, useRef, useState } from "react";

import { queryPaper } from "../api/apiClient";
import ChatMessage from "./ChatMessage";
import SystemNotice from "./SystemNotice";

function ChatInterface({ paperId, onDailyCountChange }) {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [dailyCount, setDailyCount] = useState(0);

  const scrollRef = useRef(null);
  const textareaRef = useRef(null);

  const canSend = useMemo(
    () => inputValue.trim().length > 0 && !isLoading,
    [inputValue, isLoading],
  );

  useEffect(() => {
    if (!paperId) {
      setMessages([]);
      return;
    }

    const saved = localStorage.getItem(`chat_${paperId}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const restored = Array.isArray(parsed) ? parsed : [];
        setMessages([
          ...restored,
          {
            id: crypto.randomUUID(),
            type: "notice",
            noticeType: "info",
            message:
              "Chat history restored. Note: you may need to re-upload the PDF if the server restarted.",
          },
        ]);
      } catch {
        setMessages([]);
      }
    } else {
      setMessages([]);
    }
  }, [paperId]);

  useEffect(() => {
    if (!paperId) {
      return;
    }
    localStorage.setItem(`chat_${paperId}`, JSON.stringify(messages));
  }, [messages, paperId]);

  useEffect(() => {
    if (!scrollRef.current) {
      return;
    }
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isLoading]);

  const resizeTextarea = () => {
    if (!textareaRef.current) {
      return;
    }
    textareaRef.current.style.height = "auto";
    textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 72)}px`;
  };

  useEffect(() => {
    resizeTextarea();
  }, [inputValue]);

  useEffect(() => {
    if (typeof onDailyCountChange === "function") {
      onDailyCountChange(dailyCount);
    }
  }, [dailyCount, onDailyCountChange]);

  const appendMessage = (message) => {
    setMessages((prev) => [...prev, { id: crypto.randomUUID(), ...message }]);
  };

  const handleSend = async () => {
    const question = inputValue.trim();
    if (!question || isLoading) {
      return;
    }

    appendMessage({ type: "chat", role: "user", content: question });
    setInputValue("");
    setIsLoading(true);

    try {
      const result = await queryPaper(paperId, question);
      appendMessage({
        type: "chat",
        role: "assistant",
        content: result.answer,
        sources: result.sources,
        meta: result.meta,
      });

      if (result.meta?.daily_query_count !== undefined) {
        setDailyCount(result.meta.daily_query_count);
      }
    } catch (error) {
      if (error.message === "DAILY_LIMIT_REACHED") {
        appendMessage({ type: "notice", noticeType: "limit" });
      } else {
        appendMessage({
          type: "notice",
          noticeType: "warning",
          message: error.message,
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  return (
    <section className="flex h-screen flex-col pt-[60px]">
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-4">
        <div className="mx-auto w-full max-w-[800px]">
          {messages.length === 0 ? (
            <SystemNotice
              type="info"
              message="Ask a question about your uploaded paper to get grounded answers with citations."
            />
          ) : null}

          {messages.map((message) => {
            if (message.type === "notice") {
              return (
                <div key={message.id} className="mb-4">
                  <SystemNotice
                    type={message.noticeType}
                    message={message.message}
                    subtext={message.subtext}
                  />
                </div>
              );
            }

            return (
              <ChatMessage
                key={message.id}
                role={message.role}
                content={message.content}
                sources={message.sources}
                meta={message.meta}
              />
            );
          })}

          {isLoading ? (
            <div className="mb-4 flex justify-start">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-[15px] text-slate-300 backdrop-blur-xl">
                Thinking…
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 border-t border-white/10 bg-white/5 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-[800px] items-end gap-3 px-6 py-4">
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder="Ask about methods, results, limitations, or citations..."
            className="max-h-[72px] min-h-[44px] flex-1 resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-[15px] leading-6 text-slate-100 outline-none placeholder:text-slate-600 focus:border-[#6366f1]"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!canSend}
            className="rounded-xl bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            Send
          </button>
        </div>
      </div>
    </section>
  );
}

export default ChatInterface;
