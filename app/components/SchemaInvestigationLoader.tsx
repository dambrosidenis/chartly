'use client';

import React from 'react';
import Image from 'next/image';

interface SchemaInvestigationLoaderProps {
  step?: number;
  totalSteps?: number;
  currentActivity?: string;
}

export default function SchemaInvestigationLoader({ 
  step = 1, 
  totalSteps = 5, 
  currentActivity = "Analyzing your data model" 
}: SchemaInvestigationLoaderProps) {
  const progress = totalSteps > 0 ? (step / totalSteps) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
      <div className="max-w-md w-full mx-auto px-4">
        <div className="text-center">
          {/* Logo/Title */}
          <div className="mb-8">
            <div className="flex justify-center mb-4">
              <Image
                src="/logo.svg"
                alt="Chartly"
                width={120}
                height={40}
                className="h-10 w-auto"
              />
            </div>
            <p className="text-gray-600">
              Preparing your data analysis experience
            </p>
          </div>

          {/* Loading Animation */}
          <div className="mb-8">
            <div className="relative w-20 h-20 mx-auto mb-4">
              {/* Outer spinning ring */}
              <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-transparent border-t-black rounded-full animate-spin"></div>
              
              {/* Inner pulsing dot */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-3 h-3 bg-black rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>

          {/* Progress Information */}
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                {currentActivity}
              </h2>
              <p className="text-gray-600 text-sm">
                Please wait while we explore your database structure and prepare intelligent examples...
              </p>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-black h-2 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              ></div>
            </div>

            {/* Step Counter */}
            <div className="text-sm text-gray-500">
              Step {step} of {totalSteps}
            </div>

            {/* Activity List */}
            <div className="mt-6 text-left bg-white rounded-lg p-4 shadow-sm">
              <div className="space-y-2 text-sm">
                <div className={`flex items-center ${step >= 1 ? 'text-green-600' : 'text-gray-400'}`}>
                  <div className={`w-2 h-2 rounded-full mr-3 ${step >= 1 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  Connecting to database
                </div>
                <div className={`flex items-center ${step >= 2 ? 'text-green-600' : step === 1 ? 'text-black' : 'text-gray-400'}`}>
                  <div className={`w-2 h-2 rounded-full mr-3 ${step >= 2 ? 'bg-green-500' : step === 1 ? 'bg-black animate-pulse' : 'bg-gray-300'}`}></div>
                  Exploring table structures
                </div>
                <div className={`flex items-center ${step >= 3 ? 'text-green-600' : step === 2 ? 'text-black' : 'text-gray-400'}`}>
                  <div className={`w-2 h-2 rounded-full mr-3 ${step >= 3 ? 'bg-green-500' : step === 2 ? 'bg-black animate-pulse' : 'bg-gray-300'}`}></div>
                  Sampling data patterns
                </div>
                <div className={`flex items-center ${step >= 4 ? 'text-green-600' : step === 3 ? 'text-black' : 'text-gray-400'}`}>
                  <div className={`w-2 h-2 rounded-full mr-3 ${step >= 4 ? 'bg-green-500' : step === 3 ? 'bg-black animate-pulse' : 'bg-gray-300'}`}></div>
                  Analyzing relationships
                </div>
                <div className={`flex items-center ${step >= 5 ? 'text-green-600' : step === 4 ? 'text-black' : 'text-gray-400'}`}>
                  <div className={`w-2 h-2 rounded-full mr-3 ${step >= 5 ? 'bg-green-500' : step === 4 ? 'bg-black animate-pulse' : 'bg-gray-300'}`}></div>
                  Generating example queries
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
