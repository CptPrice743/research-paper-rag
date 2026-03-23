import { useEffect, useState } from "react";

import LandingPage from "./components/LandingPage";
import Navbar from "./components/Navbar";
import UploadPaper from "./components/UploadPaper";
import ChatInterface from "./components/ChatInterface";
import ChatHistoryPage from "./components/ChatHistoryPage";

function App() {
  const [screen, setScreen] = useState("landing");
  const [paperId, setPaperId] = useState(null);
  const [fileName, setFileName] = useState("");
  const [theme, setTheme] = useState(
    () => localStorage.getItem("theme") || "dark",
  );

  useEffect(() => {
    localStorage.setItem("theme", theme);
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const handleNavigate = (nextScreen) => {
    if (nextScreen === "upload" && screen === "chat") {
      setPaperId(null);
    }
    setScreen(nextScreen);
  };

  return (
    <div
      className="relative min-h-screen"
      style={{ color: "var(--text-primary)" }}
    >
      <Navbar
        currentScreen={screen}
        onNavigate={handleNavigate}
        paperId={paperId}
        theme={theme}
        onThemeToggle={() =>
          setTheme((prev) => (prev === "dark" ? "light" : "dark"))
        }
      />

      {screen === "landing" ? (
        <LandingPage
          onGetStarted={() => setScreen("upload")}
          onContinueChat={() => setScreen("history")}
        />
      ) : null}

      {screen === "upload" ? (
        <UploadPaper
          onUploadSuccess={(id, name) => {
            setPaperId(id);
            setFileName(name);
            setScreen("chat");
          }}
        />
      ) : null}

      {screen === "chat" ? (
        <ChatInterface
          paperId={paperId}
          fileName={fileName}
          onPaperReupload={(newId, newFileName) => {
            setPaperId(newId);
            if (newFileName) {
              setFileName(newFileName);
            }
          }}
        />
      ) : null}

      {screen === "history" ? (
        <ChatHistoryPage
          onSelectChat={(selectedChat) => {
            setPaperId(selectedChat.paperId);
            setFileName(selectedChat.fileName || "");
            setScreen("chat");
          }}
          onBack={() => setScreen("landing")}
          onUploadNew={() => setScreen("upload")}
        />
      ) : null}
    </div>
  );
}

export default App;
