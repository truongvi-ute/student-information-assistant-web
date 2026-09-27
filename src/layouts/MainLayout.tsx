import type { ReactNode } from "react";
import { APP_CONFIG } from "@/src/config/app";

type MainLayoutProps = {
  children: ReactNode;
};

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="site-shell">
      <header className="site-header">
        <a className="brand" href="#home" aria-label={APP_CONFIG.name}>
          <span className="brand-mark" aria-hidden="true">S</span>
          <span>{APP_CONFIG.name}</span>
        </a>
        <a className="header-link" href="mailto:hello@student-assistant.local">
          Liên hệ <span aria-hidden="true">↗</span>
        </a>
      </header>
      {children}
    </div>
  );
}