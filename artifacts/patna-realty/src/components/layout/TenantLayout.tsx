import { useLocation, Link } from "wouter";
import { getSession, clearSession } from "@/lib/auth";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export function TenantLayout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const session = getSession();

  useEffect(() => {
    if (!session || (session.role !== "tenant" && session.role !== "shopkeeper")) {
      setLocation("/login");
    }
  }, [session, setLocation]);

  if (!session || (session.role !== "tenant" && session.role !== "shopkeeper")) return null;

  const links = [
    { href: "/tenant", label: "Dashboard" },
    { href: "/tenant/payments", label: "Payments" },
    { href: "/tenant/maintenance", label: "Maintenance" },
  ];

  return (
    <div className="min-h-screen bg-muted/10 flex flex-col">
      <header className="bg-background border-b px-4 md:px-6 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-primary">Tenant Portal</h1>
          <p className="text-sm text-muted-foreground hidden md:block">Welcome back, {session.user.name}</p>
        </div>
        <nav className="flex items-center gap-2">
          {links.map(link => (
            <Link key={link.href} href={link.href}>
              <Button variant={location === link.href ? "secondary" : "ghost"} size="sm">
                {link.label}
              </Button>
            </Link>
          ))}
          <Button variant="outline" size="sm" onClick={() => { clearSession(); setLocation("/"); }}>
            Logout
          </Button>
        </nav>
      </header>
      <main className="flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
}
