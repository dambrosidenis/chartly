'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import ChartRenderer from './ChartRenderer';
import { ResultCard as ResultCardType } from '@/app/lib/localStorage';

interface ResultCardProps {
  result: ResultCardType;
}

export default function ResultCard({ result }: ResultCardProps) {
  const [showSQL, setShowSQL] = useState(false);
  const [showDebug, setShowDebug] = useState(false);

  const isError = 'error' in result;
  const timestamp = new Date(result.timestamp).toLocaleString();

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-4">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {isError ? 'Query Failed' : ('chartSpec' in result ? result.chartSpec.title : 'Result')}
            </h3>
            <p className="text-sm text-gray-600 mb-2">
              {result.prompt}
            </p>
            <p className="text-xs text-gray-400">
              {timestamp}
            </p>
          </div>
          <div className="flex items-center space-x-2 ml-4">
            {!isError && 'finalSql' in result && (
              <button
                onClick={() => setShowSQL(!showSQL)}
                className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded transition-colors"
              >
                {showSQL ? 'Hide SQL' : 'Show SQL'}
              </button>
            )}
            {result.tried && result.tried.length > 0 && (
              <button
                onClick={() => setShowDebug(!showDebug)}
                className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded transition-colors"
              >
                Debug ({result.tried.length})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Error Display */}
      {isError && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <Image
                src="/error-icon.svg"
                alt="Error"
                width={20}
                height={20}
                className="text-red-400"
              />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Query Failed
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{result.error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SQL Display */}
      {!isError && showSQL && 'finalSql' in result && (
        <div className="mb-4">
          <div className="bg-gray-50 rounded-md p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">SQL Query</h4>
            <pre className="text-sm text-gray-800 overflow-x-auto whitespace-pre-wrap">
              {result.finalSql}
            </pre>
          </div>
        </div>
      )}

      {/* Chart Display */}
      {!isError && 'chartSpec' in result && 'rows' in result && (
        <div className="mb-4">
          <ChartRenderer chartSpec={result.chartSpec} rows={result.rows} />
          {result.rows.length > 0 && (
            <p className="text-xs text-gray-500 mt-2 text-center">
              {result.rows.length} rows returned
            </p>
          )}
        </div>
      )}

      {/* Debug Information */}
      {showDebug && result.tried && result.tried.length > 0 && (
        <div className="mt-4 border-t pt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Debug Information</h4>
          <div className="space-y-3">
            {result.tried.map((attempt, index) => (
              <div key={index} className="bg-gray-50 rounded-md p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    Attempt {attempt.step}
                  </span>
                  <div className="flex items-center space-x-2">
                    {attempt.diagnostic && (
                      <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                        Diagnostic
                      </span>
                    )}
                    {attempt.error && (
                      <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                        Error
                      </span>
                    )}
                  </div>
                </div>
                
                {attempt.sql && (
                  <div className="mb-2">
                    <p className="text-xs text-gray-600 mb-1">SQL:</p>
                    <pre className="text-xs text-gray-800 bg-white p-2 rounded border overflow-x-auto">
                      {attempt.sql}
                    </pre>
                  </div>
                )}
                
                {attempt.error && (
                  <div className="mb-2">
                    <p className="text-xs text-gray-600 mb-1">Error:</p>
                    <p className="text-xs text-red-600 bg-red-50 p-2 rounded border">
                      {attempt.error}
                    </p>
                  </div>
                )}
                
                {attempt.sampleMeta && (
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Diagnostic Data:</p>
                    <pre className="text-xs text-gray-700 bg-white p-2 rounded border overflow-x-auto">
                      {JSON.stringify(attempt.sampleMeta, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
