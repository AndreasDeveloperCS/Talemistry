export function transformChatDate(dateInput?: string | Date | null): string {
  if (!dateInput) return '';

  const date = new Date(dateInput);
  const now = new Date();

  const sameDay =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (sameDay) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);

  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  if (isYesterday) {
    return 'Yes';
  }

  // start of current week (Monday)
  const startOfWeek = new Date(now);
  const day = now.getDay() === 0 ? 7 : now.getDay();
  startOfWeek.setDate(now.getDate() - day + 1);
  startOfWeek.setHours(0, 0, 0, 0);

  const isCurrentWeek = date >= startOfWeek;

  if (isCurrentWeek) {
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  }

  const isCurrentYear = date.getFullYear() === now.getFullYear();

  if (isCurrentYear) {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  }

  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();

  return `${d}.${m}.${y}`;
}