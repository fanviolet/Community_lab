import { CTA } from "@/components/CTA";
import { Features } from "@/components/Features";
import { Footer } from "@/components/Footer";
import { Hero } from "@/components/Hero";
import { Navbar } from "@/components/Navbar";
import { Stats } from "@/components/Stats";
import { Workflow } from "@/components/Workflow";

export default function Home() {
  return (
    <div className="min-h-full flex-1 bg-background">
      <Navbar />
      <main>
        <Hero />
        <Features />
        <Workflow />
        <Stats />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
