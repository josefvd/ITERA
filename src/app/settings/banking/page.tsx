"use client";

import { useState, useEffect, FormEvent, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Building2, CreditCard, Plus, Trash2, CheckCircle2 } from "lucide-react";

interface PaymentMethod {
  id: string;
  type: string;
  provider: string;
  cardLast4: string | null;
  cardBrand: string | null;
  cardExpiry: string | null;
  isDefault: boolean;
}

interface BankAccount {
  id: string;
  accountType: string;
  bankName: string | null;
  accountNumber: string | null;
  routingNumber: string | null;
  isVerified: boolean;
}

const EL_SALVADOR_BANKS = [
  "Banco Agrícola",
  "Banco Cuscatlán",
  "Banco G&T Continental",
  "Banco Promerica",
  "Banco Davivienda",
  "BAC Credomatic",
  "Banco de Fomento Agropecuario",
  "Banco Hipotecario",
  "Banco Azul",
  "Cuscatlán TBI",
];

export default function BankingPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Card form
  const [showCardForm, setShowCardForm] = useState(false);
  const [cardForm, setCardForm] = useState({
    cardNumber: "",
    cardHolder: "",
    expiry: "",
    cvc: "",
    makeDefault: false,
  });

  // Bank form
  const [showBankForm, setShowBankForm] = useState(false);
  const [bankForm, setBankForm] = useState({
    bankName: EL_SALVADOR_BANKS[0],
    accountNumber: "",
    routingNumber: "",
    accountHolder: "",
    accountType: "checking",
  });

  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [accRes, methRes] = await Promise.all([
        fetch("/api/bank-accounts"),
        fetch("/api/payment-methods"),
      ]);
      if (accRes.status === 401 || methRes.status === 401) {
        router.push("/signin");
        return;
      }
      const accData = await accRes.json();
      const methData = await methRes.json();
      if (accData.error) setError(accData.error);
      else setAccounts(accData.accounts || []);
      if (!methData.error) setMethods(methData.methods || []);
    } catch {
      setError("Error al cargar información bancaria");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleAddCard(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const res = await fetch("/api/payment-methods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cardForm),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setMethods((prev) => [...prev, data.method]);
        setShowCardForm(false);
        setCardForm({ cardNumber: "", cardHolder: "", expiry: "", cvc: "", makeDefault: false });
      }
    } catch {
      setError("Error al guardar tarjeta");
    } finally {
      setSaving(false);
    }
  }

  async function handleRemoveCard(id: string) {
    setError("");
    try {
      const res = await fetch(`/api/payment-methods/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.error) setError(data.error);
      else setMethods((prev) => prev.filter((m) => m.id !== id));
    } catch {
      setError("Error al eliminar tarjeta");
    }
  }

  async function handleAddBank(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const res = await fetch("/api/bank-accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bankForm),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setAccounts((prev) => [...prev, data.account]);
        setShowBankForm(false);
        setBankForm({
          bankName: EL_SALVADOR_BANKS[0],
          accountNumber: "",
          routingNumber: "",
          accountHolder: "",
          accountType: "checking",
        });
      }
    } catch {
      setError("Error al vincular cuenta bancaria");
    } finally {
      setSaving(false);
    }
  }

  async function handleRemoveBank(id: string) {
    setError("");
    try {
      const res = await fetch(`/api/bank-accounts/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.error) setError(data.error);
      else setAccounts((prev) => prev.filter((a) => a.id !== id));
    } catch {
      setError("Error al eliminar cuenta");
    }
  }

  const updateCard = (field: string) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => setCardForm((prev) => ({ ...prev, [field]: e.target.value }));

  const updateBank = (field: string) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => setBankForm((prev) => ({ ...prev, [field]: e.target.value }));

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
              Gestiona tus tarjetas y cuentas bancarias de El Salvador
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {/* ===== TARJETAS ===== */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-brand-near-black flex items-center gap-2">
              <CreditCard size={20} /> Tarjetas de débito y crédito
            </h2>
            <button
              onClick={() => setShowCardForm(!showCardForm)}
              className="flex items-center gap-2 rounded-xl bg-brand-near-black text-white px-4 py-2 font-medium hover:bg-black transition-all text-sm"
            >
              <Plus size={16} /> Agregar tarjeta
            </button>
          </div>

          {showCardForm && (
            <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-brand-beige-dark/20 p-6 mb-4 shadow-sm">
              <h3 className="text-lg font-semibold text-brand-near-black mb-4">
                Nueva tarjeta
              </h3>
              <form onSubmit={handleAddCard} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-brand-warm-dark mb-1.5">
                    Número de tarjeta
                  </label>
                  <input
                    type="text"
                    value={cardForm.cardNumber}
                    onChange={updateCard("cardNumber")}
                    placeholder="4242 4242 4242 4242"
                    className="w-full rounded-xl border border-brand-beige-dark/30 bg-white px-4 py-2.5 text-brand-charcoal placeholder:text-brand-taupe focus:outline-none focus:ring-2 focus:ring-brand-near-black/20"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-brand-warm-dark mb-1.5">
                    Titular
                  </label>
                  <input
                    type="text"
                    value={cardForm.cardHolder}
                    onChange={updateCard("cardHolder")}
                    placeholder="Nombre en la tarjeta"
                    className="w-full rounded-xl border border-brand-beige-dark/30 bg-white px-4 py-2.5 text-brand-charcoal placeholder:text-brand-taupe focus:outline-none focus:ring-2 focus:ring-brand-near-black/20"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-brand-warm-dark mb-1.5">
                      Vencimiento (MM/AA)
                    </label>
                    <input
                      type="text"
                      value={cardForm.expiry}
                      onChange={updateCard("expiry")}
                      placeholder="12/27"
                      className="w-full rounded-xl border border-brand-beige-dark/30 bg-white px-4 py-2.5 text-brand-charcoal placeholder:text-brand-taupe focus:outline-none focus:ring-2 focus:ring-brand-near-black/20"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-brand-warm-dark mb-1.5">
                      CVC
                    </label>
                    <input
                      type="text"
                      value={cardForm.cvc}
                      onChange={updateCard("cvc")}
                      placeholder="123"
                      className="w-full rounded-xl border border-brand-beige-dark/30 bg-white px-4 py-2.5 text-brand-charcoal placeholder:text-brand-taupe focus:outline-none focus:ring-2 focus:ring-brand-near-black/20"
                      required
                    />
                  </div>
                </div>
                <label className="flex items-center gap-2 text-sm text-brand-warm-dark">
                  <input
                    type="checkbox"
                    checked={cardForm.makeDefault}
                    onChange={(e) => setCardForm((p) => ({ ...p, makeDefault: e.target.checked }))}
                    className="rounded border-brand-beige-dark/30"
                  />
                  Establecer como método de pago predeterminado
                </label>
                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-2 rounded-xl bg-brand-near-black text-white px-5 py-2.5 font-medium hover:bg-black transition-all text-sm disabled:opacity-50"
                  >
                    {saving ? "Guardando..." : "Guardar tarjeta"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCardForm(false)}
                    className="rounded-xl border border-brand-beige-dark/30 px-5 py-2.5 text-brand-gray font-medium hover:text-brand-charcoal transition-all text-sm"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          )}

          {methods.length === 0 && !showCardForm ? (
            <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-brand-beige-dark/20 p-6 text-center text-brand-gray text-sm">
              No hay tarjetas agregadas.
            </div>
          ) : (
            <div className="space-y-3">
              {methods.map((m) => (
                <div
                  key={m.id}
                  className="bg-white/60 backdrop-blur-xl rounded-2xl border border-brand-beige-dark/20 p-4 shadow-sm flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-brand-beige p-2.5">
                      <CreditCard size={18} className="text-brand-near-black" />
                    </div>
                    <div>
                      <p className="font-semibold text-brand-charcoal text-sm">
                        {m.cardBrand || "Tarjeta"} •••• {m.cardLast4}
                        {m.isDefault && (
                          <span className="ml-2 text-xs font-medium text-green-600">Predeterminada</span>
                        )}
                      </p>
                      <p className="text-xs text-brand-gray">Vence {m.cardExpiry || "—"}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveCard(m.id)}
                    className="p-2 text-brand-gray hover:text-red-500 transition-colors"
                    aria-label="Eliminar tarjeta"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ===== CUENTAS BANCARIAS ===== */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-brand-near-black flex items-center gap-2">
              <Building2 size={20} /> Cuentas bancarias de El Salvador
            </h2>
            <button
              onClick={() => setShowBankForm(!showBankForm)}
              className="flex items-center gap-2 rounded-xl bg-brand-near-black text-white px-4 py-2 font-medium hover:bg-black transition-all text-sm"
            >
              <Plus size={16} /> Vincular cuenta
            </button>
          </div>

          {showBankForm && (
            <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-brand-beige-dark/20 p-6 mb-4 shadow-sm">
              <h3 className="text-lg font-semibold text-brand-near-black mb-4">
                Vincular cuenta bancaria
              </h3>
              <form onSubmit={handleAddBank} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-brand-warm-dark mb-1.5">
                    Banco
                  </label>
                  <select
                    value={bankForm.bankName}
                    onChange={updateBank("bankName")}
                    className="w-full rounded-xl border border-brand-beige-dark/30 bg-white px-4 py-2.5 text-brand-charcoal focus:outline-none focus:ring-2 focus:ring-brand-near-black/20"
                  >
                    {EL_SALVADOR_BANKS.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-brand-warm-dark mb-1.5">
                    Titular de la cuenta
                  </label>
                  <input
                    type="text"
                    value={bankForm.accountHolder}
                    onChange={updateBank("accountHolder")}
                    placeholder="Nombre del titular"
                    className="w-full rounded-xl border border-brand-beige-dark/30 bg-white px-4 py-2.5 text-brand-charcoal placeholder:text-brand-taupe focus:outline-none focus:ring-2 focus:ring-brand-near-black/20"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-brand-warm-dark mb-1.5">
                      Número de cuenta
                    </label>
                    <input
                      type="text"
                      value={bankForm.accountNumber}
                      onChange={updateBank("accountNumber")}
                      placeholder="000123456789"
                      className="w-full rounded-xl border border-brand-beige-dark/30 bg-white px-4 py-2.5 text-brand-charcoal placeholder:text-brand-taupe focus:outline-none focus:ring-2 focus:ring-brand-near-black/20"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-brand-warm-dark mb-1.5">
                      Número de ruta (opcional)
                    </label>
                    <input
                      type="text"
                      value={bankForm.routingNumber}
                      onChange={updateBank("routingNumber")}
                      placeholder="021000021"
                      className="w-full rounded-xl border border-brand-beige-dark/30 bg-white px-4 py-2.5 text-brand-charcoal placeholder:text-brand-taupe focus:outline-none focus:ring-2 focus:ring-brand-near-black/20"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-brand-warm-dark mb-1.5">
                    Tipo de cuenta
                  </label>
                  <select
                    value={bankForm.accountType}
                    onChange={updateBank("accountType")}
                    className="w-full rounded-xl border border-brand-beige-dark/30 bg-white px-4 py-2.5 text-brand-charcoal focus:outline-none focus:ring-2 focus:ring-brand-near-black/20"
                  >
                    <option value="checking">Corriente</option>
                    <option value="savings">Ahorro</option>
                  </select>
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-2 rounded-xl bg-brand-near-black text-white px-5 py-2.5 font-medium hover:bg-black transition-all text-sm disabled:opacity-50"
                  >
                    {saving ? "Vinculando..." : "Vincular cuenta"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowBankForm(false)}
                    className="rounded-xl border border-brand-beige-dark/30 px-5 py-2.5 text-brand-gray font-medium hover:text-brand-charcoal transition-all text-sm"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          )}

          {accounts.length === 0 && !showBankForm ? (
            <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-brand-beige-dark/20 p-6 text-center text-brand-gray text-sm">
              No hay cuentas bancarias vinculadas.
            </div>
          ) : (
            <div className="space-y-3">
              {accounts.map((account) => (
                <div
                  key={account.id}
                  className="bg-white/60 backdrop-blur-xl rounded-2xl border border-brand-beige-dark/20 p-4 shadow-sm flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-brand-beige p-2.5">
                      <Building2 size={18} className="text-brand-near-black" />
                    </div>
                    <div>
                      <p className="font-semibold text-brand-charcoal text-sm">
                        {account.bankName || "Banco"}
                        {account.accountNumber ? ` • ${account.accountNumber}` : ""}
                      </p>
                      <span
                        className={`text-xs font-medium inline-flex items-center gap-1 ${
                          account.isVerified ? "text-green-600" : "text-yellow-600"
                        }`}
                      >
                        {account.isVerified && <CheckCircle2 size={12} />}
                        {account.isVerified ? "Verificada" : "Pendiente de verificación"}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveBank(account.id)}
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
    </div>
  );
}
