export function getApiErrorMessage(error, fallback) {
  return error?.data?.message ?? error?.error ?? fallback;
}
