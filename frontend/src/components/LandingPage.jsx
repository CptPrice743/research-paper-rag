function LandingPage({ onGetStarted }) {
  return (
    <main className="relative z-10 min-h-screen px-4 pb-10 pt-[140px] text-slate-100">
      <section className="mx-auto max-w-5xl text-center">
        <div className="mb-6 inline-flex rounded-2xl border border-indigo-500/40 bg-white/5 px-4 py-2 text-xs font-medium text-indigo-300 backdrop-blur-xl transition-all duration-200">
          ✨ AI-Powered Research Assistant
        </div>

        <h1 className="text-[56px] font-bold leading-[1.1] tracking-tight text-slate-100">
          Understand Any Research Paper
          <br />
          <span className="bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] bg-clip-text text-transparent">
            Instantly.
          </span>
        </h1>

        <p className="mx-auto mt-4 max-w-[520px] text-lg text-slate-400">
          Upload any PDF and ask natural language questions. PaperPilot uses
          semantic search and Llama 3 to find exact answers with source
          citations.
        </p>

        <button
          type="button"
          onClick={onGetStarted}
          className="mt-8 rounded-xl bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] px-8 py-4 text-base font-semibold text-white shadow-[0_8px_32px_rgba(99,102,241,0.3)] transition-all duration-200 hover:-translate-y-[1px] hover:opacity-90"
        >
          Start Analyzing Papers →
        </button>
      </section>

      <section className="mx-auto mt-[100px] grid max-w-6xl gap-6 md:grid-cols-3">
        {[
          {
            icon: "🔍",
            title: "Semantic Search",
            desc: "FAISS vector search finds the most relevant sections, not just keyword matches.",
          },
          {
            icon: "🤖",
            title: "AI-Powered Answers",
            desc: "Llama 3 synthesizes answers from retrieved context with zero hallucination policy.",
          },
          {
            icon: "📌",
            title: "Source Citations",
            desc: "Every answer includes exact chunk references so you can verify the source.",
          },
        ].map((feature) => (
          <article
            key={feature.title}
            className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl transition-all duration-200"
          >
            <p className="text-[40px]">{feature.icon}</p>
            <h3 className="mt-4 text-xl font-semibold text-slate-100">
              {feature.title}
            </h3>
            <p className="mt-2 text-sm leading-7 text-slate-400">
              {feature.desc}
            </p>
          </article>
        ))}
      </section>

      <section className="mx-auto mt-[100px] max-w-5xl">
        <h2 className="text-center text-[32px] font-bold text-slate-100">
          How It Works
        </h2>
        <div className="relative mt-12 grid gap-8 md:grid-cols-3">
          <div className="pointer-events-none absolute left-1/2 top-8 hidden h-px w-[68%] -translate-x-1/2 bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent md:block" />
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
              <p className="text-5xl font-bold text-indigo-400">{step.num}</p>
              <h3 className="mt-4 text-lg font-semibold text-slate-100">
                {step.title}
              </h3>
              <p className="mt-2 text-sm text-slate-400">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="mt-[100px] pb-10 text-center text-sm text-slate-600">
        Built with React · FastAPI · FAISS · Groq
      </footer>
    </main>
  );
}

export default LandingPage;
