import axios from "axios";

// Use environment variable for API URL, fallback to localhost
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor - add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle expired/invalid token
    if (error.response?.status === 401) {
      const currentPath = window.location.pathname;

      // Don't redirect if already on login page
      if (currentPath !== "/") {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/?expired=true";
      }
    }

    // Handle rate limiting
    if (error.response?.status === 429) {
      console.error("Rate limited. Please wait before retrying.");
    }

    return Promise.reject(error);
  },
);

// Helper to get error message
export const getErrorMessage = (error) => {
  if (error.response?.data?.msg) {
    return error.response.data.msg;
  }
  if (error.response?.data?.errors) {
    return error.response.data.errors.map((e) => e.message).join(", ");
  }
  if (error.message === "Network Error") {
    return "Unable to connect to server";
  }
  return "Something went wrong";
};

export default api;
