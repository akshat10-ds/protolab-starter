export type DateFormat = 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';
export type DateRange = [Date | null, Date | null];
export const dayValue = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
export const sameDay = (left: Date | null | undefined, right: Date) => !!left && dayValue(left) === dayValue(right);
export function formatDate(date: Date | null | undefined, format: DateFormat): string {
  if (!date || Number.isNaN(date.getTime())) return '';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = String(date.getFullYear()).padStart(4, '0');
  return format === 'DD/MM/YYYY' ? `${day}/${month}/${year}` : format === 'YYYY-MM-DD' ? `${year}-${month}-${day}` : `${month}/${day}/${year}`;
}
export function parseDate(text: string, format: DateFormat): Date | null {
  const match = format === 'YYYY-MM-DD' ? /^(\d{4})-(\d{2})-(\d{2})$/.exec(text) : /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(text);
  if (!match) return null;
  const year = Number(match[format === 'YYYY-MM-DD' ? 1 : 3]);
  const month = Number(match[format === 'YYYY-MM-DD' ? 2 : format === 'DD/MM/YYYY' ? 2 : 1]);
  const day = Number(match[format === 'YYYY-MM-DD' ? 3 : format === 'DD/MM/YYYY' ? 1 : 2]);
  const result = new Date(0); result.setHours(0, 0, 0, 0); result.setFullYear(year, month - 1, day);
  return result.getFullYear() === year && result.getMonth() === month - 1 && result.getDate() === day ? result : null;
}
export const addDays = (date: Date, amount: number) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount);
export function addMonths(date: Date, amount: number): Date {
  const first = new Date(date.getFullYear(), date.getMonth() + amount, 1);
  return new Date(first.getFullYear(), first.getMonth(), Math.min(date.getDate(), new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate()));
}
export function inDateBounds(date: Date, min?: Date, max?: Date) { return (!min || dayValue(date) >= dayValue(min)) && (!max || dayValue(date) <= dayValue(max)); }
export function nextRange(range: DateRange, date: Date): DateRange {
  if (!range[0] || range[1]) return [date, null];
  return dayValue(date) < dayValue(range[0]) ? [date, range[0]] : [range[0], date];
}
