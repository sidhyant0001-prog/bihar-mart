import { Navbar } from "@/components/layout/Navbar";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="bg-primary/10 py-20 px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
            Find Your Space in Patna Complex
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Premium residential flats, thriving commercial shops, and bustling markets — all managed with transparency and care.
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/properties">
              <Button size="lg">Browse Properties</Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg">Tenant Portal</Button>
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
