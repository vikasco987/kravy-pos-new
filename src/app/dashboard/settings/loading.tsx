import React from "react";

export default function Loading() {
    return (
        <div className="p-6 space-y-6 animate-pulse">
            <div className="h-8 w-64 bg-gray-200 dark:bg-gray-800 rounded-lg mb-8"></div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-40 bg-gray-100 dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
                        <div className="h-6 w-32 bg-gray-200 dark:bg-gray-800 rounded mb-4"></div>
                        <div className="h-4 w-full bg-gray-100 dark:bg-gray-900 rounded"></div>
                    </div>
                ))}
            </div>
        </div>
    );
}
