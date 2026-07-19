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

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

liveClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      const url = originalRequest.url || "";
      if (!url.includes("/auth/me") && !url.includes("/auth/login") && !url.includes("/auth/refresh") && !url.includes("/auth/register")) {
        if (isRefreshing) {
          return new Promise(function(resolve, reject) {
            failedQueue.push({ resolve, reject });
          }).then(() => {
            return liveClient(originalRequest);
          }).catch(err => {
            return Promise.reject(err);
          });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          await liveClient.post("/auth/refresh");
          isRefreshing = false;
          processQueue(null);
          return liveClient(originalRequest);
        } catch (refreshError) {
          isRefreshing = false;
          processQueue(refreshError);
          if (window.location.pathname !== "/") {
            window.location.href = "/";
          }
          return Promise.reject(refreshError);
        }
      }
    }

    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      const url = originalRequest?.url || "";
      if (!url.includes("/auth/me") && !url.includes("/auth/login") && !url.includes("/auth/refresh")) {
        if (window.location.pathname !== "/") {
          window.location.href = "/";
        }
      }
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
