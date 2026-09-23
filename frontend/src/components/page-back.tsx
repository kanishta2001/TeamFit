"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

export default function PageBack({ href = "/dashboard", label = "Go to previous page", className = "workspace-back", children = "←" }: {
  href?: string; label?: string; className?: string; children?: ReactNode;
}) {
  const router = useRouter();
  function goBack() {
    if (window.history.length > 1) router.back();
    else router.push(href);
  }
  return <button type="button" className={className} aria-label={label} onClick={goBack}>{children}</button>;
}
