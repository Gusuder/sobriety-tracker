import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Трезвость",
  description: "Локальный трекер отказа от алкоголя",
};

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex-1 text-center py-3 text-sm text-gray-700 hover:text-black"
    >
      {label}
    </Link>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body className="min-h-screen bg-white text-black">

        <div className="pb-20">
          <div className="mx-auto max-w-md">{children}</div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 border-t bg-white">
          <nav className="mx-auto max-w-md flex">
            <NavLink href="/" label="Сегодня" />
            <NavLink href="/checkin" label="Чек-ин" />
            <NavLink href="/calendar" label="Календарь" />
            <NavLink href="/analytics" label="Аналитика" />
            <NavLink href="/crisis" label="Кризис" />
            <NavLink href="/settings" label="Настройки" />
          </nav>
        </div>
      </body>
    </html>
  );
}