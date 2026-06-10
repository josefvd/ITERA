"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { siteConfig } from "@/lib/constants";
import { UserPlus } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    company: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    if (form.password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          company: form.company || undefined,
          phone: form.phone || undefined,
          password: form.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registro fallido");
        return;
      }

      router.push("/dashboard");
    } catch {
      setError("Algo salió mal. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  const updateField = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20">
      <div className="w-full max-w-md">
        <div className="bg-white/60 backdrop-blur-xl rounded-2xl shadow-xl border border-brand-beige-dark/20 p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-brand-near-black">
              Crear cuenta
            </h1>
            <p className="text-brand-gray mt-2">
              Únete a {siteConfig.name} y optimiza tus pagos de flete
            </p>
          </div>

          {error && (
            <div className="mb-6 rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-brand-warm-dark mb-1.5">
                Nombre *
              </label>
              <input
                id="name"
                type="text"
                required
                value={form.name}
                onChange={updateField("name")}
                className="w-full rounded-xl border border-brand-beige-dark/30 bg-white px-4 py-2.5 text-brand-charcoal placeholder:text-brand-taupe focus:outline-none focus:ring-2 focus:ring-brand-near-black/20 focus:border-brand-near-black transition-all"
                placeholder="John Smith"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-brand-warm-dark mb-1.5">
                Correo electrónico *
              </label>
              <input
                id="email"
                type="email"
                required
                value={form.email}
                onChange={updateField("email")}
                className="w-full rounded-xl border border-brand-beige-dark/30 bg-white px-4 py-2.5 text-brand-charcoal placeholder:text-brand-taupe focus:outline-none focus:ring-2 focus:ring-brand-near-black/20 focus:border-brand-near-black transition-all"
                placeholder="correo@empresa.com"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="company" className="block text-sm font-medium text-brand-warm-dark mb-1.5">
                  Empresa
                </label>
                <input
                  id="company"
                  type="text"
                  value={form.company}
                  onChange={updateField("company")}
                  className="w-full rounded-xl border border-brand-beige-dark/30 bg-white px-4 py-2.5 text-brand-charcoal placeholder:text-brand-taupe focus:outline-none focus:ring-2 focus:ring-brand-near-black/20 focus:border-brand-near-black transition-all"
                  placeholder="Acme Logistics"
                />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-brand-warm-dark mb-1.5">
                  Teléfono
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={form.phone}
                  onChange={updateField("phone")}
                  className="w-full rounded-xl border border-brand-beige-dark/30 bg-white px-4 py-2.5 text-brand-charcoal placeholder:text-brand-taupe focus:outline-none focus:ring-2 focus:ring-brand-near-black/20 focus:border-brand-near-black transition-all"
                  placeholder="+1 (555) 000-0000"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-brand-warm-dark mb-1.5">
                Contraseña *
              </label>
              <input
                id="password"
                type="password"
                required
                value={form.password}
                onChange={updateField("password")}
                className="w-full rounded-xl border border-brand-beige-dark/30 bg-white px-4 py-2.5 text-brand-charcoal placeholder:text-brand-taupe focus:outline-none focus:ring-2 focus:ring-brand-near-black/20 focus:border-brand-near-black transition-all"
                placeholder="Mín. 6 caracteres"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-brand-warm-dark mb-1.5">
                Confirmar contraseña *
              </label>
              <input
                id="confirmPassword"
                type="password"
                required
                value={form.confirmPassword}
                onChange={updateField("confirmPassword")}
                className="w-full rounded-xl border border-brand-beige-dark/30 bg-white px-4 py-2.5 text-brand-charcoal placeholder:text-brand-taupe focus:outline-none focus:ring-2 focus:ring-brand-near-black/20 focus:border-brand-near-black transition-all"
                placeholder="Repite tu contraseña"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-brand-near-black text-white py-2.5 font-medium hover:bg-black transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                "Creando cuenta..."
              ) : (
                <>
                  Crear cuenta <UserPlus size={16} />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-brand-gray mt-6">
            ¿Ya tienes cuenta?{" "}
            <Link
              href="/signin"
              className="text-brand-near-black font-medium hover:underline"
            >
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}