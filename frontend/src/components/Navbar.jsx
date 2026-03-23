import { useEffect, useState } from "react";
import { FileText, MessageSquare, Moon, Plus, Sun } from "lucide-react";

import { fetchTokenUsage } from "../api/apiClient";

function Navbar({ currentScreen, onNavigate, paperId, theme, onThemeToggle }) {
  const [tokenData, setTokenData] = useState({
    token_percentage: 0,
    tokens_today: 0,
    token_budget: 500000,
  });

  async function refreshTokenUsage() {
    const data = await fetchTokenUsage();
    setTokenData(data);
  }

  useEffect(() => {
    refreshTokenUsage();
  }, []);

  useEffect(() => {
    const handler = () => refreshTokenUsage();
    window.addEventListener("tokenUsageUpdated", handler);
    return () => window.removeEventListener("tokenUsageUpdated", handler);
  }, []);

  const tokenPct = Number(tokenData.token_percentage || 0);

  const usageColor =
    tokenPct <= 60
      ? "var(--text-muted)"
      : tokenPct <= 85
        ? "#f59e0b"
        : "#ef4444";

  const handleLogoClick = () => onNavigate("landing");

  return (
    <nav
      className="fixed inset-x-0 top-0 z-50 h-[60px] border-b bg-[color:var(--glass-bg)] backdrop-blur-[20px] transition-all duration-200"
      style={{ borderColor: "var(--glass-border)" }}
    >
      <div className="mx-auto flex h-full w-full max-w-6xl items-center justify-between px-4">
        <button
          type="button"
          onClick={handleLogoClick}
          className="flex items-center gap-2 text-lg font-semibold transition-all duration-200 hover:opacity-90"
          style={{ color: "var(--text-primary)" }}
        >
          <FileText size={20} />
          <span>PaperPilot</span>
        </button>

        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onThemeToggle}
            className="rounded-xl border border-transparent bg-transparent p-2"
            style={{ color: "var(--text-secondary)" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "var(--text-primary)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--text-secondary)";
            }}
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {currentScreen !== "history" ? (
            <button
              type="button"
              onClick={() => onNavigate("history")}
              className="flex items-center gap-2 rounded-xl border border-transparent bg-transparent px-3 py-2 text-sm font-medium"
              style={{ color: "var(--text-secondary)" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "var(--text-primary)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "var(--text-secondary)";
              }}
            >
              <MessageSquare size={16} />
              Chats
            </button>
          ) : null}

          {currentScreen === "landing" ? (
            <button
              type="button"
              onClick={() => onNavigate("upload")}
              className="rounded-xl px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:opacity-90"
              style={{ background: "var(--accent)" }}
            >
              Get Started
            </button>
          ) : null}

          {currentScreen === "chat" ? (
            <>
              <p
                className="text-sm"
                style={{ color: usageColor }}
                title={`${Number(tokenData.tokens_today || 0).toLocaleString()} / ${Number(tokenData.token_budget || 500000).toLocaleString()} tokens used today`}
              >
                {tokenPct}% tokens used
              </p>
              <button
                type="button"
                onClick={() => onNavigate("upload")}
                className="flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition-all duration-200"
                style={{
                  borderColor: "var(--accent)",
                  color: "var(--accent)",
                  background: "transparent",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background =
                    "color-mix(in srgb, var(--accent) 12%, transparent)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
              >
                <Plus size={16} />
                Upload New Paper
              </button>
            </>
          ) : null}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
