import axios from "axios";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || "http://localhost:8000",
});

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
    return response.data;
  } catch (error) {
    throw new Error(getErrorDetail(error));
  }
};

export default apiClient;
