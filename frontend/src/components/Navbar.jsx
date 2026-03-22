function Navbar({ currentScreen, onNavigate, paperId, dailyCount = 0 }) {
  const handleLogoClick = () => onNavigate("landing");

  return (
    <nav className="fixed inset-x-0 top-0 z-50 h-[60px] border-b border-white/10 bg-[rgba(10,10,15,0.8)] backdrop-blur-[20px] transition-all duration-200">
      <div className="mx-auto flex h-full w-full max-w-6xl items-center justify-between px-4">
        <button
          type="button"
          onClick={handleLogoClick}
          className="text-lg font-semibold text-slate-100 transition-all duration-200 hover:opacity-90"
        >
          📄 PaperPilot
        </button>

        <div className="flex items-center gap-4">
          {currentScreen === "landing" ? (
            <button
              type="button"
              onClick={() => onNavigate("upload")}
              className="rounded-xl bg-[#6366f1] px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:bg-[#4f46e5]"
            >
              Get Started
            </button>
          ) : null}

          {currentScreen === "chat" ? (
            <>
              <p className="text-sm text-slate-400">
                Queries today: {dailyCount} / 100
              </p>
              <button
                type="button"
                onClick={() => onNavigate("upload")}
                className="rounded-xl border border-indigo-500 px-4 py-2 text-sm font-medium text-indigo-400 transition-all duration-200 hover:bg-[rgba(99,102,241,0.1)]"
              >
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
