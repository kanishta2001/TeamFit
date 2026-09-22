import Link from "next/link";

export default function PageBack({ href = "/dashboard", label = "Back to dashboard" }: {
  href?: string; label?: string;
}) {
  return <Link href={href} className="workspace-back" aria-label={label}>←</Link>;
}
