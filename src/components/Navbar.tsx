"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { t } from "@/lib/translate";

const navItems = [
  { href: "#features", label: t("landing.navbar.features") },
  { href: "#workflow", label: t("landing.navbar.workflow") },
  { href: "#about", label: t("landing.navbar.about") },
] as const;

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <motion.header
      initial={{ y: -16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-x-0 top-0 z-50 border-b border-white/50 bg-white/70 backdrop-blur-xl"
    >
      <Container className="flex h-16 items-center justify-between">
        <Link
          href="/"
          className="text-sm font-semibold tracking-tight text-foreground sm:text-base"
        >
          Community Project Lab
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Button asChild size="lg" className="h-9 rounded-full px-5 shadow-md shadow-primary/20">
            <Link href="/dashboard">{t("landing.navbar.startBuilding")}</Link>
          </Button>
        </div>

        <button
          type="button"
          aria-label={open ? t("landing.navbar.closeMenu") : t("landing.navbar.openMenu")}
          className="inline-flex size-9 items-center justify-center rounded-lg border border-border/60 bg-white/60 text-foreground md:hidden"
          onClick={() => setOpen((prev) => !prev)}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </Container>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden border-t border-border/50 bg-white/90 backdrop-blur-xl md:hidden"
          >
            <Container className="flex flex-col gap-4 py-4">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-sm font-medium text-foreground"
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              <Button asChild className={cn("h-10 w-full rounded-full")}>
                <Link href="/dashboard" onClick={() => setOpen(false)}>
                  {t("landing.navbar.startBuilding")}
                </Link>
              </Button>
            </Container>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}