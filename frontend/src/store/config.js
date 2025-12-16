const isBrowser = typeof window !== "undefined";

// Default base URL depends on environment:
// - If running on your Vercel domain, talk to the Render backend.
// - Otherwise (local dev), use localhost.
const defaultBaseUrl =
  import.meta.env.VITE_API_BASE_URL ||
  (isBrowser && window.location.hostname.endsWith("vercel.app")
    ? "https://food-delivery-website-1-rvlw.onrender.com"
    : "http://localhost:5000");

export const API_BASE_URL = defaultBaseUrl;
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || API_BASE_URL;
