import Hero from "@/components/sections/Hero";
import StatsBar from "@/components/sections/StatsBar";
import Products from "@/components/sections/Products";
import Features from "@/components/sections/Features";
import CTA from "@/components/sections/CTA";

export default function Home() {
  return (
    <>
      <Hero />
      <StatsBar />
      <Products />
      <Features />
      <CTA />
    </>
  );
}