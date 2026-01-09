import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL;
if (!baseURL) {
  throw new Error("Missing VITE_API_URL. Set it in your environment (Vercel) or frontend/.env (local).");
}

export const api = axios.create({ baseURL });

export function setAuthToken(token) {
  if (!token) {
    delete api.defaults.headers.common.Authorization;
    return;
  }
  api.defaults.headers.common.Authorization = `Bearer ${token}`;
}


