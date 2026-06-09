"use client";

import { useEffect, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { ArrowRight, Search } from "lucide-react";
import { siteConfig } from "@/lib/constants";

export default function Hero() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section
      ref={ref}
      className="relative min-h-screen flex items-center overflow-hidden"
    >
      {/* Background with subtle grain */}
      <div className="absolute inset-0 bg-gradient-to-b from-brand-beige via-brand-beige to-brand-beige-dark/20" />
      <div className="noise-overlay" />

      {/* Decorative gradient blob */}
      <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-brand-beige-dark/10 blur-3xl" />
      <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-brand-light/10 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8 py-32 md:py-40 w-full">
        <div className="max-w-3xl">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="mb-6"
          >
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-charcoal/5 px-4 py-1.5 text-xs font-medium text-brand-warm-dark">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-gray" />
              Powered by intelligent payments
            </span>
          </motion.div>

          {/* Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
            className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-semibold tracking-tight leading-[1.05] text-brand-charcoal"
          >
            {siteConfig.tagline.split("for")[0]}
            <span className="text-brand-gray block mt-2">for global logistics</span>
          </motion.h1>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, ease: "easeOut", delay: 0.25 }}
            className="mt-8 text-lg sm:text-xl leading-relaxed text-brand-gray max-w-xl"
          >
            {siteConfig.description}
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, ease: "easeOut", delay: 0.35 }}
            className="mt-10 flex flex-col sm:flex-row gap-4"
          >
            <a
              href={siteConfig.links.signUp}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-near-black px-8 py-3.5 text-sm font-medium text-white hover:bg-black transition-all duration-200 group"
            >
              Get started
              <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
            </a>
            <a
              href={siteConfig.links.findVendor}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-brand-light/50 px-8 py-3.5 text-sm font-medium text-brand-warm-dark hover:bg-brand-charcoal/5 hover:border-brand-light transition-all duration-200"
            >
              <Search size={16} />
              Find a vendor
            </a>
          </motion.div>
        </div>

        {/* Subtle scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 1 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <span className="text-xs text-brand-taupe tracking-widest uppercase">Scroll</span>
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="w-px h-8 bg-brand-light/50"
          />
        </motion.div>
      </div>
    </section>
  );
}