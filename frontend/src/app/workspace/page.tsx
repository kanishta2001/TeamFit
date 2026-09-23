import { redirect } from "next/navigation";

export default function WorkspacePage() {
  // Preserve bookmarks for the old single-page workspace.
  redirect("/dashboard");
}
