'use client';

import React, { useState, useEffect } from 'react';

interface TypewriterEffectProps {
  sentences: string[];
  typingSpeed?: number;
  deletingSpeed?: number;
  pauseDuration?: number;
}

export default function TypewriterEffect({ 
  sentences, 
  typingSpeed = 300, 
  deletingSpeed = 600, 
  pauseDuration = 2000 
}: TypewriterEffectProps) {
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const [currentText, setCurrentText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const currentSentence = sentences[currentSentenceIndex];
    
    if (isPaused) {
      const pauseTimer = setTimeout(() => {
        setIsPaused(false);
        setIsDeleting(true);
      }, pauseDuration);
      return () => clearTimeout(pauseTimer);
    }

    const timer = setTimeout(() => {
      if (!isDeleting) {
        // Typing
        if (currentText.length < currentSentence.length) {
          setCurrentText(currentSentence.slice(0, currentText.length + 1));
        } else {
          // Finished typing, pause before deleting
          setIsPaused(true);
        }
      } else {
        // Deleting
        if (currentText.length > 0) {
          setCurrentText(currentText.slice(0, -1));
        } else {
          // Finished deleting, move to next sentence
          setIsDeleting(false);
          setCurrentSentenceIndex((prev) => (prev + 1) % sentences.length);
        }
      }
    }, isDeleting ? deletingSpeed : typingSpeed);

    return () => clearTimeout(timer);
  }, [currentText, isDeleting, isPaused, currentSentenceIndex, sentences, typingSpeed, deletingSpeed, pauseDuration]);

  return (
    <span className="text-gray-500">
      {currentText}
      <span className="animate-pulse">|</span>
    </span>
  );
}
