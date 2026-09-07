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
      
      // Do not intercept the refresh token endpoints to avoid infinite loops
      if (typeof resource === 'string' && (resource.includes('/api/staff/refresh-token') || resource.includes('/api/auth/refresh-token'))) {
        return originalFetch(...args);
      }

      let response = await originalFetch(...args);

      // If unauthorized, attempt to refresh the token
      if (response.status === 401) {
        // If a refresh is already in progress, wait for it
        if (!refreshPromise) {
          refreshPromise = originalFetch('/api/auth/refresh-token', { method: 'POST' })
            .then(async (res) => {
              if (res.ok) return true;
              // If custom auth refresh fails, try staff refresh
              const staffRes = await originalFetch('/api/staff/refresh-token', { method: 'POST' });
              return staffRes.ok;
            })
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
          // If refresh fails, call logout to clear stale cookies then redirect to login screen
          if (window.location.pathname.startsWith('/dashboard') || window.location.pathname.startsWith('/staff')) {
             try {
               await originalFetch('/api/auth/logout', { method: 'POST' });
             } catch (e) {
               console.error("Failed to clear session cookies", e);
             }
             window.location.href = window.location.pathname.startsWith('/staff') ? '/staff/login?error=session_expired' : '/auth/custom?error=session_expired';
          }
        }
      }

      return response;
    };
    
  }, []);

  return null;
}
