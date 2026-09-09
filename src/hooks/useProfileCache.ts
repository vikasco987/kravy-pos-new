import { useState, useEffect } from "react";

let globalProfileCache: any = null;
let profileFetchPromise: Promise<any> | null = null;

export function useProfileCache() {
  const [profile, setProfile] = useState<any>(globalProfileCache);
  const [loading, setLoading] = useState(!globalProfileCache);

  useEffect(() => {
    if (globalProfileCache) {
      setProfile(globalProfileCache);
      setLoading(false);
      // Still fetch in background silently to keep it fresh
      fetchProfileSilently();
      return;
    }

    if (!profileFetchPromise) {
      profileFetchPromise = fetch("/api/profile")
        .then(res => res.json())
        .then(data => {
          globalProfileCache = data;
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
    try {
      const res = await fetch("/api/profile");
      const data = await res.json();
      globalProfileCache = data;
      setProfile(data);
    } catch(e) {}
  };

  const updateProfile = (newProfile: any) => {
    globalProfileCache = { ...globalProfileCache, ...newProfile };
    setProfile(globalProfileCache);
  };

  return { profile, loading, updateProfile };
}
