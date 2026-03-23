import { ArrowRight, BookMarked, Bot, Search, Sparkles } from "lucide-react";

import { getChatIndex } from "../api/apiClient";

function LandingPage({ onGetStarted, onContinueChat }) {
  const hasPreviousChats = getChatIndex().length > 0;

  return (
    <main
      className="relative z-10 min-h-screen px-4 pb-10 pt-[140px]"
      style={{ color: "var(--text-primary)" }}
    >
      <section className="mx-auto max-w-5xl text-center">
        <div
          className="mb-6 inline-flex items-center gap-2 rounded-2xl border bg-[color:var(--glass-bg)] px-4 py-2 text-xs font-medium backdrop-blur-xl transition-all duration-200"
          style={{
            borderColor: "color-mix(in srgb, var(--accent) 40%, transparent)",
            color: "var(--accent)",
          }}
        >
          <Sparkles size={14} />
          AI-Powered Research Assistant
        </div>

        <h1
          className="text-[56px] font-bold leading-[1.1] tracking-tight"
          style={{ color: "var(--text-primary)" }}
        >
          Understand Any Research Paper
          <br />
          <span
            className="bg-clip-text text-transparent"
            style={{
              backgroundImage:
                "linear-gradient(135deg, var(--accent), var(--accent-secondary))",
            }}
          >
            Instantly.
          </span>
        </h1>

        <p
          className="mx-auto mt-4 max-w-[520px] text-lg"
          style={{ color: "var(--text-secondary)" }}
        >
          Upload any PDF and ask natural language questions. PaperPilot uses
          semantic search and Llama 3 to find exact answers with source
          citations.
        </p>

        <button
          type="button"
          onClick={onGetStarted}
          className="mt-8 inline-flex items-center gap-2 rounded-xl px-8 py-4 text-base font-semibold text-white shadow-[0_8px_32px_rgba(99,102,241,0.3)] transition-all duration-200 hover:-translate-y-[1px] hover:opacity-90"
          style={{
            backgroundImage:
              "linear-gradient(135deg, var(--accent), var(--accent-secondary))",
          }}
        >
          Start Analyzing Papers
          <ArrowRight size={16} />
        </button>

        {hasPreviousChats ? (
          <button
            type="button"
            onClick={onContinueChat}
            className="mt-4 inline-flex items-center gap-2 rounded-xl border px-8 py-4 text-base font-medium transition-all duration-200"
            style={{
              borderColor: "var(--glass-border)",
              color: "var(--text-secondary)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--accent)";
              e.currentTarget.style.color = "var(--text-primary)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--glass-border)";
              e.currentTarget.style.color = "var(--text-secondary)";
            }}
          >
            Continue Previous Chat
            <ArrowRight size={16} />
          </button>
        ) : null}
      </section>

      <section className="mx-auto mt-[100px] grid max-w-6xl gap-6 md:grid-cols-3">
        {[
          {
            icon: <Search size={40} />,
            title: "Semantic Search",
            desc: "FAISS vector search finds the most relevant sections, not just keyword matches.",
          },
          {
            icon: <Bot size={40} />,
            title: "AI-Powered Answers",
            desc: "Llama 3 synthesizes answers from retrieved context with zero hallucination policy.",
          },
          {
            icon: <BookMarked size={40} />,
            title: "Source Citations",
            desc: "Every answer includes exact chunk references so you can verify the source.",
          },
        ].map((feature) => (
          <article
            key={feature.title}
            className="rounded-2xl border bg-[color:var(--glass-bg)] p-6 backdrop-blur-xl transition-all duration-200"
            style={{ borderColor: "var(--glass-border)" }}
          >
            <p style={{ color: "var(--accent)" }}>{feature.icon}</p>
            <h3
              className="mt-4 text-xl font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              {feature.title}
            </h3>
            <p
              className="mt-2 text-sm leading-7"
              style={{ color: "var(--text-secondary)" }}
            >
              {feature.desc}
            </p>
          </article>
        ))}
      </section>

      <section className="mx-auto mt-[100px] max-w-5xl">
        <h2
          className="text-center text-[32px] font-bold"
          style={{ color: "var(--text-primary)" }}
        >
          How It Works
        </h2>
        <div className="relative mt-12 grid gap-8 md:grid-cols-3">
          <div
            className="pointer-events-none absolute left-1/2 top-8 hidden h-px w-[68%] -translate-x-1/2 bg-gradient-to-r from-transparent to-transparent md:block"
            style={{
              backgroundImage:
                "linear-gradient(to right, transparent, color-mix(in srgb, var(--accent) 40%, transparent), transparent)",
            }}
          />
          {[
            {
              num: "01",
              title: "Upload PDF",
              desc: "Drop your research paper in seconds.",
            },
            {
              num: "02",
              title: "Ask Questions",
              desc: "Use natural language prompts.",
            },
            {
              num: "03",
              title: "Get Cited Answers",
              desc: "Receive grounded answers with sources.",
            },
          ].map((step) => (
            <div key={step.num} className="relative z-10 text-center">
              <p
                className="text-5xl font-bold"
                style={{ color: "var(--accent)" }}
              >
                {step.num}
              </p>
              <h3
                className="mt-4 text-lg font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                {step.title}
              </h3>
              <p
                className="mt-2 text-sm"
                style={{ color: "var(--text-secondary)" }}
              >
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      <footer
        className="mt-[100px] pb-10 text-center text-sm"
        style={{ color: "var(--text-muted)" }}
      >
        Built with React · FastAPI · FAISS · Groq
      </footer>
    </main>
  );
}

export default LandingPage;
