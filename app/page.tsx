'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import ResultCard from './components/ResultCard';
import SkeletonCard from './components/SkeletonCard';
import TypewriterEffect from './components/TypewriterEffect';
import SchemaInvestigationLoader from './components/SchemaInvestigationLoader';
import { saveResultCard, getResultCards, clearResultCards, ResultCard as ResultCardType } from '@/app/lib/localStorage';
import { SuccessResponse, ErrorResponse, SchemaInvestigationResult } from '@/server/validator';

export default function Home() {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<ResultCardType[]>([]);
  const [showSkeletonCard, setShowSkeletonCard] = useState(false);
  
  // Schema investigation state
  const [isInvestigating, setIsInvestigating] = useState(true);
  const [investigationStep, setInvestigationStep] = useState(1);
  const [investigationResult, setInvestigationResult] = useState<SchemaInvestigationResult | null>(null);
  const [investigationError, setInvestigationError] = useState<string | null>(null);

  // Load saved results on mount
  useEffect(() => {
    const savedResults = getResultCards();
    setResults(savedResults);
  }, []);

  // Schema investigation effect
  useEffect(() => {
    let isMounted = true;
    
    const runSchemaInvestigation = async () => {
      try {
        setIsInvestigating(true);
        setInvestigationError(null);
        
        // Simulate progress steps for better UX
        const progressSteps = [
          { step: 1, delay: 500, activity: "Connecting to database" },
          { step: 2, delay: 1000, activity: "Exploring table structures" },
          { step: 3, delay: 1500, activity: "Sampling data patterns" },
          { step: 4, delay: 2000, activity: "Analyzing relationships" },
          { step: 5, delay: 2500, activity: "Generating example queries" },
        ];
        
        // Start progress simulation
        const progressPromise = (async () => {
          for (const { step, delay } of progressSteps) {
            await new Promise(resolve => setTimeout(resolve, delay));
            if (isMounted) {
              setInvestigationStep(step);
            }
          }
        })();
        
        // Start actual investigation
        const response = await fetch('/api/init');
        const data = await response.json();
        
        // Wait for progress simulation to complete
        await progressPromise;
        
        if (!isMounted) return;
        
        if (response.ok) {
          setInvestigationResult(data);
        } else {
          setInvestigationError(data.message || 'Schema investigation failed');
          // Use fallback data if available
          if (data.examplePrompts) {
            setInvestigationResult({
              summary: data.summary || 'Investigation failed',
              examplePrompts: data.examplePrompts,
              investigationSteps: data.investigationSteps || [],
            });
          }
        }
        
      } catch (error: any) {
        console.error('Schema investigation failed:', error);
        if (isMounted) {
          setInvestigationError(error.message || 'Failed to connect to server');
          // Provide fallback
          setInvestigationResult({
            summary: 'Schema investigation failed',
            examplePrompts: [
              "Show data structure",
              "List tables",
              "Sample query"
            ],
            investigationSteps: [],
          });
        }
      } finally {
        if (isMounted) {
          // Add a small delay before showing the main UI for smooth transition
          setTimeout(() => {
            if (isMounted) {
              setIsInvestigating(false);
            }
          }, 1000);
        }
      }
    };
    
    runSchemaInvestigation();
    
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!query.trim() || isLoading) {
      return;
    }

    setIsLoading(true);
    setShowSkeletonCard(true);

    try {
      const response = await fetch('/api/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: query.trim() }),
      });

      const data = await response.json();
      
      // Save result and update UI
      const resultCard = saveResultCard(data as SuccessResponse | ErrorResponse);
      setResults(prev => [resultCard, ...prev]);
      
      // Clear input on success
      if (response.ok) {
        setQuery('');
      }
      
    } catch (error) {
      console.error('Request failed:', error);
      
      // Create error result card
      const errorResult: ErrorResponse = {
        prompt: query,
        error: 'Network error: Failed to connect to server',
        tried: [],
      };
      
      const resultCard = saveResultCard(errorResult);
      setResults(prev => [resultCard, ...prev]);
      
    } finally {
      setIsLoading(false);
      setShowSkeletonCard(false);
    }
  };

  const handleClearResults = () => {
    clearResultCards();
    setResults([]);
  };

  // Use investigation results for typewriter sentences, with fallback
  const typewriterSentences = investigationResult?.examplePrompts || [
    "Daily email count",
    "Top countries", 
    "Monthly trends"
  ];

  // Show loading screen during schema investigation
  if (isInvestigating) {
    return (
      <SchemaInvestigationLoader 
        step={investigationStep}
        totalSteps={5}
        currentActivity={
          investigationStep === 1 ? "Connecting to database" :
          investigationStep === 2 ? "Exploring table structures" :
          investigationStep === 3 ? "Sampling data patterns" :
          investigationStep === 4 ? "Analyzing relationships" :
          "Generating example queries"
        }
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Centered Input Section */}
      <div className={`transition-all duration-700 ${results.length > 0 || showSkeletonCard ? 'pt-8 pb-4' : 'flex items-center justify-center min-h-screen'}`}>
        <div className="w-full max-w-2xl mx-auto px-4">
          {/* Title */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <Image
                src="/logo.svg"
                alt="Chartly"
                width={400}
                height={92}
                className="text-gray-900"
              />
            </div>
            <p className="text-gray-600">
              From data to information, in a single prompt
            </p>
            
            {/* Investigation Error Warning */}
            {investigationError && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <span className="font-medium">Note:</span> Schema analysis encountered an issue: {investigationError}
                </p>
              </div>
            )}
          </div>
          
          {/* Query Form */}
          <form onSubmit={handleSubmit} className="relative">
            <div className="relative">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder=""
                className="w-full px-8 py-5 pr-20 text-lg border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent shadow-lg bg-white transition-all duration-200 hover:shadow-xl"
                disabled={isLoading}
              />
              
              {/* Typewriter Effect Placeholder */}
              {!query && (
                <div className="absolute left-8 top-5 pointer-events-none">
                  <TypewriterEffect 
                    sentences={typewriterSentences}
                    typingSpeed={80}
                    deletingSpeed={40}
                    pauseDuration={1500}
                  />
                </div>
              )}
              
              {/* Submit Button */}
              <button
                type="submit"
                disabled={!query.trim() || isLoading}
                className="absolute right-3 top-3 bottom-3 px-5 bg-black hover:bg-gray-800 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors flex items-center space-x-2 shadow-md"
              >
                <Image
                  src="/send-arrow.svg"
                  alt="Send"
                  width={20}
                  height={20}
                />
              </button>
            </div>
          </form>
          
          {/* Clear Results Button */}
          {results.length > 0 && (
            <div className="text-center mt-4">
              <button
                type="button"
                onClick={handleClearResults}
                className="text-gray-600 hover:text-gray-800 font-medium py-2 px-4 rounded-lg transition-colors text-sm"
              >
                Clear Results ({results.length})
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Results Section */}
      {(results.length > 0 || showSkeletonCard) && (
        <div className="max-w-4xl mx-auto px-4 pb-8">
          <div className="space-y-6">
            {/* Skeleton Card */}
            {showSkeletonCard && <SkeletonCard />}
            
            {/* Actual Results */}
            {results.map((result) => (
              <ResultCard key={result.id} result={result} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
