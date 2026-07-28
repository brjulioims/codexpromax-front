import { PERIOD_OPTIONS } from "./asignacionReferidos.constants";

export function toDateInputValue(date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function parseDateInputValue(value) {
  if (!value) return null;

  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function formatRangeDate(value) {
  const date = parseDateInputValue(value);
  if (!date) return "";

  return date.toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function getRangeButtonLabel(periodRange) {
  if (!periodRange?.start && !periodRange?.end) return "Seleccionar rango";

  if (periodRange?.start && periodRange?.end) {
    return `${formatRangeDate(periodRange.start)} - ${formatRangeDate(periodRange.end)}`;
  }

  return formatRangeDate(periodRange.start || periodRange.end);
}

export function addMonths(date, amount) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + amount);
  return next;
}

export function getMonthDays(date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const startWeekDay = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];

  for (let index = 0; index < startWeekDay; index += 1) {
    cells.push(null);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(new Date(year, month, day));
  }

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  return cells;
}

export function isSameDay(left, right) {
  if (!left || !right) return false;

  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

export function isDateWithinRange(date, start, end) {
  if (!date || !start || !end) return false;
  return date > start && date < end;
}

export function getPresetDateRange(presetValue = "month") {
  const now = new Date();
  const start = new Date(now);
  const end = new Date(now);

  if (presetValue === "today") {
    return { start: toDateInputValue(start), end: toDateInputValue(end) };
  }

  if (presetValue === "week") {
    const day = start.getDay();
    const diff = day === 0 ? 6 : day - 1;
    start.setDate(start.getDate() - diff);
    end.setTime(start.getTime());
    end.setDate(end.getDate() + 6);

    return { start: toDateInputValue(start), end: toDateInputValue(end) };
  }

  if (presetValue === "month") {
    start.setDate(1);
    end.setMonth(end.getMonth() + 1, 0);

    return { start: toDateInputValue(start), end: toDateInputValue(end) };
  }

  if (presetValue === "quarter") {
    const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
    start.setMonth(quarterStartMonth, 1);
    end.setMonth(quarterStartMonth + 3, 0);

    return { start: toDateInputValue(start), end: toDateInputValue(end) };
  }

  if (presetValue === "year") {
    start.setMonth(0, 1);
    end.setMonth(11, 31);

    return { start: toDateInputValue(start), end: toDateInputValue(end) };
  }

  return { start: "", end: "" };
}

export function buildPeriodState(presetValue = "month", start = "", end = "") {
  const option = PERIOD_OPTIONS.find((item) => item.value === presetValue);
  const presetRange =
    presetValue === "custom" ? { start, end } : getPresetDateRange(presetValue);

  return {
    start: start || presetRange.start,
    end: end || presetRange.end,
    presetValue,
    label: option?.label ?? "Este mes",
  };
}

export function createPeriodState(presetValue = "month", start = "", end = "") {
  return buildPeriodState(presetValue, start, end);
}

export function shouldUseHistoricalSnapshot(start = "", end = "") {
  const startDate = parseDateInputValue(start);
  const endDate = parseDateInputValue(end);

  if (!startDate || !endDate) return false;

  const currentMonthStart = new Date();
  currentMonthStart.setDate(1);
  currentMonthStart.setHours(0, 0, 0, 0);

  return startDate < currentMonthStart || endDate < currentMonthStart;
}