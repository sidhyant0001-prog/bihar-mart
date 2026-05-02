import { Link } from "wouter";
import { getSession, clearSession } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const session = getSession();

  const handleLogout = () => {
    clearSession();
    window.location.href = "/";
  };

  return (
    <header className="border-b bg-background sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-primary">
          Patna Complex
        </Link>
        <nav className="hidden md:flex gap-6 items-center">
          <Link href="/properties" className="text-sm font-medium hover:text-primary transition-colors">
            Properties
          </Link>
          {session ? (
            <div className="flex items-center gap-4">
              <Link href={session.role === "admin" ? "/admin" : "/tenant"} className="text-sm font-medium hover:text-primary transition-colors">
                Dashboard
              </Link>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <Link href="/login">
                <Button variant="ghost" size="sm">Login</Button>
              </Link>
              <Link href="/register">
                <Button size="sm">Register</Button>
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
