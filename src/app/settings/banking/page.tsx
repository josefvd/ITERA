"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Building2, CreditCard, Plus, Trash2 } from "lucide-react";

interface BankAccount {
  id: string;
  accountType: string;
  bankName: string | null;
  accountNumber: string | null;
  routingNumber: string | null;
  isVerified: boolean;
}

export default function BankingPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    accountType: "checking",
    bankName: "",
    accountNumber: "",
    routingNumber: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/transactions")
      .then((res) => {
        if (res.status === 401) {
          router.push("/signin");
          return null;
        }
        setLoading(false);
        return null;
      })
      .catch(() => {
        setError("Error al cargar información bancaria");
        setLoading(false);
      });
  }, [router]);

  async function handleAddAccount(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);

    const newAccount: BankAccount = {
      id: crypto.randomUUID(),
      accountType: form.accountType,
      bankName: form.bankName || null,
      accountNumber: form.accountNumber
        ? `****${form.accountNumber.slice(-4)}`
        : null,
      routingNumber: form.routingNumber || null,
      isVerified: false,
    };

    setAccounts((prev) => [...prev, newAccount]);
    setShowForm(false);
    setForm({ accountType: "checking", bankName: "", accountNumber: "", routingNumber: "" });
    setSaving(false);
  }

  const updateField = (field: string) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <div className="text-brand-gray text-lg">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="mx-auto max-w-3xl px-6 lg:px-8">
        {/* Back link */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-gray hover:text-brand-charcoal mb-6 transition-colors"
        >
          <ArrowLeft size={14} />
          Volver al dashboard
        </Link>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-brand-near-black">
              Configuración bancaria
            </h1>
            <p className="text-brand-gray mt-1">
              Gestiona tus cuentas bancarias y métodos de pago
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 rounded-xl bg-brand-near-black text-white px-5 py-2.5 font-medium hover:bg-black transition-all text-sm"
          >
            <Plus size={16} />
            Agregar cuenta
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {/* Add account form */}
        {showForm && (
          <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-brand-beige-dark/20 p-6 mb-6 shadow-sm">
            <h2 className="text-lg font-semibold text-brand-near-black mb-4">
              Agregar cuenta bancaria
            </h2>
            <form onSubmit={handleAddAccount} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-brand-warm-dark mb-1.5">
                  Tipo de cuenta
                </label>
                <select
                  value={form.accountType}
                  onChange={updateField("accountType")}
                  className="w-full rounded-xl border border-brand-beige-dark/30 bg-white px-4 py-2.5 text-brand-charcoal focus:outline-none focus:ring-2 focus:ring-brand-near-black/20"
                >
                  <option value="checking">Corriente</option>
                  <option value="prepaid">Tarjeta prepago</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-brand-warm-dark mb-1.5">
                  Nombre del banco
                </label>
                <input
                  type="text"
                  value={form.bankName}
                  onChange={updateField("bankName")}
                  className="w-full rounded-xl border border-brand-beige-dark/30 bg-white px-4 py-2.5 text-brand-charcoal placeholder:text-brand-taupe focus:outline-none focus:ring-2 focus:ring-brand-near-black/20"
                  placeholder="Banco Pichincha, Produbanco, etc."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-brand-warm-dark mb-1.5">
                    Número de cuenta
                  </label>
                  <input
                    type="text"
                    value={form.accountNumber}
                    onChange={updateField("accountNumber")}
                    className="w-full rounded-xl border border-brand-beige-dark/30 bg-white px-4 py-2.5 text-brand-charcoal placeholder:text-brand-taupe focus:outline-none focus:ring-2 focus:ring-brand-near-black/20"
                    placeholder="000123456789"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-brand-warm-dark mb-1.5">
                    Número de ruta
                  </label>
                  <input
                    type="text"
                    value={form.routingNumber}
                    onChange={updateField("routingNumber")}
                    className="w-full rounded-xl border border-brand-beige-dark/30 bg-white px-4 py-2.5 text-brand-charcoal placeholder:text-brand-taupe focus:outline-none focus:ring-2 focus:ring-brand-near-black/20"
                    placeholder="021000021"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 rounded-xl bg-brand-near-black text-white px-5 py-2.5 font-medium hover:bg-black transition-all text-sm disabled:opacity-50"
                >
                  {saving ? "Guardando..." : "Guardar cuenta"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded-xl border border-brand-beige-dark/30 px-5 py-2.5 text-brand-gray font-medium hover:text-brand-charcoal transition-all text-sm"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Account list */}
        {accounts.length === 0 && !showForm ? (
          <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-brand-beige-dark/20 shadow-sm">
            <div className="px-6 py-20 text-center">
              <div className="rounded-full bg-brand-beige w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Building2 size={28} className="text-brand-near-black" />
              </div>
              <h3 className="text-lg font-semibold text-brand-near-black mb-2">
                Sin cuentas bancarias vinculadas
              </h3>
              <p className="text-brand-gray mb-6 max-w-md mx-auto">
                Agrega una cuenta bancaria o tarjeta prepago para comenzar a hacer pagos.
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-brand-near-black text-white px-6 py-2.5 font-medium hover:bg-black transition-all text-sm"
              >
                <Plus size={16} />
                Agregar cuenta bancaria
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {accounts.map((account) => (
              <div
                key={account.id}
                className="bg-white/60 backdrop-blur-xl rounded-2xl border border-brand-beige-dark/20 p-6 shadow-sm flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="rounded-xl bg-brand-beige p-3">
                    {account.accountType === "prepaid" ? (
                      <CreditCard size={20} className="text-brand-near-black" />
                    ) : (
                      <Building2 size={20} className="text-brand-near-black" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-brand-charcoal capitalize">
                      {account.accountType === "prepaid" ? "Prepago" : "Corriente"}
                    </p>
                    <p className="text-sm text-brand-gray">
                      {account.bankName || "Banco"}
                      {account.accountNumber
                        ? ` • ${account.accountNumber}`
                        : ""}
                    </p>
                    <span
                      className={`text-xs font-medium mt-1 inline-block ${
                        account.isVerified
                          ? "text-green-600"
                          : "text-yellow-600"
                      }`}
                    >
                      {account.isVerified ? "Verificada" : "Pendiente de verificación"}
                    </span>
                  </div>
                </div>
                <button
                  className="p-2 text-brand-gray hover:text-red-500 transition-colors"
                  aria-label="Eliminar cuenta"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}