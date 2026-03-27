/* eslint-disable @typescript-eslint/no-explicit-any */

interface FetchOptions extends RequestInit {
  skipRefresh?: boolean; // Skip automatic refresh for specific requests
}

interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T | null;
}

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

/**
 * Refresh the access token using the refresh token
 */
async function refreshAccessToken(): Promise<boolean> {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh-token`,
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    const data: ApiResponse = await response.json();

    if (response.ok && data.success) {
      return true;
    }

    return false;
  } catch (error) {
    console.error("Token refresh failed:", error);
    return false;
  }
}

/**
 * Enhanced fetch wrapper with automatic token refresh
 * @param url - The URL to fetch
 * @param options - Fetch options with optional skipRefresh flag
 * @returns Promise with the response
 */
export async function apiFetch<T = any>(
  url: string,
  options: FetchOptions = {},
): Promise<Response> {
  const { skipRefresh, ...fetchOptions } = options;

  // Ensure credentials are included for cookie-based auth
  const defaultOptions: RequestInit = {
    credentials: "include",
    ...fetchOptions,
  };

  try {
    // Make the initial request
    let response = await fetch(url, defaultOptions);

    if (response.status === 401 && !skipRefresh) {
      if (isRefreshing && refreshPromise) {
        const refreshSuccess = await refreshPromise;
        if (refreshSuccess) {
          response = await fetch(url, defaultOptions);
        }
      } else {
        // Start a new refresh
        isRefreshing = true;
        refreshPromise = refreshAccessToken();

        const refreshSuccess = await refreshPromise;
        isRefreshing = false;
        refreshPromise = null;

        if (refreshSuccess) {
          // Retry the original request with the new token
          response = await fetch(url, defaultOptions);
        } else {
          if (typeof window !== "undefined") {
            window.location.href = "/login";
          }
        }
      }
    }

    return response;
  } catch (error) {
    console.error("API fetch error:", error);
    throw error;
  }
}

/**
 * Convenience method for JSON responses
 */
export async function apiFetchJson<T = any>(
  url: string,
  options: FetchOptions = {},
): Promise<ApiResponse<T>> {
  const response = await apiFetch(url, options);
  const data: ApiResponse<T> = await response.json();
  return data;
}

/**
 * Helper methods for common HTTP methods
 */
export const api = {
  get: <T = any>(url: string, options?: FetchOptions) =>
    apiFetchJson<T>(url, { ...options, method: "GET" }),

  post: <T = any>(url: string, body?: any, options?: FetchOptions) =>
    apiFetchJson<T>(url, {
      ...options,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    }),

  put: <T = any>(url: string, body?: any, options?: FetchOptions) =>
    apiFetchJson<T>(url, {
      ...options,
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: <T = any>(url: string, options?: FetchOptions) =>
    apiFetchJson<T>(url, { ...options, method: "DELETE" }),
};

