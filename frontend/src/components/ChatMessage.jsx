function ChatMessage({ role, text }) {
  return (
    <div className="mb-3 rounded-md bg-slate-100 p-3">
      <p className="text-xs uppercase tracking-wide text-slate-500">{role}</p>
      <p>{text}</p>
    </div>
  );
}

export default ChatMessage;
