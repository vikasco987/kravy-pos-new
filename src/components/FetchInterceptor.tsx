"use client";

import { useEffect } from "react";

let isIntercepting = false;
let refreshPromise: Promise<boolean> | null = null;

export default function FetchInterceptor() {
  useEffect(() => {
    if (typeof window === "undefined" || isIntercepting) return;
    isIntercepting = true;

    const originalFetch = window.fetch;

    window.fetch = async (...args) => {
      const [resource] = args;
      
      // Do not intercept the refresh token endpoint itself to avoid infinite loops
      if (typeof resource === 'string' && resource.includes('/api/staff/refresh-token')) {
        return originalFetch(...args);
      }

      let response = await originalFetch(...args);

      // If unauthorized, attempt to refresh the token
      if (response.status === 401) {
        // If a refresh is already in progress, wait for it
        if (!refreshPromise) {
          refreshPromise = originalFetch('/api/staff/refresh-token', { method: 'POST' })
            .then(res => res.ok)
            .catch(() => false)
            .finally(() => {
              refreshPromise = null;
            });
        }

        const refreshSuccess = await refreshPromise;
        if (refreshSuccess) {
          // Retry the original request with the new access token (implicitly sent via cookie)
          response = await originalFetch(...args);
        } else {
          // If refresh fails, redirect to login screen
          if (window.location.pathname.startsWith('/dashboard') || window.location.pathname.startsWith('/staff')) {
             window.location.href = '/staff/login?error=session_expired';
          }
        }
      }

      return response;
    };
    
  }, []);

  return null;
}
