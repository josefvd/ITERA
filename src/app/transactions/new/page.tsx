"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Send } from "lucide-react";
import Link from "next/link";

export default function NewTransactionPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    vendorName: "",
    vendorEmail: "",
    amount: "",
    description: "",
    paymentMethod: "ach",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (!form.vendorName || !form.amount || parseFloat(form.amount) <= 0) {
      setError("El nombre del proveedor y un monto válido son obligatorios");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendorName: form.vendorName,
          vendorEmail: form.vendorEmail || undefined,
          amount: form.amount,
          description: form.description || undefined,
          paymentMethod: form.paymentMethod,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Error al crear la transacción");
        return;
      }

      router.push("/transactions");
    } catch {
      setError("Algo salió mal. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  const updateField = (field: string) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const paymentMethods = [
    { value: "ach", label: "ACH" },
    { value: "wire", label: "Transferencia" },
    { value: "prepaid", label: "Prepago" },
  ];

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="mx-auto max-w-2xl px-6 lg:px-8">
        {/* Back link */}
        <Link
          href="/transactions"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-gray hover:text-brand-charcoal mb-6 transition-colors"
        >
          <ArrowLeft size={14} />
          Volver a transacciones
        </Link>

        <div className="bg-white/60 backdrop-blur-xl rounded-2xl shadow-xl border border-brand-beige-dark/20 p-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-brand-near-black">
              Nuevo pago
            </h1>
            <p className="text-brand-gray mt-1">
              Envía un pago a un proveedor o prestador de servicios
            </p>
          </div>

          {error && (
            <div className="mb-6 rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label
                  htmlFor="vendorName"
                  className="block text-sm font-medium text-brand-warm-dark mb-1.5"
                >
                  Vendor name *
                </label>
                <input
                  id="vendorName"
                  type="text"
                  required
                  value={form.vendorName}
                  onChange={updateField("vendorName")}
                  className="w-full rounded-xl border border-brand-beige-dark/30 bg-white px-4 py-2.5 text-brand-charcoal placeholder:text-brand-taupe focus:outline-none focus:ring-2 focus:ring-brand-near-black/20 focus:border-brand-near-black transition-all"
                  placeholder="Acme Logistics Inc."
                />
              </div>

              <div>
                <label
                  htmlFor="vendorEmail"
                  className="block text-sm font-medium text-brand-warm-dark mb-1.5"
                >
                  Correo del proveedor
                </label>
                <input
                  id="vendorEmail"
                  type="email"
                  value={form.vendorEmail}
                  onChange={updateField("vendorEmail")}
                  className="w-full rounded-xl border border-brand-beige-dark/30 bg-white px-4 py-2.5 text-brand-charcoal placeholder:text-brand-taupe focus:outline-none focus:ring-2 focus:ring-brand-near-black/20 focus:border-brand-near-black transition-all"
                  placeholder="billing@acme.com"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="amount"
                className="block text-sm font-medium text-brand-warm-dark mb-1.5"
              >
                Monto *
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-gray font-medium">
                  $
                </span>
                <input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={form.amount}
                  onChange={updateField("amount")}
                  className="w-full rounded-xl border border-brand-beige-dark/30 bg-white pl-8 pr-4 py-2.5 text-brand-charcoal placeholder:text-brand-taupe focus:outline-none focus:ring-2 focus:ring-brand-near-black/20 focus:border-brand-near-black transition-all"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="paymentMethod"
                className="block text-sm font-medium text-brand-warm-dark mb-1.5"
              >
                Método de pago
              </label>
              <select
                id="paymentMethod"
                value={form.paymentMethod}
                onChange={updateField("paymentMethod")}
                className="w-full rounded-xl border border-brand-beige-dark/30 bg-white px-4 py-2.5 text-brand-charcoal focus:outline-none focus:ring-2 focus:ring-brand-near-black/20 focus:border-brand-near-black transition-all"
              >
                {paymentMethods.map((pm) => (
                  <option key={pm.value} value={pm.value}>
                    {pm.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-brand-warm-dark mb-1.5"
              >
                Descripción
              </label>
              <textarea
                id="description"
                rows={3}
                value={form.description}
                onChange={updateField("description")}
                className="w-full rounded-xl border border-brand-beige-dark/30 bg-white px-4 py-2.5 text-brand-charcoal placeholder:text-brand-taupe focus:outline-none focus:ring-2 focus:ring-brand-near-black/20 focus:border-brand-near-black transition-all resize-none"
                placeholder="Invoice #12345 — Freight transport services"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-brand-near-black text-white py-3 font-medium hover:bg-black transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                "Procesando..."
              ) : (
                <>
                  Enviar pago <Send size={16} />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}