import { format } from 'date-fns';

export function generateDefaultTitle(): string {
  const date = format(new Date(), 'yyyy-MM-dd');
  return `Untitled meeting – ${date}`;
}

export function generateId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 20; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function formatTimestamp(seconds: number): string {
  return format(new Date(seconds * 1000), 'MMM d, yyyy h:mm a');
}

export function truncate(str: string, max: number): string {
  if (str.length <= max) return str;
  return str.slice(0, max) + '...';
}

export function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number,
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

export function sizeInBytes(str: string): number {
  return new TextEncoder().encode(str).length;
}
