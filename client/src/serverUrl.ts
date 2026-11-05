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
  return path;
}
