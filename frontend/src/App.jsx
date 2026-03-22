import { useState } from "react";

import LandingPage from "./components/LandingPage";
import Navbar from "./components/Navbar";
import UploadPaper from "./components/UploadPaper";
import ChatInterface from "./components/ChatInterface";

function App() {
  const [screen, setScreen] = useState("landing");
  const [paperId, setPaperId] = useState(null);
  const [dailyCount, setDailyCount] = useState(0);

  const handleNavigate = (nextScreen) => {
    if (nextScreen === "upload" && screen === "chat") {
      setPaperId(null);
    }
    setScreen(nextScreen);
  };

  return (
    <div className="relative min-h-screen text-slate-100">
      <Navbar
        currentScreen={screen}
        onNavigate={handleNavigate}
        paperId={paperId}
        dailyCount={dailyCount}
      />

      {screen === "landing" ? (
        <LandingPage onGetStarted={() => setScreen("upload")} />
      ) : null}

      {screen === "upload" ? (
        <UploadPaper
          onUploadSuccess={(id) => {
            setPaperId(id);
            setScreen("chat");
          }}
        />
      ) : null}

      {screen === "chat" ? (
        <ChatInterface paperId={paperId} onDailyCountChange={setDailyCount} />
      ) : null}
    </div>
  );
}

export default App;
