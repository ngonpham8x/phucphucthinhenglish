// Browser dates follow the user's local calendar, rather than UTC's day.
export const localISODate = (date: Date = new Date()): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

export const reportWeekBounds = (isoDate: string): [string, string] => {
  const start = new Date(`${isoDate}T12:00:00`);
  start.setDate(start.getDate() - (start.getDay() + 6) % 7);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return [localISODate(start), localISODate(end)];
};
