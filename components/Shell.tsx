"use client";

import { usePathname } from "next/navigation";
import { Footer, Header, StoreBanner } from "./Chrome";

/** Moldura do site público. Dentro de /admin não aparece (o painel tem o próprio cabeçalho). */
export function Shell({ children }: { children: React.ReactNode }) {
  const admin = usePathname().startsWith("/admin");
  if (admin) return <main>{children}</main>;
  return (
    <div className="shell">
      <StoreBanner />
      <Header />
      <main>{children}</main>
      <Footer />
    </div>
  );
}
