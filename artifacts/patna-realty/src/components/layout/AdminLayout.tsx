import { useLocation, Link } from "wouter";
import { getSession, clearSession } from "@/lib/auth";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const session = getSession();

  useEffect(() => {
    if (!session || session.role !== "admin") {
      setLocation("/login");
    }
  }, [session, setLocation]);

  if (!session || session.role !== "admin") return null;

  const links = [
    { href: "/admin", label: "Dashboard" },
    { href: "/admin/properties", label: "Properties" },
    { href: "/admin/tenants", label: "Tenants" },
    { href: "/admin/leases", label: "Leases" },
    { href: "/admin/payments", label: "Payments" },
    { href: "/admin/rent-roll", label: "Rent Roll" },
    { href: "/admin/collection-report", label: "Collection Report" },
    { href: "/admin/maintenance", label: "Maintenance" },
    { href: "/admin/inquiries", label: "Inquiries" },
  ];

  return (
    <div className="min-h-screen bg-muted/10 flex flex-col md:flex-row">
      <aside className="w-full md:w-64 bg-background border-r flex flex-col">
        <div className="p-4 border-b">
          <h2 className="text-xl font-bold text-primary">Patna Complex</h2>
          <p className="text-sm text-muted-foreground">Admin Portal</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {links.map(link => (
            <Link key={link.href} href={link.href}>
              <Button
                variant={location === link.href ? "secondary" : "ghost"}
                className="w-full justify-start"
              >
                {link.label}
              </Button>
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t">
          <Button variant="outline" className="w-full" onClick={() => { clearSession(); setLocation("/"); }}>
            Logout
          </Button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
