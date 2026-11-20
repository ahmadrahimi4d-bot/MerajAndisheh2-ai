export function getBasePath(): string {
  const raw = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  if (!raw || raw === "/") return "";
  const trimmed = raw.replace(/\/+$/, "");
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

export function isStaticExportMode(): boolean {
  return process.env.NEXT_PUBLIC_STATIC_EXPORT === "true";
}

export function withBasePath(url: string, basePath = getBasePath()): string {
  if (!url) return url;
  if (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("data:") ||
    url.startsWith("blob:") ||
    url.startsWith("//") ||
    url.startsWith("#") ||
    url.startsWith("mailto:")
  ) {
    return url;
  }
  const normalizedBase = basePath && basePath !== "/" ? `/${basePath.replace(/^\/+|\/+$/g, "")}` : "";
  const normalizedUrl = url.startsWith("/") ? url : `/${url}`;
  if (!normalizedBase) return normalizedUrl;
  if (normalizedUrl === normalizedBase || normalizedUrl.startsWith(`${normalizedBase}/`)) {
    return normalizedUrl;
  }
  return `${normalizedBase}${normalizedUrl}`;
}

export function buildAppUrl(query: string, basePath = getBasePath()): string {
  const root = withBasePath("/", basePath);
  const rootWithSlash = root.endsWith("/") ? root : `${root}/`;
  const cleanQuery = query.replace(/^\?/, "");
  return cleanQuery ? `${rootWithSlash}?${cleanQuery}` : rootWithSlash;
}
