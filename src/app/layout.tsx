import "./globals.css";
import Link from "next/link";
import type { ReactNode } from "react";

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex-1 text-center py-2 rounded-xl border border-[var(--border)] bg-white/70 backdrop-blur active:scale-[0.98] transition"
    >
      <span className="text-sm text-[var(--text)]">{label}</span>
    </Link>
  );
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru">
      <body className="min-h-screen">
        <div className="pb-24">{children}</div>

        <nav className="fixed bottom-0 left-0 right-0">
          <div className="mx-auto max-w-md px-4 pb-4">
            <div className="rounded-2xl border border-[var(--border)] bg-white/80 backdrop-blur shadow-sm p-2 flex gap-2">
              <NavLink href="/" label="Сегодня" />
              <NavLink href="/calendar" label="Календарь" />
              <NavLink href="/analytics" label="Аналитика" />
              <NavLink href="/crisis" label="Кризис" />
              <NavLink href="/settings" label="Настройки" />
            </div>
          </div>
        </nav>
      </body>
    </html>
  );
}