"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { ArrowUpRight, Zap, CreditCard, Truck } from "lucide-react";
import { siteConfig } from "@/lib/constants";

const productIcons = [Zap, CreditCard, Truck];

export default function Products() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="products" ref={ref} className="relative bg-brand-beige py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="max-w-xl mb-16"
        >
          <span className="text-xs font-semibold uppercase tracking-widest text-brand-gray">
            Productos
          </span>
          <h2 className="mt-4 text-3xl sm:text-4xl font-semibold tracking-tight text-brand-charcoal">
            Todo lo que necesitas para mover dinero y carga
          </h2>
          <p className="mt-4 text-base text-brand-gray leading-relaxed">
            Desde pagos y créditos hasta soluciones de recogida — elimina fricción,
            acelera la liberación de carga y mantén tus cadenas de suministro en movimiento.
          </p>
        </motion.div>

        {/* Product cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {siteConfig.products.map((product, i) => {
            const Icon = productIcons[i];
            return (
              <motion.div
                key={product.title}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.1 * i, ease: "easeOut" }}
                className="group relative bg-white/70 backdrop-blur-sm rounded-2xl p-8 border border-brand-beige-dark/20 hover:border-brand-beige-dark/40 hover:bg-white/90 transition-all duration-300 hover:-translate-y-1"
              >
                <div className="h-12 w-12 rounded-xl bg-brand-charcoal/5 flex items-center justify-center mb-6 group-hover:bg-brand-charcoal/10 transition-colors">
                  <Icon size={24} className="text-brand-warm-dark" />
                </div>
                <h3 className="text-xl font-semibold text-brand-charcoal mb-3">
                  {product.title}
                </h3>
                <p className="text-sm text-brand-gray leading-relaxed mb-6">
                  {product.description}
                </p>
                <a
                  href={product.href}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-warm-dark hover:text-brand-charcoal transition-colors group/link"
                >
                  Más información
                  <ArrowUpRight
                    size={14}
                    className="group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform"
                  />
                </a>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}