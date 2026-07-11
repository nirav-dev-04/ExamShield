import axios from "axios";
import type { AxiosInstance } from "axios";
import { mockApiClient } from "../mocks/mockAxios";

const liveClient = axios.create({
  baseURL: "/api",
  withCredentials: true,
});

liveClient.interceptors.request.use((config) => {
  const csrfToken = getCookie("XSRF-TOKEN");
  if (csrfToken && config.headers) {
    config.headers["X-XSRF-TOKEN"] = csrfToken;
  }
  return config;
});

liveClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Standard unauthorized catcher placeholder
    }
    return Promise.reject(error);
  }
);

function getCookie(name: string): string | null {
  const matches = document.cookie.match(new RegExp(
    "(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, "\\$1") + "=([^;]*)"
  ));
  return matches ? decodeURIComponent(matches[1]) : null;
}

// Toggle export between Mock API and real Axios API client
export const apiClient = (import.meta.env.VITE_USE_MOCK === "true" 
  ? (mockApiClient as unknown) 
  : liveClient) as AxiosInstance;
