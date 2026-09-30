import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatHours(hours: number | undefined | null) {
  if (!hours) return '0h0mn';
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h}h${m}mn`;
}

export function formatCurrency(amount: number, currency: 'USD' | 'KHR', exchangeRate = 4000) {
  if (currency === 'USD') {
    const roundedUsd = Math.round(amount * 100) / 100;
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(roundedUsd);
  } else {
    // 1 USD = exchangeRate KHR
    const riel = Math.round((amount * exchangeRate) / 100) * 100;
    return new Intl.NumberFormat('km-KH', { style: 'currency', currency: 'KHR', maximumFractionDigits: 0 }).format(riel);
  }
}
