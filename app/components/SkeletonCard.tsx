'use client';

import React from 'react';

export default function SkeletonCard() {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-4 animate-pulse">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/4"></div>
          </div>
          <div className="flex items-center space-x-2 ml-4">
            <div className="h-6 bg-gray-200 rounded w-16"></div>
            <div className="h-6 bg-gray-200 rounded w-12"></div>
          </div>
        </div>
      </div>

      {/* Chart Area */}
      <div className="mb-4">
        <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-black mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-32 mx-auto mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-24 mx-auto"></div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-center">
        <div className="h-3 bg-gray-200 rounded w-20"></div>
      </div>
    </div>
  );
}
