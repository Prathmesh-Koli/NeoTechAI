"use client";

import Link from "next/link";
import Button from "@mui/material/Button";
import type { ButtonProps } from "@mui/material/Button";

// Passing `component={Link}` from a Server Component into MUI's Button (a
// Client Component) fails RSC serialization -- the component reference can't
// cross that boundary as a prop. Wrapping it here keeps callers (including
// Server Component pages) simple.
export function LinkButton({
  href,
  ...buttonProps
}: ButtonProps & { href: string }) {
  return <Button component={Link} href={href} {...buttonProps} />;
}
