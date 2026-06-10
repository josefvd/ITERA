"use client";

import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { navLinks, siteConfig } from "@/lib/constants";
import Image from "next/image";
import Link from "next/link";

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-white/80 backdrop-blur-xl shadow-sm border-b border-brand-beige-dark/20"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/images/logo-source.jpg"
              alt="ITERA"
              width={36}
              height={36}
              className="rounded-full object-cover w-9 h-9"
            />
            <span className="text-lg font-semibold tracking-tight text-brand-charcoal">
              {siteConfig.name}
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-sm font-medium text-brand-warm-dark/80 hover:text-brand-charcoal transition-colors duration-200"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href={siteConfig.links.signIn}
              className="text-sm font-medium text-brand-warm-dark/80 hover:text-brand-charcoal transition-colors px-4 py-2"
            >
              Iniciar Sesión
            </Link>
            <Link
              href={siteConfig.links.signUp}
              className="text-sm font-medium text-white bg-brand-near-black hover:bg-black rounded-full px-5 py-2.5 transition-all duration-200"
            >
              Comenzar
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 text-brand-charcoal"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-brand-beige-dark/20 backdrop-blur-xl">
          <div className="px-6 py-6 space-y-4">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="block text-base font-medium text-brand-warm-dark hover:text-brand-charcoal py-2"
              >
                {link.label}
              </Link>
            ))}
            <hr className="border-brand-beige-dark/20" />
            <Link
              href={siteConfig.links.signIn}
              onClick={() => setMobileOpen(false)}
              className="block text-base font-medium text-brand-warm-dark py-2"
            >
              Iniciar Sesión
            </Link>
            <Link
              href={siteConfig.links.signUp}
              onClick={() => setMobileOpen(false)}
              className="block text-center text-base font-medium text-white bg-brand-near-black hover:bg-black rounded-full px-5 py-3 transition-all"
            >
              Comenzar
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}