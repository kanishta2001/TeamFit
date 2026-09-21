import Link from "next/link";

export default function Brand({ href = "/" }: { href?: string }) {
  return <Link className="brand-link" href={href} aria-label="TeamFit home">
    {/* The CSS mask uses the supplied transparent logo without changing its shape. */}
    <span aria-hidden="true" className="brand-mark" />
    <span className="sr-only">TeamFit</span>
  </Link>;
}
