import axios from "axios";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || "http://localhost:8000",
});

export async function fetchTokenUsage() {
  try {
    const response = await apiClient.get("/usage");
    return response.data;
  } catch {
    return {
      token_percentage: 0,
      tokens_today: 0,
      token_budget: 500000,
    };
  }
}

export function getChatIndex() {
  return JSON.parse(localStorage.getItem("paperpilot_chat_index") || "[]");
}

export function saveChatIndex(paperId, messages, fileName) {
  const index = getChatIndex();
  const userMessages = messages.filter((m) => m.role === "user");
  const entry = {
    paperId,
    fileName: fileName || paperId,
    lastQuestion:
      userMessages[userMessages.length - 1]?.content || "No questions yet",
    messageCount: messages.length,
    savedAt: new Date().toISOString(),
  };

  const existing = index.findIndex(
    (i) =>
      i.fileName &&
      fileName &&
      i.fileName.toLowerCase() === fileName.toLowerCase(),
  );

  if (existing >= 0) {
    const oldPaperId = index[existing].paperId;
    if (oldPaperId !== paperId) {
      const oldMessages = localStorage.getItem(`chat_${oldPaperId}`);
      if (oldMessages) {
        localStorage.setItem(`chat_${paperId}`, oldMessages);
      }
    }

    index[existing] = {
      ...index[existing],
      paperId,
      lastQuestion: entry.lastQuestion,
      messageCount: entry.messageCount,
      savedAt: entry.savedAt,
      fileName: entry.fileName,
    };
  } else {
    index.unshift(entry);
  }

  const sorted = index.sort(
    (a, b) => new Date(b.savedAt) - new Date(a.savedAt),
  );

  localStorage.setItem(
    "paperpilot_chat_index",
    JSON.stringify(sorted.slice(0, 10)),
  );
}

export function getChatHistory(paperId) {
  return JSON.parse(localStorage.getItem(`chat_${paperId}`) || "[]");
}

export function deleteChatHistory(paperId) {
  localStorage.removeItem(`chat_${paperId}`);
  const index = getChatIndex().filter((i) => i.paperId !== paperId);
  localStorage.setItem("paperpilot_chat_index", JSON.stringify(index));
}

export async function checkPaperExists(paperId) {
  try {
    await apiClient.post("/query/", {
      paper_id: paperId,
      question: "__health_check__",
    });
    return true;
  } catch (error) {
    if (error?.response?.status === 404) {
      return false;
    }
    return true;
  }
}

const getErrorDetail = (error) => {
  if (error?.response?.status === 429) {
    return "DAILY_LIMIT_REACHED";
  }

  const detail = error?.response?.data?.detail;
  if (typeof detail === "string" && detail.trim()) {
    return detail;
  }

  return "Something went wrong. Please try again.";
};

export const uploadPaper = async (file) => {
  try {
    const formData = new FormData();
    formData.append("pdf", file);

    const response = await apiClient.post("/upload/", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return {
      paper_id: response.data.paper_id,
      chunk_count: response.data.chunk_count,
    };
  } catch (error) {
    throw new Error(getErrorDetail(error));
  }
};

export const queryPaper = async (paper_id, question) => {
  try {
    const response = await apiClient.post("/query/", {
      paper_id,
      question,
    });

    window.dispatchEvent(new CustomEvent("tokenUsageUpdated"));

    return response.data;
  } catch (error) {
    throw new Error(getErrorDetail(error));
  }
};

export default apiClient;
