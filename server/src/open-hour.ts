import { ApiError } from "./api-error.js";
import { prisma } from "./lib/prisma.js";

const openHourId = 1;
const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/;

const defaultSchedule = {
  enabled: true,
  startsAt: "03:00",
  endsAt: "08:00",
  timeZone: "America/Los_Angeles",
};

export type OpenHourSchedule = {
  enabled: boolean;
  startsAt: string;
  endsAt: string;
  timeZone: string;
};

export type OpenHourStatus = OpenHourSchedule & {
  open: boolean;
};

export async function openHourStatus(now = new Date()): Promise<OpenHourStatus> {
  const row = await prisma.openHour.findUnique({ where: { id: openHourId } });
  const schedule: OpenHourSchedule = row
    ? {
        enabled: row.enabled,
        startsAt: row.startsAt,
        endsAt: row.endsAt,
        timeZone: row.timeZone,
      }
    : defaultSchedule;
  return { ...schedule, open: isInsideWindow(now, schedule) };
}

export async function isOpenHour(now = new Date()): Promise<boolean> {
  return (await openHourStatus(now)).open;
}

export async function saveOpenHour(body: unknown, now = new Date()): Promise<OpenHourStatus> {
  const schedule = parseSchedule(body);
  await prisma.openHour.upsert({
    where: { id: openHourId },
    create: { id: openHourId, ...schedule },
    update: schedule,
  });
  return { ...schedule, open: isInsideWindow(now, schedule) };
}

export function isInsideWindow(now: Date, schedule: OpenHourSchedule): boolean {
  if (!schedule.enabled || !isTimeZone(schedule.timeZone)) {
    return false;
  }
  const start = minutesOfDay(schedule.startsAt);
  const end = minutesOfDay(schedule.endsAt);
  if (start === null || end === null || start === end) {
    return false;
  }
  const current = minutesInZone(now, schedule.timeZone);
  if (start < end) {
    return current >= start && current < end;
  }
  return current >= start || current < end;
}

function parseSchedule(body: unknown): OpenHourSchedule {
  if (!body || typeof body !== "object") {
    throw new ApiError(400, "Open hour schedule is required");
  }
  const record = body as Record<string, unknown>;
  const startsAt = typeof record.startsAt === "string" ? record.startsAt : "";
  const endsAt = typeof record.endsAt === "string" ? record.endsAt : "";
  const timeZone = typeof record.timeZone === "string" ? record.timeZone.trim() : "";
  if (!timePattern.test(startsAt) || !timePattern.test(endsAt) || startsAt === endsAt) {
    throw new ApiError(400, "Choose a start and end time");
  }
  if (!isTimeZone(timeZone)) {
    throw new ApiError(400, "Choose a valid time zone");
  }
  return {
    enabled: record.enabled === true,
    startsAt,
    endsAt,
    timeZone,
  };
}

function minutesOfDay(value: string): number | null {
  const match = timePattern.exec(value);
  if (!match) {
    return null;
  }
  return Number(match[1]) * 60 + Number(match[2]);
}

function minutesInZone(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? "0") % 24;
  const minute = Number(parts.find((part) => part.type === "minute")?.value ?? "0");
  return hour * 60 + minute;
}

function isTimeZone(timeZone: string): boolean {
  try {
    Intl.DateTimeFormat("en-US", { timeZone }).format(new Date());
    return true;
  } catch {
    return false;
  }
}
