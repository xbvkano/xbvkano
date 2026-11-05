import type {
  ApplicationStatus,
  Entry,
  EntryKind,
  JobApplication,
  Profile,
  Reference,
  Skill,
} from "@prisma/client";
import { ApiError } from "./api-error.js";
import { prisma } from "./lib/prisma.js";

const entryKinds: EntryKind[] = ["project", "certificate", "experience", "education", "coursework"];
const applicationStatuses: ApplicationStatus[] = ["applied", "declined", "rejected", "hired"];

type EntryWithSkills = Entry & { skills: { skill: Skill }[] };

function formatDate(value: Date | null): string | null {
  if (!value) {
    return null;
  }
  return value.toISOString().slice(0, 10);
}

function ageFromBirthDate(birthDate: Date | null): number | null {
  if (!birthDate) {
    return null;
  }
  const today = new Date();
  let age = today.getUTCFullYear() - birthDate.getUTCFullYear();
  const monthDelta = today.getUTCMonth() - birthDate.getUTCMonth();
  if (monthDelta < 0 || (monthDelta === 0 && today.getUTCDate() < birthDate.getUTCDate())) {
    age -= 1;
  }
  return age;
}

export function formatProfile(profile: Profile) {
  return {
    name: `${profile.firstName} ${profile.lastName}`.trim(),
    firstName: profile.firstName,
    lastName: profile.lastName,
    phone: profile.phone,
    email: profile.email,
    birthDate: formatDate(profile.birthDate),
    age: ageFromBirthDate(profile.birthDate),
    sex: profile.sex,
    languages: profile.languages,
    notes: profile.notes,
    photoPath: profile.photoPath,
  };
}

function formatEntry(entry: EntryWithSkills) {
  return {
    id: entry.id,
    kind: entry.kind,
    slug: entry.slug,
    title: entry.title,
    subtitle: entry.subtitle,
    shortDescription: entry.shortDescription,
    longDescription: entry.longDescription,
    imagePath: entry.imagePath,
    linkUrl: entry.linkUrl,
    startedOn: formatDate(entry.startedOn),
    endedOn: formatDate(entry.endedOn),
    sortOrder: entry.sortOrder,
    skills: entry.skills
      .map((link) => ({ id: link.skill.id, name: link.skill.name }))
      .sort((left, right) => left.name.localeCompare(right.name)),
  };
}

function formatSkill(skill: Skill) {
  return {
    id: skill.id,
    name: skill.name,
    shortDescription: skill.shortDescription,
    longDescription: skill.longDescription,
  };
}

function formatReference(reference: Reference) {
  return {
    id: reference.id,
    firstName: reference.firstName,
    lastName: reference.lastName,
    email: reference.email,
    shortDescription: reference.shortDescription,
  };
}

export function formatApplication(application: JobApplication) {
  return {
    id: application.id,
    companyName: application.companyName,
    appliedOn: formatDate(application.appliedOn),
    status: application.status,
  };
}

function asRecord(body: unknown): Record<string, unknown> {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new ApiError(400, "Expected an object");
  }
  return body as Record<string, unknown>;
}

function requiredString(body: Record<string, unknown>, key: string): string {
  const value = body[key];
  if (typeof value !== "string" || value.trim() === "") {
    throw new ApiError(400, `${key} is required`);
  }
  return value.trim();
}

function optionalString(body: Record<string, unknown>, key: string): string | null {
  const value = body[key];
  if (value === undefined || value === null || value === "") {
    return null;
  }
  if (typeof value !== "string") {
    throw new ApiError(400, `${key} must be a string`);
  }
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function optionalDate(body: Record<string, unknown>, key: string): Date | null {
  const value = body[key];
  if (value === undefined || value === null || value === "") {
    return null;
  }
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new ApiError(400, `${key} must be a date`);
  }
  return new Date(`${value}T00:00:00.000Z`);
}

function skillIds(body: Record<string, unknown>): number[] {
  const value = body.skillIds;
  if (!Array.isArray(value)) {
    throw new ApiError(400, "skillIds must be an array of ids");
  }
  const ids: number[] = [];
  for (const id of value) {
    if (typeof id !== "number" || !Number.isInteger(id)) {
      throw new ApiError(400, "skillIds must be an array of ids");
    }
    ids.push(id);
  }
  return [...new Set(ids)];
}

function entryKind(value: unknown): EntryKind {
  if (typeof value !== "string" || !entryKinds.includes(value as EntryKind)) {
    throw new ApiError(400, "kind is invalid");
  }
  return value as EntryKind;
}

function applicationStatus(value: unknown): ApplicationStatus {
  if (typeof value !== "string" || !applicationStatuses.includes(value as ApplicationStatus)) {
    throw new ApiError(400, "status is invalid");
  }
  return value as ApplicationStatus;
}

export function parseId(value: string | undefined): number {
  if (!value || !/^\d+$/.test(value)) {
    throw new ApiError(400, "Invalid id");
  }
  return Number(value);
}

function slugify(title: string): string {
  const base = title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base.length > 0 ? base : "entry";
}

async function uniqueSlug(title: string): Promise<string> {
  const base = slugify(title);
  let slug = base;
  let suffix = 2;
  while (await prisma.entry.findUnique({ where: { slug } })) {
    slug = `${base}-${suffix}`;
    suffix += 1;
  }
  return slug;
}

async function assertSkills(ids: number[]): Promise<void> {
  if (ids.length === 0) {
    return;
  }
  const found = await prisma.skill.findMany({ where: { id: { in: ids } }, select: { id: true } });
  if (found.length !== ids.length) {
    throw new ApiError(400, "Unknown skill");
  }
}

async function entryById(id: number): Promise<EntryWithSkills> {
  const entry = await prisma.entry.findUnique({
    where: { id },
    include: { skills: { include: { skill: true } } },
  });
  if (!entry) {
    throw new ApiError(404, "Not found");
  }
  return entry;
}

export async function loadPortfolio() {
  const profile = await prisma.profile.findUnique({ where: { id: 1 } });
  if (!profile) {
    throw new ApiError(404, "Profile not found");
  }

  const [entries, skills, references] = await Promise.all([
    prisma.entry.findMany({
      include: { skills: { include: { skill: true } } },
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    }),
    prisma.skill.findMany({ orderBy: { name: "asc" } }),
    prisma.reference.findMany({ orderBy: [{ lastName: "asc" }, { firstName: "asc" }] }),
  ]);

  const grouped: Record<EntryKind, ReturnType<typeof formatEntry>[]> = {
    project: [],
    certificate: [],
    experience: [],
    education: [],
    coursework: [],
  };
  for (const entry of entries) {
    grouped[entry.kind].push(formatEntry(entry));
  }

  return {
    profile: formatProfile(profile),
    entries: grouped,
    skills: skills.map(formatSkill),
    references: references.map(formatReference),
  };
}

export async function updateProfile(body: unknown) {
  const record = asRecord(body);
  const languages = record.languages;
  if (!Array.isArray(languages) || languages.some((language) => typeof language !== "string")) {
    throw new ApiError(400, "languages must be an array of strings");
  }
  if (typeof record.notes !== "string") {
    throw new ApiError(400, "notes must be a string");
  }

  const profile = await prisma.profile.update({
    where: { id: 1 },
    data: {
      firstName: requiredString(record, "firstName"),
      lastName: requiredString(record, "lastName"),
      phone: optionalString(record, "phone"),
      email: optionalString(record, "email"),
      birthDate: optionalDate(record, "birthDate"),
      sex: optionalString(record, "sex"),
      languages: languages.map((language) => language.trim()).filter((language) => language.length > 0),
      notes: record.notes,
      photoPath: requiredString(record, "photoPath"),
    },
  });
  return formatProfile(profile);
}

function entryInput(body: unknown) {
  const record = asRecord(body);
  return {
    kind: entryKind(record.kind),
    title: requiredString(record, "title"),
    subtitle: optionalString(record, "subtitle"),
    shortDescription: requiredString(record, "shortDescription"),
    longDescription: requiredString(record, "longDescription"),
    imagePath: optionalString(record, "imagePath"),
    linkUrl: optionalString(record, "linkUrl"),
    startedOn: optionalDate(record, "startedOn"),
    endedOn: optionalDate(record, "endedOn"),
    skillIds: skillIds(record),
  };
}

export async function createEntry(body: unknown) {
  const input = entryInput(body);
  await assertSkills(input.skillIds);
  const maxOrder = await prisma.entry.aggregate({
    where: { kind: input.kind },
    _max: { sortOrder: true },
  });
  const entry = await prisma.entry.create({
    data: {
      kind: input.kind,
      slug: await uniqueSlug(input.title),
      title: input.title,
      subtitle: input.subtitle,
      shortDescription: input.shortDescription,
      longDescription: input.longDescription,
      imagePath: input.imagePath,
      linkUrl: input.linkUrl,
      startedOn: input.startedOn,
      endedOn: input.endedOn,
      sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
      skills: { create: input.skillIds.map((skillId) => ({ skillId })) },
    },
    include: { skills: { include: { skill: true } } },
  });
  return formatEntry(entry);
}

export async function updateEntry(id: number, body: unknown) {
  const input = entryInput(body);
  await assertSkills(input.skillIds);
  await entryById(id);
  const entry = await prisma.entry.update({
    where: { id },
    data: {
      kind: input.kind,
      title: input.title,
      subtitle: input.subtitle,
      shortDescription: input.shortDescription,
      longDescription: input.longDescription,
      imagePath: input.imagePath,
      linkUrl: input.linkUrl,
      startedOn: input.startedOn,
      endedOn: input.endedOn,
      skills: {
        deleteMany: {},
        create: input.skillIds.map((skillId) => ({ skillId })),
      },
    },
    include: { skills: { include: { skill: true } } },
  });
  return formatEntry(entry);
}

export async function deleteEntry(id: number) {
  await entryById(id);
  await prisma.entry.delete({ where: { id } });
}

function skillInput(body: unknown) {
  const record = asRecord(body);
  return {
    name: requiredString(record, "name"),
    shortDescription: requiredString(record, "shortDescription"),
    longDescription: requiredString(record, "longDescription"),
  };
}

export async function createSkill(body: unknown) {
  return formatSkill(await prisma.skill.create({ data: skillInput(body) }));
}

export async function updateSkill(id: number, body: unknown) {
  const existing = await prisma.skill.findUnique({ where: { id } });
  if (!existing) {
    throw new ApiError(404, "Not found");
  }
  return formatSkill(await prisma.skill.update({ where: { id }, data: skillInput(body) }));
}

export async function deleteSkill(id: number) {
  const existing = await prisma.skill.findUnique({ where: { id } });
  if (!existing) {
    throw new ApiError(404, "Not found");
  }
  await prisma.skill.delete({ where: { id } });
}

function referenceInput(body: unknown) {
  const record = asRecord(body);
  return {
    firstName: requiredString(record, "firstName"),
    lastName: requiredString(record, "lastName"),
    email: requiredString(record, "email"),
    shortDescription: requiredString(record, "shortDescription"),
  };
}

export async function createReference(body: unknown) {
  return formatReference(await prisma.reference.create({ data: referenceInput(body) }));
}

export async function updateReference(id: number, body: unknown) {
  const existing = await prisma.reference.findUnique({ where: { id } });
  if (!existing) {
    throw new ApiError(404, "Not found");
  }
  return formatReference(await prisma.reference.update({ where: { id }, data: referenceInput(body) }));
}

export async function deleteReference(id: number) {
  const existing = await prisma.reference.findUnique({ where: { id } });
  if (!existing) {
    throw new ApiError(404, "Not found");
  }
  await prisma.reference.delete({ where: { id } });
}

export async function loadApplications() {
  const applications = await prisma.jobApplication.findMany({
    orderBy: [{ appliedOn: "desc" }, { id: "desc" }],
  });
  return applications.map(formatApplication);
}

function applicationInput(body: unknown) {
  const record = asRecord(body);
  const appliedOn = optionalDate(record, "appliedOn");
  if (!appliedOn) {
    throw new ApiError(400, "appliedOn is required");
  }
  return {
    companyName: requiredString(record, "companyName"),
    appliedOn,
    status: applicationStatus(record.status),
  };
}

export async function createApplication(body: unknown) {
  return formatApplication(await prisma.jobApplication.create({ data: applicationInput(body) }));
}

export async function updateApplication(id: number, body: unknown) {
  const existing = await prisma.jobApplication.findUnique({ where: { id } });
  if (!existing) {
    throw new ApiError(404, "Not found");
  }
  return formatApplication(await prisma.jobApplication.update({ where: { id }, data: applicationInput(body) }));
}

export async function deleteApplication(id: number) {
  const existing = await prisma.jobApplication.findUnique({ where: { id } });
  if (!existing) {
    throw new ApiError(404, "Not found");
  }
  await prisma.jobApplication.delete({ where: { id } });
}
