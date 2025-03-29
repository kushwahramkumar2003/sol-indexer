import axios from "axios";
import { getToken } from "@/lib/localStorage";

const apiConfig = {
  baseURL: "http://localhost:8081/api/v1",
  withCredentials: true,
  headers: {},
};

if (typeof window !== "undefined") {
  apiConfig.headers = {
    ...apiConfig.headers,
    token: getToken(),
  };
}

export const api = axios.create(apiConfig);

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    config.headers.token = getToken();
  }
  return config;
});
