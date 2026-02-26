"use client";

import { useLoading } from "@/contexts/LoadingContext";

export const useApi = () => {
  const { startLoading, stopLoading } = useLoading();
  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  const apiFetch = async <T = any>(
    url: string,
    options: RequestInit = {},
  ): Promise<T> => {
    // Get token from localStorage
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;

    // Add base URL if not already present
    const fullUrl = url.startsWith("http") ? url : `${API_BASE_URL}${url}`;

    // Add Authorization header if token exists
    const headers = {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    startLoading();

    try {
      const response = await fetch(fullUrl, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || `HTTP error! status: ${response.status}`,
        );
      }

      return data;
    } catch (error) {
      throw error;
    } finally {
      stopLoading();
    }
  };

  const get = <T = any>(url: string, options?: RequestInit): Promise<T> => {
    return apiFetch<T>(url, { ...options, method: "GET" });
  };

  const post = <T = any>(
    url: string,
    body?: any,
    options?: RequestInit,
  ): Promise<T> => {
    return apiFetch<T>(url, {
      ...options,
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    });
  };

  const put = <T = any>(
    url: string,
    body?: any,
    options?: RequestInit,
  ): Promise<T> => {
    return apiFetch<T>(url, {
      ...options,
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    });
  };

  const del = <T = any>(url: string, options?: RequestInit): Promise<T> => {
    return apiFetch<T>(url, { ...options, method: "DELETE" });
  };

  return { get, post, put, delete: del, fetch: apiFetch };
};
