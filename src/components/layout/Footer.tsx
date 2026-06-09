import { siteConfig, navLinks } from "@/lib/constants";

export default function Footer() {
  return (
    <footer className="bg-brand-beige border-t border-brand-beige-dark/30">
      <div className="mx-auto max-w-7xl px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <a href="/" className="flex items-center gap-2 mb-4">
              <div className="h-7 w-7 rounded-full bg-brand-near-black flex items-center justify-center">
                <span className="text-brand-beige text-xs font-semibold">F</span>
              </div>
              <span className="text-base font-semibold tracking-tight text-brand-charcoal">
                {siteConfig.name}
              </span>
            </a>
            <p className="text-sm text-brand-gray leading-relaxed max-w-xs">
              Smarter payments for global logistics. One ecosystem accelerating global trade.
            </p>
          </div>

          {/* Products */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-brand-warm-dark mb-4">
              Products
            </h4>
            <ul className="space-y-3">
              {["Payments", "AP Automation", "Container Portal"].map((item) => (
                <li key={item}>
                  <a href="#" className="text-sm text-brand-gray hover:text-brand-charcoal transition-colors">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-brand-warm-dark mb-4">
              Company
            </h4>
            <ul className="space-y-3">
              {["About", "Blog", "Careers", "Contact"].map((item) => (
                <li key={item}>
                  <a href="#" className="text-sm text-brand-gray hover:text-brand-charcoal transition-colors">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-brand-warm-dark mb-4">
              Resources
            </h4>
            <ul className="space-y-3">
              {["Help Center", "Documentation", "API Reference", "Status"].map((item) => (
                <li key={item}>
                  <a href="#" className="text-sm text-brand-gray hover:text-brand-charcoal transition-colors">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-brand-beige-dark/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-brand-gray">
            &copy; {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
          </p>
          <div className="flex gap-6">
            {["Privacy", "Terms", "Cookies"].map((item) => (
              <a key={item} href="#" className="text-xs text-brand-gray hover:text-brand-charcoal transition-colors">
                {item}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}