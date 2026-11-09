import { isAuthFailure, notifyAuthFailure, saveDashboardToken, withAuth } from "./dashboardToken";
import { encryptPassword } from "./loginCipher";
import { serverUrl } from "./serverUrl";

export type Profile = {
  name: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  email: string | null;
  birthDate: string | null;
  age: number | null;
  sex: string | null;
  languages: string[];
  notes: string;
  photoPath: string;
};

export type PortfolioEntry = {
  id: number;
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
  skills?: { id: number; name: string }[];
};

export type ShowcaseSkill = {
  id: number;
  name: string;
  shortDescription: string;
  longDescription: string;
};

export type ShowcaseReference = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  shortDescription: string;
};

export type Showcase = {
  profile: Profile;
  entries: {
    project: PortfolioEntry[];
    certificate: PortfolioEntry[];
    experience: PortfolioEntry[];
    education: PortfolioEntry[];
    coursework: PortfolioEntry[];
  };
  skills: ShowcaseSkill[];
  references: ShowcaseReference[];
};

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(serverUrl(path), withAuth());
  if (!response.ok) {
    const message = await errorText(response, `Request failed (${response.status})`);
    if (isAuthFailure(response.status, message)) {
      notifyAuthFailure();
    }
    throw new Error(message);
  }
  return response.json() as Promise<T>;
}

async function errorText(response: Response, fallback: string): Promise<string> {
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

export type Session = {
  authenticated: boolean;
};

export function getSession() {
  return getJson<Session>("/api/auth/session");
}

export type TokenStatus =
  | { active: true; expiresAt: string }
  | { active: false; status?: "Token expired" };

export function getTokenStatus() {
  return getJson<TokenStatus>("/api/auth/tokens/current");
}

export type OpenHourStatus = {
  open: boolean;
  enabled: boolean;
  startsAt: string;
  endsAt: string;
  timeZone: string;
};

export function getOpenHour() {
  return getJson<OpenHourStatus>("/api/auth/tokens/open-hour");
}

export function saveOpenHour(schedule: Omit<OpenHourStatus, "open">) {
  return sendJson<OpenHourStatus>("/api/auth/tokens/open-hour", "PUT", schedule);
}

async function sendJson<T>(path: string, method: string, body?: unknown): Promise<T> {
  const headers = new Headers(body === undefined ? undefined : { "Content-Type": "application/json" });
  const response = await fetch(
    serverUrl(path),
    withAuth({
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  );
  if (!response.ok) {
    const message = await errorText(response, "Request failed");
    if (isAuthFailure(response.status, message)) {
      notifyAuthFailure();
    }
    throw new Error(message);
  }
  return response.json() as Promise<T>;
}

export async function createApiToken(): Promise<{ token: string; expiresAt: string }> {
  const response = await fetch(serverUrl("/api/auth/tokens"), withAuth({ method: "POST" }));
  if (!response.ok) {
    const message = await errorText(response, "Could not create token");
    if (isAuthFailure(response.status, message)) {
      notifyAuthFailure();
    }
    throw new Error(message);
  }
  return response.json() as Promise<{ token: string; expiresAt: string }>;
}

export async function login(password: string): Promise<void> {
  const encrypted = await encryptPassword(password);
  const response = await fetch(serverUrl("/api/auth/login"), {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(encrypted),
  });
  if (!response.ok) {
    let message = "Invalid password";
    try {
      const body = (await response.json()) as { error?: unknown };
      if (typeof body.error === "string") {
        message = body.error;
      }
    } catch {
      // The response had no JSON body, so keep the fallback message.
    }
    throw new Error(message);
  }
  try {
    const body = (await response.json()) as { token?: unknown };
    if (typeof body.token === "string") {
      saveDashboardToken(body.token);
    }
  } catch {
    // A cookie-only login still works in browsers that keep it.
  }
}

export function getProfile() {
  return getJson<Profile>("/api/profile");
}

export function getProjects() {
  return getJson<PortfolioEntry[]>("/api/projects");
}

export function getCertifications() {
  return getJson<PortfolioEntry[]>("/api/certifications");
}

export function getShowcase() {
  return getJson<Showcase>("/api/showcase");
}
