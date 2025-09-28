import { SuccessResponse, ErrorResponse } from '@/server/validator';

export type ResultCard = (SuccessResponse | ErrorResponse) & {
  id: string;
  timestamp: number;
};

const STORAGE_KEY = 'chartly-results';

export function saveResultCard(result: SuccessResponse | ErrorResponse): ResultCard {
  const card: ResultCard = {
    ...result,
    id: generateId(),
    timestamp: Date.now(),
  };
  
  try {
    const existing = getResultCards();
    const updated = [card, ...existing].slice(0, 50); // Keep only last 50 results
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to save result card:', error);
  }
  
  return card;
}

export function getResultCards(): ResultCard[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Failed to load result cards:', error);
    return [];
  }
}

export function clearResultCards(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear result cards:', error);
  }
}

function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}
