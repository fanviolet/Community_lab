import { Navbar } from "@/components/Navbar";
import { LandingHero } from "@/components/landing/LandingHero";
import { AIMentorSection } from "@/components/landing/AIMentorSection";
import { JourneyTimeline } from "@/components/landing/JourneyTimeline";
import { FeaturedProjects } from "@/components/landing/FeaturedProjects";
import { FeatureGrid } from "@/components/landing/FeatureGrid";
import { ImpactSection } from "@/components/landing/ImpactSection";
import { Testimonials } from "@/components/landing/Testimonials";
import { LandingFooter } from "@/components/landing/LandingFooter";

export default function Home() {
  return (
    <div className="min-h-full flex-1 bg-background">
      <Navbar />
      <main>
        <LandingHero />
        <AIMentorSection />
        <JourneyTimeline />
        <FeaturedProjects />
        <FeatureGrid />
        <ImpactSection />
        <Testimonials />
      </main>
      <LandingFooter />
    </div>
  );
}
