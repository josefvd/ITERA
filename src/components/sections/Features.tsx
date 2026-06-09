"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Bolt, BarChart3, Globe, ShieldCheck, Network } from "lucide-react";
import { siteConfig } from "@/lib/constants";

const featureIcons = [Bolt, BarChart3, Network, Globe, ShieldCheck];

export default function Features() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="features" ref={ref} className="relative bg-brand-beige-light/30 py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="max-w-xl mb-16"
        >
          <span className="text-xs font-semibold uppercase tracking-widest text-brand-gray">
            Why {siteConfig.name}
          </span>
          <h2 className="mt-4 text-3xl sm:text-4xl font-semibold tracking-tight text-brand-charcoal">
            Solutions built on results
          </h2>
          <p className="mt-4 text-base text-brand-gray leading-relaxed">
            Technology, trust, and trade expertise combined to remove friction and keep
            supply chains moving.
          </p>
        </motion.div>

        {/* Features grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {siteConfig.features.map((feature, i) => {
            const Icon = featureIcons[i % featureIcons.length];
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.08 * i, ease: "easeOut" }}
                className="group"
              >
                <div className="h-10 w-10 rounded-lg bg-brand-charcoal/5 flex items-center justify-center mb-4 group-hover:bg-brand-charcoal/10 transition-colors">
                  <Icon size={20} className="text-brand-warm-dark" />
                </div>
                <h3 className="text-lg font-semibold text-brand-charcoal mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-brand-gray leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}