import { Navbar } from "@/components/layout/Navbar";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useLang } from "@/lib/i18n";
import { motion } from "framer-motion";

export default function Home() {
  const { t } = useLang();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="bg-primary/10 py-20 px-4 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-4xl md:text-6xl font-bold text-foreground mb-6"
          >
            {t.home.title}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8"
          >
            {t.home.subtitle}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex justify-center gap-4 flex-wrap"
          >
            <Link href="/properties">
              <Button size="lg">{t.home.browse}</Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg">{t.home.portal}</Button>
            </Link>
          </motion.div>
        </section>
      </main>
    </div>
  );
}
