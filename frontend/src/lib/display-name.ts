// A temporary display name, not a unique handle or a login credential.
// Derive it from the saved profile so it stays consistent after a refresh.
export function displayName(fullName?: string | null): string {
  return fullName?.trim().split(/\s+/u)[0]?.toLowerCase() || "Student";
}
