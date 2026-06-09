"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { siteConfig } from "@/lib/constants";

function AnimatedCounter({ value, suffix = "" }: { value: string; suffix?: string }) {
  return (
    <span className="text-4xl sm:text-5xl font-semibold tracking-tight text-brand-charcoal">
      {value}
      {suffix}
    </span>
  );
}

export default function StatsBar() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  const stats = [
    {
      value: siteConfig.stats.businesses,
      label: siteConfig.stats.businessesLabel.split(" ").slice(0, -1).join(" "),
      sublabel: siteConfig.stats.businessesLabel.split(" ").slice(-1)[0],
    },
    {
      value: siteConfig.stats.processed,
      label: siteConfig.stats.processedLabel.split("since")[0].trim(),
      sublabel: "since 2021",
    },
    {
      value: siteConfig.stats.vendors,
      label: siteConfig.stats.vendorsLabel.split(" ").slice(0, -1).join(" "),
      sublabel: siteConfig.stats.vendorsLabel.split(" ").slice(-1)[0],
    },
  ];

  return (
    <section ref={ref} className="relative bg-brand-beige-light/50 border-y border-brand-beige-dark/20">
      <div className="mx-auto max-w-7xl px-6 lg:px-8 py-16 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.value}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.15, ease: "easeOut" }}
              className="text-center md:text-left"
            >
              <AnimatedCounter value={stat.value} />
              <p className="mt-2 text-sm text-brand-gray leading-relaxed">
                {stat.label}
                <br />
                <span className="text-brand-warm-dark font-medium">{stat.sublabel}</span>
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}