const apiUrl =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api/v1/";

export const socketOrigin = new URL(apiUrl).origin;
