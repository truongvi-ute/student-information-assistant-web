import type { ReactNode } from "react";

type ActionLinkProps = {
  children: ReactNode;
  href: string;
  variant?: "primary" | "secondary";
};

export function ActionLink({
  children,
  href,
  variant = "primary",
}: ActionLinkProps) {
  return (
    <a className={`action-link action-link-${variant}`} href={href}>
      {children}
    </a>
  );
}