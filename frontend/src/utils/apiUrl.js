const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api/v1/";

export function getApiUrl(path) {
  const baseUrl = apiBaseUrl.endsWith("/") ? apiBaseUrl : `${apiBaseUrl}/`;
  return new URL(path, baseUrl).toString();
}
