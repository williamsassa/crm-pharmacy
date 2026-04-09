import { clsx, type ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `+33${cleaned.slice(1)}`;
  }
  if (cleaned.startsWith('33') && cleaned.length === 11) {
    return `+${cleaned}`;
  }
  if (cleaned.startsWith('+')) {
    return cleaned;
  }
  return `+${cleaned}`;
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function formatDateTime(date: string): string {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function daysSince(date: string): number {
  return Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
}

export function getSegmentColor(segment: string | null): string {
  switch (segment) {
    case 'Chronique':
      return 'bg-blue-100 text-blue-800';
    case 'Risque':
      return 'bg-red-100 text-red-800';
    case 'Suivi régulier':
      return 'bg-green-100 text-green-800';
    case 'Occasionnel':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-600';
  }
}

export function getTagColor(tag: string): { bg: string; text: string } {
  switch (tag) {
    case 'Chronique':
      return { bg: '#2D6A4F', text: '#FFFFFF' };
    case 'Aigu':
      return { bg: '#E76F51', text: '#FFFFFF' };
    case 'Suivi':
      return { bg: '#1B4F72', text: '#FFFFFF' };
    default:
      return { bg: '#6C757D', text: '#FFFFFF' };
  }
}

export function generateId(): string {
  return crypto.randomUUID();
}
