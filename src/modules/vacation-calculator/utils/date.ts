const dayMs = 24 * 60 * 60 * 1000;

export function parseLocalDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function toIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function addDays(value: string, days: number) {
  const date = parseLocalDate(value);
  date.setDate(date.getDate() + days);
  return toIsoDate(date);
}

export function formatBrazilianDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR").format(parseLocalDate(value));
}

export function dateFromDay(referenceIsoDate: string, day: number) {
  const reference = parseLocalDate(referenceIsoDate);
  const monthLastDay = new Date(reference.getFullYear(), reference.getMonth() + 1, 0).getDate();
  const safeDay = Math.min(Math.max(day, 1), monthLastDay);
  return toIsoDate(new Date(reference.getFullYear(), reference.getMonth(), safeDay));
}

export function daysBetween(startIsoDate: string, endIsoDate: string) {
  return Math.round((parseLocalDate(endIsoDate).getTime() - parseLocalDate(startIsoDate).getTime()) / dayMs);
}

