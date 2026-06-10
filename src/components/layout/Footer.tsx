import { siteConfig } from "@/lib/constants";
import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-brand-beige border-t border-brand-beige-dark/30">
      <div className="mx-auto max-w-7xl px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <Image
                src="/images/logo-source.jpg"
                alt="ITERA"
                width={28}
                height={28}
                className="rounded-full object-cover w-7 h-7"
              />
              <span className="text-base font-semibold tracking-tight text-brand-charcoal">
                {siteConfig.name}
              </span>
            </Link>
            <p className="text-sm text-brand-gray leading-relaxed max-w-xs">
              Pagos más inteligentes para la logística global. Un ecosistema que acelera el comercio global.
            </p>
          </div>

          {/* Products */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-brand-warm-dark mb-4">
              Productos
            </h4>
            <ul className="space-y-3">
              {["Payments", "Access Credits", "Access Pickup Solution"].map((item) => (
                <li key={item}>
                  <Link href="#" className="text-sm text-brand-gray hover:text-brand-charcoal transition-colors">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-brand-warm-dark mb-4">
              Compañía
            </h4>
            <ul className="space-y-3">
              {["Sobre ITERA", "Blog", "Carreras", "Contacto"].map((item) => (
                <li key={item}>
                  <Link href="#" className="text-sm text-brand-gray hover:text-brand-charcoal transition-colors">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-brand-warm-dark mb-4">
              Recursos
            </h4>
            <ul className="space-y-3">
              {["Centro de ayuda", "Documentación", "API", "Estado"].map((item) => (
                <li key={item}>
                  <Link href="#" className="text-sm text-brand-gray hover:text-brand-charcoal transition-colors">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-brand-beige-dark/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-brand-gray">
            &copy; {new Date().getFullYear()} {siteConfig.name}. Todos los derechos reservados.
          </p>
          <div className="flex gap-6">
            {["Privacidad", "Términos", "Cookies"].map((item) => (
              <Link key={item} href="#" className="text-xs text-brand-gray hover:text-brand-charcoal transition-colors">
                {item}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}