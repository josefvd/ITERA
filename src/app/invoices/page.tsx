"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, Clock3, FileCheck2, FileText, Ship, WalletCards } from "lucide-react";
import { formatCurrency, formatDate, getStatusColor } from "@/lib/utils";

type InvoiceStatus = "pending_review" | "pending" | "scheduled" | "paid";
type PaymentMethod = "bank_account" | "credit_card" | "itera_credit";

interface Invoice {
  id: string;
  invoiceNumber: string;
  vendorName: string | null;
  transactionVendorName: string | null;
  shipmentRef: string | null;
  invoiceType: string | null;
  amount: number;
  dueDate: string | null;
  status: InvoiceStatus;
  paymentMethod: PaymentMethod | null;
  scheduledFor: string | null;
}

const TABS: { id: "all" | InvoiceStatus; label: string }[] = [
  { id: "all", label: "Todas" },
  { id: "pending_review", label: "Por revisar" },
  { id: "pending", label: "Por pagar" },
  { id: "scheduled", label: "Programadas" },
  { id: "paid", label: "Pagadas" },
];

const methodLabel: Record<PaymentMethod, string> = {
  bank_account: "Cuenta bancaria",
  credit_card: "Tarjeta",
  itera_credit: "Crédito ITERA",
};

const statusLabel: Record<InvoiceStatus, string> = {
  pending_review: "Por revisar",
  pending: "Por pagar",
  scheduled: "Programada",
  paid: "Pagada",
};

export default function InvoicesPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadInvoices = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/invoices${tab === "all" ? "" : `?status=${tab}`}`);
      if (response.status === 401) {
        router.push("/signin");
        return;
      }
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No se pudieron cargar las facturas");
      setInvoices(data.invoices || []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Error al cargar las facturas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadInvoices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, router]);

  const totals = useMemo(() => ({
    review: invoices.filter((invoice) => invoice.status === "pending_review").length,
    payable: invoices.filter((invoice) => invoice.status === "pending").reduce((sum, invoice) => sum + Number(invoice.amount), 0),
    scheduled: invoices.filter((invoice) => invoice.status === "scheduled").reduce((sum, invoice) => sum + Number(invoice.amount), 0),
  }), [invoices]);

  const updateInvoice = async (id: string, action: string, payload: Record<string, string> = {}) => {
    setUpdatingId(id);
    setError("");
    try {
      const response = await fetch(`/api/invoices/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...payload }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No se pudo actualizar la factura");
      await loadInvoices();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo actualizar la factura");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <main className="min-h-screen pt-24 pb-16">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between mb-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-gray">Centro de control</p>
            <h1 className="mt-2 text-3xl font-bold text-brand-near-black">Facturas</h1>
            <p className="mt-1 text-brand-gray">Revisa, programa y paga obligaciones vinculadas a tus embarques.</p>
          </div>
          <Link href="/shipments" className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-near-black px-5 py-2.5 text-sm font-medium text-white hover:bg-black">
            <Ship size={16} /> Ver embarques
          </Link>
        </header>

        <section className="grid gap-4 md:grid-cols-3 mb-8">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5"><FileCheck2 className="mb-3 text-amber-700" size={20} /><p className="text-sm text-amber-800">Por revisar</p><p className="mt-1 text-2xl font-bold text-amber-900">{totals.review}</p></div>
          <div className="rounded-2xl border border-brand-beige-dark/30 bg-white/70 p-5"><WalletCards className="mb-3 text-brand-near-black" size={20} /><p className="text-sm text-brand-gray">Listo para pagar</p><p className="mt-1 text-2xl font-bold text-brand-near-black">{formatCurrency(totals.payable)}</p></div>
          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5"><Clock3 className="mb-3 text-blue-700" size={20} /><p className="text-sm text-blue-800">Programado</p><p className="mt-1 text-2xl font-bold text-blue-900">{formatCurrency(totals.scheduled)}</p></div>
        </section>

        <div className="mb-5 flex flex-wrap gap-2">
          {TABS.map((item) => <button key={item.id} onClick={() => setTab(item.id)} className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${tab === item.id ? "bg-brand-near-black text-white" : "bg-brand-beige/40 text-brand-charcoal hover:bg-brand-beige"}`}>{item.label}</button>)}
        </div>

        {error && <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        <section className="overflow-hidden rounded-2xl border border-brand-beige-dark/20 bg-white/70 shadow-sm">
          {loading ? <div className="p-12 text-center text-brand-gray">Cargando facturas...</div> : invoices.length === 0 ? <div className="p-16 text-center"><FileText className="mx-auto mb-4 text-brand-gray" size={32} /><h2 className="font-semibold text-brand-near-black">No hay facturas en esta vista</h2><p className="mt-2 text-sm text-brand-gray">Las facturas que se reenvíen o se importen aparecerán aquí para su revisión.</p></div> : <div className="overflow-x-auto"><table className="w-full min-w-[900px]"><thead><tr className="border-b border-brand-beige-dark/20 text-left text-xs uppercase tracking-wider text-brand-gray"><th className="px-5 py-4">Factura</th><th className="px-5 py-4">Embarque</th><th className="px-5 py-4">Proveedor</th><th className="px-5 py-4">Vencimiento</th><th className="px-5 py-4">Método</th><th className="px-5 py-4">Estado</th><th className="px-5 py-4 text-right">Monto</th><th className="px-5 py-4">Acción</th></tr></thead><tbody className="divide-y divide-brand-beige-dark/15">{invoices.map((invoice) => { const busy = updatingId === invoice.id; return <tr key={invoice.id} className="align-top hover:bg-brand-beige/15"><td className="px-5 py-4 font-medium text-brand-near-black">{invoice.invoiceNumber}<p className="mt-1 text-xs text-brand-gray">{invoice.invoiceType || "Sin categoría"}</p></td><td className="px-5 py-4 text-sm text-brand-charcoal">{invoice.shipmentRef || "Pago general"}</td><td className="px-5 py-4 text-sm text-brand-charcoal">{invoice.vendorName || invoice.transactionVendorName || "—"}</td><td className="px-5 py-4 text-sm text-brand-gray">{invoice.dueDate ? formatDate(invoice.dueDate) : "—"}{invoice.scheduledFor && <p className="mt-1 text-xs text-blue-700">Programada: {formatDate(invoice.scheduledFor)}</p>}</td><td className="px-5 py-4"><select disabled={busy || invoice.status === "paid"} value={invoice.paymentMethod || ""} onChange={(event) => void updateInvoice(invoice.id, "set_payment_method", { paymentMethod: event.target.value })} className="rounded-lg border border-brand-beige-dark/40 bg-white px-2 py-1.5 text-xs text-brand-charcoal disabled:opacity-50"><option value="">Seleccionar</option>{Object.entries(methodLabel).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></td><td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${getStatusColor(invoice.status)}`}>{statusLabel[invoice.status]}</span></td><td className="px-5 py-4 text-right font-semibold text-brand-near-black">{formatCurrency(Number(invoice.amount))}</td><td className="px-5 py-4">{invoice.status === "pending_review" ? <button disabled={busy} onClick={() => void updateInvoice(invoice.id, "review")} className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50">Aprobar</button> : invoice.status === "pending" ? <div className="flex gap-2"><button disabled={busy} onClick={() => void updateInvoice(invoice.id, "pay", invoice.paymentMethod ? { paymentMethod: invoice.paymentMethod } : {})} className="rounded-lg bg-brand-near-black px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50">Pagar</button><button disabled={busy} onClick={() => { const scheduledFor = window.prompt("Fecha de pago (YYYY-MM-DD)"); if (scheduledFor) void updateInvoice(invoice.id, "schedule", { scheduledFor, ...(invoice.paymentMethod ? { paymentMethod: invoice.paymentMethod } : {}) }); }} className="rounded-lg border border-brand-beige-dark/50 px-3 py-1.5 text-xs font-medium text-brand-charcoal disabled:opacity-50">Agendar</button></div> : invoice.status === "scheduled" ? <span className="text-xs text-blue-700">En cola</span> : <CheckCircle2 className="text-green-600" size={18} />}</td></tr>; })}</tbody></table></div>}
        </section>
      </div>
    </main>
  );
}
