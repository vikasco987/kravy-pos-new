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
          // If refresh fails, redirect to login screen
          if (window.location.pathname.startsWith('/dashboard') || window.location.pathname.startsWith('/staff')) {
             // We don't know exactly which type of user failed, but usually auth/custom is for admins and staff/login for staff.
             // We can just redirect to the root auth or staff auth. We will use /auth/custom as a safe default or window.location.reload()
             window.location.href = window.location.pathname.startsWith('/staff') ? '/staff/login?error=session_expired' : '/auth/custom?error=session_expired';
          }
        }
      }

      return response;
    };
    
  }, []);

  return null;
}
