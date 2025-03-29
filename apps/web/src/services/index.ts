import axios from "axios";
import { getToken } from "@/lib/localStorage";
import { config } from "@/config";

const apiConfig = {
  baseURL: config.api.url,
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
