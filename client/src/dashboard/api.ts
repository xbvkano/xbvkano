import type { Profile } from "../api";
import { serverUrl } from "../serverUrl";

export type EntryKind = "project" | "certificate" | "experience" | "education" | "coursework";
export type ApplicationStatus = "applied" | "declined" | "rejected" | "hired";

export type SkillLink = {
  id: number;
  name: string;
};

export type ManagedEntry = {
  id: number;
  kind: EntryKind;
  slug: string;
  title: string;
  subtitle: string | null;
  shortDescription: string;
  longDescription: string;
  imagePath: string | null;
  linkUrl: string | null;
  startedOn: string | null;
  endedOn: string | null;
  sortOrder: number;
  skills: SkillLink[];
};

export type Skill = {
  id: number;
  name: string;
  shortDescription: string;
  longDescription: string;
};

export type Reference = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  shortDescription: string;
};

export type JobApplication = {
  id: number;
  companyName: string;
  appliedOn: string;
  status: ApplicationStatus;
};

export type PortfolioDocument = {
  profile: Profile;
  entries: Record<EntryKind, ManagedEntry[]>;
  skills: Skill[];
  references: Reference[];
};

export type EntryInput = {
  kind: EntryKind;
  title: string;
  subtitle: string;
  shortDescription: string;
  longDescription: string;
  imagePath: string;
  linkUrl: string;
  startedOn: string;
  endedOn: string;
  skillIds: number[];
};

async function errorMessage(response: Response, fallback: string): Promise<string> {
  try {
    const payload = (await response.json()) as { error?: unknown };
    if (typeof payload.error === "string") {
      return payload.error;
    }
  } catch {
    // The response had no JSON body.
  }
  return fallback;
}

async function send<T>(path: string, method: string, body?: unknown): Promise<T> {
  const response = await fetch(serverUrl(path), {
    method,
    credentials: "include",
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(await errorMessage(response, `Request failed (${response.status})`));
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return response.json() as Promise<T>;
}

export function getPortfolio() {
  return send<PortfolioDocument>("/api/external/portfolio", "GET");
}

export function getApplications() {
  return send<JobApplication[]>("/api/external/applications", "GET");
}

export function saveProfile(profile: Profile) {
  return send<Profile>("/api/external/profile", "PATCH", profile);
}

export function createEntry(entry: EntryInput) {
  return send<ManagedEntry>("/api/external/entries", "POST", entry);
}

export function updateEntry(id: number, entry: EntryInput) {
  return send<ManagedEntry>(`/api/external/entries/${id}`, "PATCH", entry);
}

export function deleteEntry(id: number) {
  return send<void>(`/api/external/entries/${id}`, "DELETE");
}

export function moveEntry(id: number, direction: "up" | "down") {
  return send<void>(`/api/external/entries/${id}/move`, "POST", { direction });
}

export function createSkill(skill: Omit<Skill, "id">) {
  return send<Skill>("/api/external/skills", "POST", skill);
}

export function updateSkill(id: number, skill: Omit<Skill, "id">) {
  return send<Skill>(`/api/external/skills/${id}`, "PATCH", skill);
}

export function deleteSkill(id: number) {
  return send<void>(`/api/external/skills/${id}`, "DELETE");
}

export function createReference(reference: Omit<Reference, "id">) {
  return send<Reference>("/api/external/references", "POST", reference);
}

export function updateReference(id: number, reference: Omit<Reference, "id">) {
  return send<Reference>(`/api/external/references/${id}`, "PATCH", reference);
}

export function deleteReference(id: number) {
  return send<void>(`/api/external/references/${id}`, "DELETE");
}

export function createApplication(application: Omit<JobApplication, "id">) {
  return send<JobApplication>("/api/external/applications", "POST", application);
}

export function updateApplication(id: number, application: Omit<JobApplication, "id">) {
  return send<JobApplication>(`/api/external/applications/${id}`, "PATCH", application);
}

export function deleteApplication(id: number) {
  return send<void>(`/api/external/applications/${id}`, "DELETE");
}

export async function uploadImage(file: File): Promise<{ imagePath: string }> {
  const body = new FormData();
  body.append("file", file);
  const response = await fetch(serverUrl("/api/external/media"), {
    method: "POST",
    credentials: "include",
    body,
  });
  if (!response.ok) {
    throw new Error(await errorMessage(response, "Could not upload image"));
  }
  return response.json() as Promise<{ imagePath: string }>;
}
