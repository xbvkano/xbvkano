const serverRoot = (import.meta.env.VITE_SERVER_URL ?? "").replace(/\/$/, "");

export function serverUrl(path: string): string {
  if (!serverRoot || /^https?:\/\//.test(path)) {
    return path;
  }
  return `${serverRoot}${path.startsWith("/") ? path : `/${path}`}`;
}

export function mediaUrl(path: string): string {
  if (path.startsWith("/media/") || path === "/media") {
    return serverUrl(path);
  }
  if (/^https?:\/\//.test(path)) {
    return path;
  }
  const base = import.meta.env.BASE_URL;
  if (base !== "/" && path.startsWith("/")) {
    return `${base.replace(/\/$/, "")}${path}`;
  }
  return path;
}
