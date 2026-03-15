import UploadPaper from "./components/UploadPaper";
import ChatInterface from "./components/ChatInterface";
import SystemNotice from "./components/SystemNotice";

function App() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <main className="mx-auto max-w-4xl p-6 space-y-6">
        <h1 className="text-3xl font-bold">PaperPilot</h1>
        <SystemNotice />
        <UploadPaper />
        <ChatInterface />
      </main>
    </div>
  );
}

export default App;
