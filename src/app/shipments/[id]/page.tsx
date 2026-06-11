"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  AlertTriangle,
  CheckCircle,
  Clock,
  Ship,
  CreditCard,
  X,
  FileText,
  ArrowRight,
  Building2,
} from "lucide-react";
import { formatCurrency, formatDate, getStatusColor } from "@/lib/utils";

interface Invoice {
  id: string;
  invoiceNumber: string;
  vendorName: string | null;
  amount: number;
  dueDate: string | null;
  status: string;
  issuedAt: string;
  paidAt: string | null;
}

interface Shipment {
  id: string;
  reference: string;
  totalAmount: number;
  status: string;
  dueDate: string | null;
  urgency: string;
  createdAt: string;
}

interface ApprovalRule {
  id: string;
  maxAmount: number;
  approverEmail: string;
  isActive: boolean;
}

function getStatusLabel(status: string) {
  const labels: Record<string, string> = {
    pending: "Pendiente",
    paid: "Pagado",
    processing: "Procesando",
    overdue: "Vencido",
    cancelled: "Cancelado",
    financed: "Financiado",
  };
  return labels[status] || status;
}

function getUrgencyLabel(urgency: string) {
  const labels: Record<string, string> = {
    low: "Baja",
    normal: "Normal",
    high: "Alta",
    urgent: "Urgente",
    critical: "Crítica",
  };
  return labels[urgency] || urgency;
}

export default function ShipmentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [paying, setPaying] = useState(false);
  const [success, setSuccess] = useState("");
  const [approvalRules, setApprovalRules] = useState<ApprovalRule[]>([]);

  // Trade credit / financing state
  const [showFinancing, setShowFinancing] = useState(false);
  const [financingStep, setFinancingStep] = useState<"form" | "confirm">("form");
  const [financing, setFinancing] = useState(false);
  const [financingResult, setFinancingResult] = useState<any>(null);
  const [feePercent, setFeePercent] = useState(2.5);

  // Check if due date is within 48 hours
  const isNearDue = () => {
    if (!shipment?.dueDate) return false;
    const due = new Date(shipment.dueDate);
    const now = new Date();
    const diffMs = due.getTime() - now.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    return diffHours > 0 && diffHours <= 48;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [shipRes, rulesRes] = await Promise.all([
          fetch(`/api/shipments/${id}`),
          fetch("/api/approval-rules"),
        ]);

        if (shipRes.status === 401) {
          router.push("/signin");
          return;
        }

        const shipData = await shipRes.json();
        if (shipData.error) {
          setError(shipData.error);
        } else {
          setShipment(shipData.shipment);
          setInvoices(shipData.invoices || []);
        }

        if (rulesRes.ok) {
          const rulesData = await rulesRes.json();
          setApprovalRules(rulesData.rules || []);
        }
      } catch {
        setError("Error al cargar el embarque");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, router]);

  const totalAmount = invoices.reduce((sum, inv) => sum + inv.amount, 0);
  const needsApproval = approvalRules.some(
    (rule) => rule.isActive && totalAmount > rule.maxAmount
  );

  const handlePayAll = async () => {
    setPaying(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/shipments/${id}`, { method: "POST" });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setShipment(data.shipment);
        setInvoices(data.invoices || []);
        setSuccess("Todas las obligaciones han sido pagadas exitosamente.");
      }
    } catch {
      setError("Error al procesar el pago");
    } finally {
      setPaying(false);
    }
  };

  const handleFinance = async () => {
    setFinancing(true);
    setError("");
    try {
      const res = await fetch("/api/trade-credit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shipmentId: id,
          amount: totalAmount,
          termDays: 30,
          feePercent,
        }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setFinancingResult(data.tradeCredit);
        setFinancingStep("confirm");
      }
    } catch {
      setError("Error al procesar el financiamiento");
    } finally {
      setFinancing(false);
    }
  };

  const isPaid = shipment?.status === "paid";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <div className="text-brand-gray text-lg">Cargando embarque...</div>
      </div>
    );
  }

  if (error && !shipment) {
    return (
      <div className="min-h-screen pt-24 pb-16">
        <div className="mx-auto max-w-4xl px-6 lg:px-8">
          <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm mb-6">
            {error}
          </div>
          <Link
            href="/shipments"
            className="inline-flex items-center gap-2 text-brand-near-black font-medium hover:underline"
          >
            <ArrowLeft size={16} /> Volver a embarques
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="mx-auto max-w-4xl px-6 lg:px-8">
        {/* Back link */}
        <Link
          href="/shipments"
          className="inline-flex items-center gap-2 text-brand-gray hover:text-brand-near-black transition-colors mb-6 text-sm font-medium"
        >
          <ArrowLeft size={16} />
          Volver a embarques
        </Link>

        {success && (
          <div className="mb-6 rounded-lg bg-green-50 border border-green-200 text-green-700 px-4 py-3 text-sm flex items-center gap-2">
            <CheckCircle size={16} />
            {success}
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {/* Near-due warning */}
        {isNearDue() && !isPaid && (
          <div className="mb-6 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 px-5 py-4 flex items-start gap-3">
            <AlertTriangle size={20} className="shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm">⚠️ Vence en 48 horas</p>
              <p className="text-sm text-amber-700 mt-1">
                Este embarque tiene obligaciones que vencen pronto. Te recomendamos
                realizar el pago o financiarlo con ITERA para evitar recargos.
              </p>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-brand-beige-dark/20 shadow-sm p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="rounded-xl bg-brand-beige p-3">
                <Ship size={24} className="text-brand-near-black" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-brand-near-black">
                  Embarque {shipment?.reference}
                </h1>
                <p className="text-brand-gray text-sm mt-1">
                  Creado el {shipment?.createdAt ? formatDate(shipment.createdAt) : "—"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {shipment?.urgency && shipment.urgency !== "normal" && shipment.urgency !== "low" && (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-red-50 text-red-700 border border-red-200">
                  <AlertTriangle size={12} />
                  {getUrgencyLabel(shipment.urgency)}
                </span>
              )}
              {shipment?.status && (
                <span
                  className={`text-xs font-medium px-3 py-1.5 rounded-full ${getStatusColor(
                    shipment.status
                  )}`}
                >
                  {getStatusLabel(shipment.status)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Invoices table */}
        <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-brand-beige-dark/20 shadow-sm overflow-hidden mb-6">
          <div className="px-6 py-5 border-b border-brand-beige-dark/20">
            <h2 className="text-lg font-semibold text-brand-near-black flex items-center gap-2">
              <FileText size={18} />
              Facturas y Obligaciones
            </h2>
          </div>

          {invoices.length === 0 ? (
            <div className="px-6 py-12 text-center text-brand-gray">
              <FileText size={32} className="mx-auto mb-3 opacity-50" />
              <p>No hay facturas asociadas a este embarque</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-brand-beige-dark/20">
                      <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider text-brand-gray">
                        Proveedor
                      </th>
                      <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider text-brand-gray">
                        Monto
                      </th>
                      <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider text-brand-gray">
                        Vencimiento
                      </th>
                      <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider text-brand-gray">
                        Estado
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-beige-dark/20">
                    {invoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-brand-beige/20 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-brand-charcoal">
                          {inv.vendorName || "—"}
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-brand-near-black">
                          {formatCurrency(inv.amount)}
                        </td>
                        <td className="px-6 py-4 text-sm text-brand-gray">
                          {inv.dueDate ? formatDate(inv.dueDate) : "—"}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`text-xs font-medium px-2.5 py-1 rounded-full ${getStatusColor(
                              inv.status
                            )}`}
                          >
                            {getStatusLabel(inv.status)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Total */}
              <div className="px-6 py-4 border-t border-brand-beige-dark/20 flex items-center justify-between bg-brand-beige/10">
                <span className="font-semibold text-brand-near-black">Total</span>
                <span className="text-xl font-bold text-brand-near-black">
                  {formatCurrency(totalAmount)}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Approval warning */}
        {needsApproval && !isPaid && (
          <div className="mb-6 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 px-5 py-4 flex items-start gap-3">
            <Building2 size={20} className="shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm">Requiere aprobación del manager</p>
              <p className="text-sm text-blue-700 mt-1">
                El monto total de este embarque supera el límite establecido. Se
                enviará una solicitud de aprobación al correo del manager.
              </p>
            </div>
          </div>
        )}

        {/* Payment actions */}
        {!isPaid && invoices.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={handlePayAll}
              disabled={paying}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-brand-near-black text-white px-6 py-3 font-medium hover:bg-black transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {paying ? (
                "Procesando..."
              ) : (
                <>
                  <CheckCircle size={18} />
                  Pagar ahora
                </>
              )}
            </button>
            <button
              onClick={() => {
                setShowFinancing(true);
                setFinancingStep("form");
                setFinancingResult(null);
              }}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl border-2 border-brand-near-black/30 text-brand-near-black px-6 py-3 font-medium hover:bg-brand-beige/30 transition-all text-sm"
            >
              <CreditCard size={18} />
              Financiar con ITERA
            </button>
          </div>
        )}

        {isPaid && (
          <div className="rounded-xl bg-green-50 border border-green-200 text-green-700 px-6 py-6 text-center">
            <CheckCircle size={32} className="mx-auto mb-2" />
            <p className="font-semibold text-lg">Embarque pagado</p>
            <p className="text-sm text-green-600 mt-1">
              Todas las obligaciones de este embarque han sido liquidadas.
            </p>
          </div>
        )}

        {/* Pagar todas las obligaciones button */}
        {!isPaid && invoices.length > 0 && (
          <div className="mt-6 text-center">
            <button
              onClick={handlePayAll}
              disabled={paying}
              className="inline-flex items-center gap-2 text-brand-gray hover:text-brand-near-black transition-colors text-sm font-medium underline underline-offset-2"
            >
              Pagar todas las obligaciones
            </button>
          </div>
        )}
      </div>

      {/* Financing side panel */}
      {showFinancing && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowFinancing(false)}
          />

          {/* Panel */}
          <div className="relative w-full max-w-md bg-white shadow-2xl h-full overflow-y-auto">
            <div className="p-6">
              {/* Close */}
              <button
                onClick={() => setShowFinancing(false)}
                className="absolute top-4 right-4 rounded-full p-2 hover:bg-brand-beige/50 transition-colors"
              >
                <X size={20} className="text-brand-gray" />
              </button>

              {financingStep === "form" && (
                <>
                  <div className="rounded-xl bg-brand-beige/30 w-14 h-14 flex items-center justify-center mb-4">
                    <CreditCard size={28} className="text-brand-near-black" />
                  </div>

                  <h2 className="text-xl font-bold text-brand-near-black mb-1">
                    Financiar Embarque
                  </h2>
                  <p className="text-sm text-brand-gray mb-6">
                    {shipment?.reference}
                  </p>

                  <div className="bg-brand-beige/20 rounded-xl p-5 mb-6">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-brand-gray">
                        Obligaciones pendientes
                      </span>
                      <span className="text-lg font-bold text-brand-near-black">
                        {formatCurrency(totalAmount)}
                      </span>
                    </div>
                  </div>

                  <div className="mb-6">
                    <h3 className="font-semibold text-brand-near-black mb-1">
                      ¿Necesitas más tiempo?
                    </h3>
                    <p className="text-sm text-brand-gray">
                      Usa ITERA Trade Credit para financiar tus obligaciones y
                      pagar a tus proveedores sin afectar tu flujo de caja.
                    </p>
                  </div>

                  <div className="border-t border-brand-beige-dark/20 pt-5 mb-6 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-brand-gray">Plazo de pago</span>
                      <span className="font-medium text-brand-near-black">
                        30 días
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-brand-gray">Comisión estimada</span>
                      <span className="font-medium text-brand-near-black">
                        {feePercent}%
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-brand-gray">Cargo por servicio</span>
                      <span className="font-medium text-brand-near-black">
                        {formatCurrency(totalAmount * (feePercent / 100))}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm pt-2 border-t border-brand-beige-dark/20">
                      <span className="font-semibold text-brand-near-black">
                        Total a financiar
                      </span>
                      <span className="font-bold text-brand-near-black">
                        {formatCurrency(totalAmount * (1 + feePercent / 100))}
                      </span>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-6">
                    <p className="text-xs text-blue-700">
                      Los fondos se envían directamente a los proveedores. ITERA
                      paga las facturas y tú nos reembolsas en los plazos
                      acordados.
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowFinancing(false)}
                      className="flex-1 rounded-xl border-2 border-brand-beige-dark/30 text-brand-charcoal px-5 py-3 font-medium hover:bg-brand-beige/30 transition-all text-sm"
                    >
                      Pagar ahora
                    </button>
                    <button
                      onClick={handleFinance}
                      disabled={financing}
                      className="flex-1 rounded-xl bg-brand-near-black text-white px-5 py-3 font-medium hover:bg-black transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {financing ? "Procesando..." : "Financiar con ITERA"}
                    </button>
                  </div>
                </>
              )}

              {financingStep === "confirm" && (
                <>
                  <div className="rounded-xl bg-green-100 w-14 h-14 flex items-center justify-center mb-4">
                    <CheckCircle size={28} className="text-green-600" />
                  </div>

                  <h2 className="text-xl font-bold text-brand-near-black mb-1">
                    ¡Financiamiento Exitoso!
                  </h2>
                  <p className="text-sm text-brand-gray mb-6">
                    ITERA ha financiado las obligaciones del embarque{" "}
                    {shipment?.reference}
                  </p>

                  <div className="bg-brand-beige/20 rounded-xl p-5 mb-6">
                    <p className="text-sm text-brand-gray mb-3 font-medium">
                      Facturas financiadas
                    </p>
                    <div className="space-y-3">
                      {invoices.map((inv) => (
                        <div
                          key={inv.id}
                          className="flex items-center justify-between bg-white rounded-lg px-4 py-3"
                        >
                          <div className="flex items-center gap-3">
                            <CheckCircle size={16} className="text-green-600 shrink-0" />
                            <div>
                              <p className="text-sm font-medium text-brand-charcoal">
                                {inv.vendorName || "Proveedor"}
                              </p>
                              <p className="text-xs text-brand-gray">
                                {inv.invoiceNumber}
                              </p>
                            </div>
                          </div>
                          <span className="text-sm font-semibold text-brand-near-black">
                            {formatCurrency(inv.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-brand-beige-dark/20 pt-5 mb-6 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-brand-gray">Total financiado</span>
                      <span className="font-medium text-brand-near-black">
                        {formatCurrency(totalAmount)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-brand-gray">Comisión ({feePercent}%)</span>
                      <span className="font-medium text-brand-near-black">
                        {formatCurrency(totalAmount * (feePercent / 100))}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm pt-2 border-t border-brand-beige-dark/20">
                      <span className="font-semibold text-brand-near-black">
                        Total a pagar
                      </span>
                      <span className="font-bold text-brand-near-black">
                        {formatCurrency(totalAmount * (1 + feePercent / 100))}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm text-brand-gray">
                      <span>Vencimiento</span>
                      <span className="font-medium">
                        {financingResult?.dueDate
                          ? formatDate(financingResult.dueDate)
                          : "30 días"}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setShowFinancing(false);
                      window.location.reload();
                    }}
                    className="w-full rounded-xl bg-brand-near-black text-white px-5 py-3 font-medium hover:bg-black transition-all text-sm"
                  >
                    Ir al dashboard
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}