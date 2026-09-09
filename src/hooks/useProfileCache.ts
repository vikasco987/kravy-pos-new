import { useState, useEffect } from "react";

let globalProfileCache: any = null;
let profileFetchPromise: Promise<any> | null = null;
let lastFetchTime: number = 0;
const STALE_TIME = 60 * 1000; // 60 seconds

export function useProfileCache() {
  const [profile, setProfile] = useState<any>(globalProfileCache);
  const [loading, setLoading] = useState(!globalProfileCache);

  useEffect(() => {
    // 1. If we have cached data, return it instantly
    if (globalProfileCache) {
      setProfile(globalProfileCache);
      setLoading(false);

      // 2. Check if the cache is stale (older than 60 seconds)
      if (Date.now() - lastFetchTime > STALE_TIME) {
        fetchProfileSilently();
      }
      return;
    }

    // 3. Request Deduplication: If already fetching, attach to the promise
    if (!profileFetchPromise) {
      profileFetchPromise = fetch("/api/profile")
        .then(res => res.json())
        .then(data => {
          globalProfileCache = data;
          lastFetchTime = Date.now();
          return data;
        })
        .finally(() => {
          profileFetchPromise = null;
        });
    }

    profileFetchPromise.then(data => {
      setProfile(data);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  const fetchProfileSilently = async () => {
    // Avoid concurrent background fetches
    if (profileFetchPromise) return;

    try {
      profileFetchPromise = fetch("/api/profile").then(res => res.json());
      const data = await profileFetchPromise;
      globalProfileCache = data;
      lastFetchTime = Date.now();
      setProfile(data);
    } catch(e) {
      console.error("Silent background fetch failed:", e);
    } finally {
      profileFetchPromise = null;
    }
  };

  const updateProfile = (newProfile: any) => {
    // Optimistic update of global cache & local state
    globalProfileCache = { ...globalProfileCache, ...newProfile };
    lastFetchTime = Date.now(); // Reset stale timer since we just updated it
    setProfile(globalProfileCache);
  };

  return { profile, loading, updateProfile };
}
