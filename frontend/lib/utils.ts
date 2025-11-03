import { format, formatDistance, formatRelative } from 'date-fns';
import { clsx, type ClassValue } from 'clsx';

/**
 * Merge class names
 */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

/**
 * Format date to readable string
 */
export function formatDate(date: string | Date, formatStr: string = 'MMM dd, yyyy') {
  return format(new Date(date), formatStr);
}

/**
 * Format date to relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: string | Date) {
  return formatDistance(new Date(date), new Date(), { addSuffix: true });
}

/**
 * Format date to relative description (e.g., "yesterday at 3:20 PM")
 */
export function formatRelativeDate(date: string | Date) {
  return formatRelative(new Date(date), new Date());
}

/**
 * Get status badge class
 */
export function getStatusBadgeClass(status: string): string {
  const statusMap: Record<string, string> = {
    invited: 'badge-info',
    started: 'badge-warning',
    submitted: 'badge-success',
    expired: 'badge-error',
  };
  return statusMap[status] || 'badge-neutral';
}

/**
 * Get status display text
 */
export function getStatusText(status: string): string {
  const statusMap: Record<string, string> = {
    invited: 'Invited',
    started: 'In Progress',
    submitted: 'Submitted',
    expired: 'Expired',
  };
  return statusMap[status] || status;
}

/**
 * Calculate time remaining
 */
export function getTimeRemaining(deadline: string): string {
  const now = new Date();
  const deadlineDate = new Date(deadline);
  const diff = deadlineDate.getTime() - now.getTime();
  
  if (diff < 0) {
    return 'Expired';
  }
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h remaining`;
  }
  
  return `${hours}h ${minutes}m remaining`;
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, length: number = 100): string {
  if (text.length <= length) return text;
  return text.substring(0, length) + '...';
}

