"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { siteConfig } from "@/lib/constants";

export default function CTA() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section
      ref={ref}
      className="relative bg-brand-near-black overflow-hidden"
    >
      {/* Decorative elements */}
      <div className="absolute inset-0 opacity-[0.03]">
        <div className="noise-overlay" />
      </div>
      <div className="absolute top-1/2 -translate-y-1/2 -right-40 w-[400px] h-[400px] rounded-full bg-white/5 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8 py-24 md:py-32">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="max-w-2xl mx-auto text-center"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-white leading-tight">
            Ready to move your
            <br />
            payments forward?
          </h2>
          <p className="mt-6 text-base sm:text-lg text-white/60 leading-relaxed max-w-lg mx-auto">
            Join 150K+ logistics businesses already accelerating payments and streamlining
            operations with {siteConfig.name}.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href={siteConfig.links.signUp}
              className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-3.5 text-sm font-medium text-brand-near-black hover:bg-white/90 transition-all duration-200 group"
            >
              Get started
              <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
            </a>
            <a
              href={siteConfig.links.contactSales}
              className="inline-flex items-center gap-2 rounded-full border border-white/20 px-8 py-3.5 text-sm font-medium text-white/80 hover:bg-white/5 hover:border-white/30 transition-all duration-200"
            >
              Contact sales
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}