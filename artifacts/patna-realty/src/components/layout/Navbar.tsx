import { Link } from "wouter";
import { getSession, clearSession } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { useLang } from "@/lib/i18n";
import { Globe } from "lucide-react";

export function Navbar() {
  const session = getSession();
  const { t, lang, toggle } = useLang();

  const handleLogout = () => {
    clearSession();
    window.location.href = "/";
  };

  return (
    <header className="border-b bg-background sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-primary">
          {t.nav.brandName}
        </Link>
        <nav className="flex gap-3 items-center">
          <Link href="/properties" className="hidden md:block text-sm font-medium hover:text-primary transition-colors">
            {t.nav.properties}
          </Link>

          <button
            onClick={toggle}
            className="flex items-center gap-1 text-xs font-semibold border border-border rounded-full px-3 py-1.5 hover:bg-muted transition-colors"
            aria-label="Toggle language"
          >
            <Globe className="w-3.5 h-3.5" />
            {lang === "en" ? "हिं" : "EN"}
          </button>

          {session ? (
            <div className="flex items-center gap-3">
              <Link href={session.role === "admin" ? "/admin" : "/tenant"} className="hidden md:block text-sm font-medium hover:text-primary transition-colors">
                {t.nav.dashboard}
              </Link>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                {t.nav.logout}
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="ghost" size="sm">{t.nav.login}</Button>
              </Link>
              <Link href="/register">
                <Button size="sm">{t.nav.register}</Button>
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
