import React from "react";

export default function Loading() {
    return (
        <div className="p-6 space-y-6 animate-pulse">
            <div className="h-8 w-48 bg-gray-200 dark:bg-gray-800 rounded-lg mb-8"></div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-64 bg-gray-100 dark:bg-gray-900 rounded-[32px] border border-gray-200 dark:border-gray-800"></div>
                ))}
            </div>
        </div>
    );
}
