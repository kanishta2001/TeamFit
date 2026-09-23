// Only allow known internal destinations after login, never an arbitrary redirect URL.
export function safeDestination(value?: string) {
  return value && /^\/(dashboard|students|invitations|notifications|tasks|chats|profile(?:\/(create|edit))?|projects(?:\/(mine|joined|new|[1-9]\d*(?:\/edit)?))?)?$/.test(value)
    ? value : "/dashboard";
}
