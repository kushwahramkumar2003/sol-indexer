"use client";
import { MeteorEffect } from "@/components/meteor-effect";
import { HeroSection } from "@/components/hero-section";
import { FeaturesSection } from "@/components/features-section";
import { HowItWorksSection } from "@/components/how-it-works-section";
import { PricingSection } from "@/components/pricing-section";
import { TestimonialsSection } from "@/components/testimonials-section";
import { FAQSection } from "@/components/faq-section";
import { CTASection } from "@/components/cta-section";
import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";
import { Sidebar } from "@/components/dashboard/sidebar";

export default function Home() {
  const navItems = [
    {
      label: "Features",
      href: "#features",
    },
    {
      label: "Solutions",
      href: "#",
      children: [
        { label: "For Developers", href: "#developers" },
        { label: "For Enterprises", href: "#enterprises" },
        { label: "For Startups", href: "#startups" },
      ],
    },
    {
      label: "How It Works",
      href: "#how-it-works",
    },
    {
      label: "Pricing",
      href: "#pricing",
    },
    {
      label: "Resources",
      href: "#",
      children: [
        { label: "Documentation", href: "/docs" },
        { label: "API Reference", href: "/api" },
        { label: "Blog", href: "/blog" },
      ],
    },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden">
      <MeteorEffect />
      <Navbar items={navItems} />
      <main>
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <PricingSection />
        <TestimonialsSection />
        <FAQSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
