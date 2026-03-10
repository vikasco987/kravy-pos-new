import React from "react";

export default function Loading() {
    return (
        <div className="p-6 space-y-6 animate-pulse">
            <div className="flex justify-between items-center mb-8">
                <div className="space-y-2">
                    <div className="h-8 w-48 bg-gray-200 dark:bg-gray-800 rounded-lg"></div>
                    <div className="h-4 w-32 bg-gray-100 dark:bg-gray-900 rounded-md"></div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-24 bg-gray-100 dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800"></div>
                ))}
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-[32px] border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm h-96">
            </div>
        </div>
    );
}
