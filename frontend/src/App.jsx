import { useState } from "react";

import UploadPaper from "./components/UploadPaper";
import ChatInterface from "./components/ChatInterface";

function App() {
  const [paperId, setPaperId] = useState(null);

  if (!paperId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 text-slate-800">
        <UploadPaper onUploadSuccess={setPaperId} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <ChatInterface paperId={paperId} />
    </div>
  );
}

export default App;
