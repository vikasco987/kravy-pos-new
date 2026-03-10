import React from "react";

export default function Loading() {
    return (
        <div className="p-6 space-y-6 animate-pulse">
            {/* Header Skeleton */}
            <div className="flex justify-between items-center mb-8">
                <div className="space-y-2">
                    <div className="h-8 w-64 bg-gray-200 dark:bg-gray-800 rounded-lg"></div>
                    <div className="h-4 w-48 bg-gray-100 dark:bg-gray-900 rounded-md"></div>
                </div>
                <div className="h-12 w-32 bg-gray-200 dark:bg-gray-800 rounded-xl"></div>
            </div>

            {/* Stats Grid Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-32 bg-gray-100 dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800"></div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Chart Skeleton */}
                <div className="lg:col-span-2 h-[400px] bg-gray-100 dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800"></div>

                {/* Side Panel Skeleton */}
                <div className="h-[400px] bg-gray-100 dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800"></div>
            </div>

            {/* Table Skeleton */}
            <div className="h-64 bg-gray-100 dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800"></div>
        </div>
    );
}
