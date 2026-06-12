"use client";

import { useState, useEffect } from "react";
import { LogOut, Menu, UserCircle, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { navLinks, siteConfig } from "@/lib/constants";
import Image from "next/image";
import Link from "next/link";

type HeaderUser = {
  email: string;
};

export default function Header({
  initialUser,
}: {
  initialUser: HeaderUser | null;
}) {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [clientUser, setClientUser] = useState<HeaderUser | null | undefined>(
    undefined
  );
  const user = clientUser ?? initialUser;

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        setClientUser(data?.user ?? null);
      })
      .catch(() => setClientUser(null));
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setClientUser(null);
    setMobileOpen(false);
    setProfileOpen(false);
    router.push("/");
    router.refresh();
  }

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
            {user ? (
              <>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setProfileOpen((open) => !open)}
                    className="inline-flex items-center gap-2 text-sm font-medium text-brand-warm-dark/80 hover:text-brand-charcoal transition-colors px-4 py-2"
                    aria-expanded={profileOpen}
                    aria-haspopup="dialog"
                  >
                    <UserCircle size={17} />
                    Perfil
                  </button>
                  {profileOpen && (
                    <div className="absolute right-0 mt-3 w-80 rounded-2xl border border-brand-beige-dark/30 bg-white/95 p-5 text-left shadow-xl backdrop-blur-xl">
                      <div className="flex items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-beige text-brand-near-black">
                          <UserCircle size={24} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-brand-near-black">
                            Perfil de cuenta
                          </p>
                          <p className="mt-1 break-all text-sm text-brand-gray">
                            {user.email}
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 space-y-3 rounded-xl bg-brand-beige-light/70 p-4">
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-xs font-medium uppercase tracking-widest text-brand-gray">
                            Estado
                          </span>
                          <span className="text-sm font-medium text-brand-near-black">
                            Activo
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-xs font-medium uppercase tracking-widest text-brand-gray">
                            Acceso
                          </span>
                          <span className="text-sm font-medium text-brand-near-black">
                            Panel ITERA
                          </span>
                        </div>
                      </div>

                      <Link
                        href={siteConfig.links.dashboard}
                        onClick={() => setProfileOpen(false)}
                        className="mt-5 flex w-full items-center justify-center rounded-full bg-brand-near-black px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-black"
                      >
                        Ir al dashboard
                      </Link>
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex items-center gap-2 text-sm font-medium text-white bg-brand-near-black hover:bg-black rounded-full px-5 py-2.5 transition-all duration-200"
                >
                  <LogOut size={16} />
                  Salir
                </button>
              </>
            ) : (
              <>
                <Link
                  href={siteConfig.links.signIn}
                  className="text-sm font-medium text-brand-warm-dark/80 hover:text-brand-charcoal transition-colors px-4 py-2"
                >
                  Iniciar sesión
                </Link>
                <Link
                  href={siteConfig.links.signUp}
                  className="text-sm font-medium text-white bg-brand-near-black hover:bg-black rounded-full px-5 py-2.5 transition-all duration-200"
                >
                  Comenzar
                </Link>
              </>
            )}
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
            {user ? (
              <>
                <div className="rounded-2xl border border-brand-beige-dark/20 bg-brand-beige-light/60 p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-beige text-brand-near-black">
                      <UserCircle size={22} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-brand-near-black">
                        Perfil de cuenta
                      </p>
                      <p className="mt-1 break-all text-sm text-brand-gray">
                        {user.email}
                      </p>
                      <p className="mt-2 text-xs font-medium uppercase tracking-widest text-brand-gray">
                        Estado activo
                      </p>
                    </div>
                  </div>
                </div>
                <Link
                  href={siteConfig.links.dashboard}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 text-base font-medium text-brand-warm-dark py-2"
                >
                  <UserCircle size={18} />
                  Ir al dashboard
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center justify-center gap-2 text-base font-medium text-white bg-brand-near-black hover:bg-black rounded-full px-5 py-3 transition-all"
                >
                  <LogOut size={18} />
                  Salir
                </button>
              </>
            ) : (
              <>
                <Link
                  href={siteConfig.links.signIn}
                  onClick={() => setMobileOpen(false)}
                  className="block text-base font-medium text-brand-warm-dark py-2"
                >
                  Iniciar sesión
                </Link>
                <Link
                  href={siteConfig.links.signUp}
                  onClick={() => setMobileOpen(false)}
                  className="block text-center text-base font-medium text-white bg-brand-near-black hover:bg-black rounded-full px-5 py-3 transition-all"
                >
                  Comenzar
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}