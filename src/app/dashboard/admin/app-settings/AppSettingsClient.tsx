"use client";

import { useState, useEffect } from "react";
import { Save, Smartphone, Loader2, AlertCircle } from "lucide-react";

export default function AppSettingsClient() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  
  const [formData, setFormData] = useState({
    appLatestVersion: "1.0.0",
    appMinRequiredVersion: "1.0.0",
    appUpdateUrl: "",
    appReleaseNotes: ""
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/admin/app-settings");
      if (res.ok) {
        const data = await res.json();
        setFormData({
          appLatestVersion: data.appLatestVersion || "1.0.0",
          appMinRequiredVersion: data.appMinRequiredVersion || "1.0.0",
          appUpdateUrl: data.appUpdateUrl || "",
          appReleaseNotes: data.appReleaseNotes || ""
        });
      }
    } catch (error) {
      console.error("Error fetching settings", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/admin/app-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setMessage("App settings updated successfully!");
        setTimeout(() => setMessage(""), 3000);
      } else {
        setMessage("Failed to save settings.");
      }
    } catch (error) {
      console.error("Error saving settings", error);
      setMessage("An error occurred.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Smartphone className="w-6 h-6 text-blue-600" />
            App Update Settings
          </h1>
          <p className="text-gray-500 mt-1">Manage the version requirements and play store link for your mobile app.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 space-y-6">
        
        {message && (
          <div className={`p-4 rounded-lg flex items-center gap-3 ${message.includes("success") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
            <AlertCircle className="w-5 h-5" />
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Latest App Version</label>
            <input 
              type="text" 
              name="appLatestVersion"
              value={formData.appLatestVersion} 
              onChange={handleChange}
              placeholder="e.g. 1.0.5"
              className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
            />
            <p className="text-xs text-gray-500">The most recent version available on the store.</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Minimum Required Version</label>
            <input 
              type="text" 
              name="appMinRequiredVersion"
              value={formData.appMinRequiredVersion} 
              onChange={handleChange}
              placeholder="e.g. 1.0.0"
              className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
            />
            <p className="text-xs text-gray-500">Users below this version will be forced to update.</p>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">App Store / Play Store URL</label>
          <input 
            type="url" 
            name="appUpdateUrl"
            value={formData.appUpdateUrl} 
            onChange={handleChange}
            placeholder="https://play.google.com/..."
            className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Release Notes (Optional)</label>
          <textarea 
            name="appReleaseNotes"
            value={formData.appReleaseNotes} 
            onChange={handleChange}
            placeholder="What's new in this update?"
            rows={4}
            className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none resize-none"
          />
        </div>

        <div className="pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-end">
          <button 
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-all shadow-sm disabled:opacity-70"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </div>
    </div>
  );
}
