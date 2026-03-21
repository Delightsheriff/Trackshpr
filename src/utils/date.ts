/**
 * Date utilities using date-fns.
 */
import { formatDistanceToNow, format, parseISO } from "date-fns";

export function formatOrderTime(dateString: string): string {
  try {
    const date = parseISO(dateString);
    return formatDistanceToNow(date, { addSuffix: true });
  } catch {
    return dateString;
  }
}

export function formatDate(dateString: string, pattern = "MMM d, yyyy"): string {
  try {
    const date = parseISO(dateString);
    return format(date, pattern);
  } catch {
    return dateString;
  }
}

export function formatTime(dateString: string): string {
  try {
    const date = parseISO(dateString);
    return format(date, "h:mm a");
  } catch {
    return dateString;
  }
}
