import { prisma } from "./lib/prisma.js";

const openHourId = 1;
const openHourMs = 60 * 60 * 1000;

export type OpenHourStatus = {
  open: boolean;
  openUntil: string | null;
};

export async function openHourStatus(): Promise<OpenHourStatus> {
  const row = await prisma.openHour.findUnique({ where: { id: openHourId } });
  if (!row?.openUntil || row.openUntil.getTime() <= Date.now()) {
    return { open: false, openUntil: null };
  }
  return { open: true, openUntil: row.openUntil.toISOString() };
}

export async function isOpenHour(): Promise<boolean> {
  return (await openHourStatus()).open;
}

export async function startOpenHour(): Promise<OpenHourStatus> {
  const openUntil = new Date(Date.now() + openHourMs);
  await prisma.openHour.upsert({
    where: { id: openHourId },
    create: { id: openHourId, openUntil },
    update: { openUntil },
  });
  return { open: true, openUntil: openUntil.toISOString() };
}

export async function closeOpenHour(): Promise<OpenHourStatus> {
  await prisma.openHour.upsert({
    where: { id: openHourId },
    create: { id: openHourId, openUntil: null },
    update: { openUntil: null },
  });
  return { open: false, openUntil: null };
}
