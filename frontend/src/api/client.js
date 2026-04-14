import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach JWT token to every request automatically
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Normalize error responses — never let objects bubble up to UI
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    let message = "Something went wrong. Please try again.";

    if (error.response) {
      const data = error.response.data;

      if (typeof data.detail === "string") {
        message = data.detail;
      } else if (Array.isArray(data.detail)) {
        // FastAPI validation errors: [{loc, msg, type}, ...]
        message = data.detail
          .map((e) => {
            const field = e.loc?.slice(1).join(".") || "field";
            return `${field}: ${e.msg}`;
          })
          .join(" | ");
      } else if (typeof data.message === "string") {
        message = data.message;
      }
    } else if (error.request) {
      message = "Cannot reach the server. Check your connection.";
    }

    error.userMessage = message;
    return Promise.reject(error);
  }
);

export default apiClient;