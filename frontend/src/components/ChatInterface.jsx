import { useEffect, useMemo, useRef, useState } from "react";

import { queryPaper } from "../api/apiClient";
import ChatMessage from "./ChatMessage";
import SystemNotice from "./SystemNotice";

function ChatInterface({ paperId }) {
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
    <section className="flex h-screen flex-col bg-slate-50 text-slate-800">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
        <h1 className="text-lg font-semibold text-slate-800">PaperPilot 📄</h1>
        <p className="text-sm text-slate-500">
          Queries today: {dailyCount} / 100
        </p>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto w-full max-w-4xl">
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
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 shadow-sm">
                Thinking…
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="border-t border-slate-200 bg-white px-4 py-4">
        <div className="mx-auto flex w-full max-w-4xl items-end gap-3">
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder="Ask about methods, results, limitations, or citations..."
            className="max-h-[72px] min-h-[44px] flex-1 resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm leading-6 text-slate-800 outline-none ring-blue-600 placeholder:text-slate-400 focus:ring-2"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!canSend}
            className="h-11 rounded-xl bg-blue-600 px-5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </div>
    </section>
  );
}

export default ChatInterface;
