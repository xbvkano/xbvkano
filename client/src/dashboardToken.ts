const storageKey = "dashboard-token";

const listeners = new Set<() => void>();

export function readDashboardToken(): string | null {
  try {
    return sessionStorage.getItem(storageKey);
  } catch {
    return null;
  }
}

export function saveDashboardToken(token: string) {
  try {
    sessionStorage.setItem(storageKey, token);
  } catch {
    // This browser blocked storage. The login cookie may still work.
  }
}

export function clearDashboardToken() {
  try {
    sessionStorage.removeItem(storageKey);
  } catch {
    // Storage is already unavailable.
  }
}

export function onAuthFailure(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function notifyAuthFailure() {
  clearDashboardToken();
  for (const listener of listeners) {
    listener();
  }
}

export function isAuthFailure(status: number, message: string): boolean {
  return status === 401 && (message === "Invalid token" || message === "Token expired" || message === "Login required");
}

export function withAuth(init: RequestInit = {}): RequestInit {
  const headers = new Headers(init.headers);
  const token = readDashboardToken();
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  return { ...init, credentials: "include", headers };
}
