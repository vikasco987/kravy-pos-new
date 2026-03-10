import React from "react";

export default function Loading() {
    return (
        <div className="p-6 space-y-6 animate-pulse">
            {/* Header Skeleton */}
            <div className="flex justify-between items-center mb-8">
                <div className="space-y-2">
                    <div className="h-8 w-48 bg-gray-200 dark:bg-gray-800 rounded-lg"></div>
                    <div className="h-4 w-32 bg-gray-100 dark:bg-gray-900 rounded-md"></div>
                </div>
                <div className="h-10 w-28 bg-gray-200 dark:bg-gray-800 rounded-xl"></div>
            </div>

            {/* Action Bar Skeleton */}
            <div className="flex gap-4 mb-6">
                <div className="h-10 w-full max-w-sm bg-gray-100 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800"></div>
                <div className="h-10 w-24 bg-gray-100 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800"></div>
            </div>

            {/* Table Skeleton */}
            <div className="bg-white dark:bg-gray-900 rounded-[32px] border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
                <div className="h-14 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800 px-6"></div>
                {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-16 border-b border-gray-100 dark:border-gray-800 mx-6"></div>
                ))}
            </div>
        </div>
    );
}
