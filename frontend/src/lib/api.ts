const baseUrl = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5273").replace(/\/$/, "");

export function studentPhotoUrl(id: number, version: string) {
  return `${baseUrl}/api/students/${id}/photo?v=${encodeURIComponent(version)}`;
}

export class ApiError extends Error {
  constructor(message: string, public status: number) { super(message); }
}

// Use HttpOnly session cookies; never persist JWTs in localStorage.
export async function api<T>(path: string, method = "GET", body?: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${baseUrl}/api/${path}`, {
      method, credentials: "include", cache: "no-store",
      headers: body === undefined || body instanceof FormData ? undefined : { "Content-Type": "application/json" },
      body: body instanceof FormData ? body : body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(15000),
    });
  } catch {
    throw new ApiError("Could not reach TeamFit. Check the backend connection and try again.", 0);
  }
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const validation = data.errors ? Object.values(data.errors).flat().join(" ") : "";
    throw new ApiError(
      data.message || validation ||
      (response.status === 401 ? "Your session has expired. Please sign in again." :
       response.status === 403 ? "You do not have permission to make this change." :
       response.status === 429 ? "Too many sign-in attempts. Please wait a minute." :
       "The request could not be completed. Please try again."),
      response.status
    );
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export function message(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong. Please try again.";
}
