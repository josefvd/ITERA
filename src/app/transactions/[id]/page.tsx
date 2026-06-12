"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  FileText,
  Paperclip,
  Printer,
  Save,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { formatCurrency, formatDate, getStatusColor } from "@/lib/utils";
import {
  TransactionStatus,
  transactionActionMessages,
} from "@/lib/transaction-status";

interface Transaction {
  id: string;
  vendorName: string;
  vendorEmail: string | null;
  amount: number;
  status: string;
  paymentMethod: string | null;
  description: string | null;
  createdAt: string;
}

export default function TransactionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [savingAction, setSavingAction] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/transactions")
      .then((res) => {
        if (res.status === 401) {
          router.push("/signin");
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (!data) return;
        if (data.error) {
          setError(data.error);
          return;
        }
        const match = (data.transactions || []).find(
          (item: Transaction) => item.id === id
        );
        if (!match) {
          setError("No encontramos esta transacción.");
          return;
        }
        setTransaction(match);
      })
      .catch(() => setError("Error al cargar la transacción"))
      .finally(() => setLoading(false));
  }, [id, router]);

  const details = useMemo(
    () => parseDescription(transaction?.description || ""),
    [transaction?.description]
  );
  const visibleStatus = transaction?.status || "pending";
  const serviceFee = transaction ? Math.max(transaction.amount * 0.012, 8) : 0;
  const financingFee =
    transaction?.paymentMethod === "financiamiento"
      ? transaction.amount * 0.018
      : 0;
  const total = (transaction?.amount || 0) + serviceFee + financingFee;

  async function handleAction(action: string, nextStatus?: TransactionStatus) {
    setNotice("");
    setError("");

    if (!nextStatus) {
      setNotice(action);
      return;
    }

    const currentTransaction = transaction;
    if (!currentTransaction) {
      setError("No encontramos esta transacción.");
      return;
    }

    setSavingAction(nextStatus);
    try {
      const res = await fetch(`/api/transactions/${currentTransaction.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();

      if (!res.ok || data.error) {
        setError(data.error || "No pudimos actualizar la transacción");
        return;
      }

      setTransaction(data.transaction);
      setNotice(
        transactionActionMessages[
          nextStatus as keyof typeof transactionActionMessages
        ] || action
      );
    } catch {
      setError("Error al actualizar la transacción");
    } finally {
      setSavingAction(null);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <div className="text-brand-gray text-lg">Cargando transacción...</div>
      </div>
    );
  }

  if (error || !transaction) {
    return (
      <div className="min-h-screen pt-24 pb-16">
        <div className="mx-auto max-w-4xl px-6 lg:px-8">
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error || "No encontramos esta transacción."}
          </div>
          <Link
            href="/transactions"
            className="inline-flex items-center gap-2 text-sm font-medium text-brand-near-black hover:underline"
          >
            <ArrowLeft size={16} />
            Volver a transacciones
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <Link
          href="/transactions"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-brand-gray transition-colors hover:text-brand-near-black"
        >
          <ArrowLeft size={16} />
          Volver a transacciones
        </Link>

        {notice && (
          <div className="mb-6 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            <CheckCircle2 size={16} />
            {notice}
          </div>
        )}

        {error && (
          <div className="mb-6 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertTriangle size={16} />
            {error}
          </div>
        )}

        <div className="mb-6 rounded-3xl border border-brand-beige-dark/20 bg-white/65 p-6 shadow-xl backdrop-blur-xl">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="rounded-2xl bg-brand-beige p-3 text-brand-near-black">
                <FileText size={24} />
              </div>
              <div>
                <span className="text-xs font-semibold uppercase tracking-widest text-brand-gray">
                  Detalle de transacción
                </span>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight text-brand-near-black">
                  {details.referencia || transaction.id.slice(0, 8).toUpperCase()}
                </h1>
                <p className="mt-2 text-sm text-brand-gray">
                  Creada el {formatDate(transaction.createdAt)}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <span
                className={`rounded-full px-3 py-1.5 text-xs font-medium ${getStatusColor(
                  visibleStatus
                )}`}
              >
                {getStatusLabel(visibleStatus)}
              </span>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 rounded-full border border-brand-beige-dark/30 px-4 py-2 text-sm font-medium text-brand-near-black transition-all hover:bg-brand-beige/50"
              >
                <Printer size={15} />
                Imprimir
              </button>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="space-y-6">
            <section className="rounded-3xl border border-brand-beige-dark/20 bg-white/65 p-6 shadow-xl backdrop-blur-xl">
              <h2 className="text-lg font-semibold text-brand-near-black">
                Información principal
              </h2>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <Info label="Proveedor" value={transaction.vendorName} />
                <Info label="Correo proveedor" value={transaction.vendorEmail || "No registrado"} />
                <Info label="Tipo de referencia" value={details.tipoReferencia || "Pago"} />
                <Info label="Referencia" value={details.referencia || "Sin referencia"} />
                <Info label="Referencia relacionada" value={details.relacionada || "No registrada"} />
                <Info label="Referencia cliente" value={details.cliente || "No registrada"} />
                <Info label="Tipo de servicio" value={details.servicio || "No registrado"} />
                <Info label="Dirección" value={details.direccion || "No registrada"} />
                <Info label="Salida" value={details.salida || "No registrada"} />
                <Info label="Llegada" value={details.llegada || "No registrada"} />
                <Info label="Fecha de pago" value={details.fechaPago || "No registrada"} />
                <Info label="Carga recibida" value={details.cargaRecibida || "No registrada"} />
              </div>
            </section>

            <section className="rounded-3xl border border-brand-beige-dark/20 bg-white/65 p-6 shadow-xl backdrop-blur-xl">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-lg font-semibold text-brand-near-black">
                  Documentos y adjuntos
                </h2>
                <Paperclip size={20} className="text-brand-gray" />
              </div>
              <div className="mt-5 rounded-2xl border border-dashed border-brand-beige-dark/50 bg-brand-beige-light/60 p-5">
                <p className="text-sm font-semibold text-brand-near-black">
                  {details.adjunto || "Sin archivo adjunto"}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-brand-gray">
                  La carga real de documentos queda lista para el siguiente paso.
                  Por ahora mostramos el nombre declarado en la transacción.
                </p>
              </div>
            </section>

            <section className="rounded-3xl border border-brand-beige-dark/20 bg-white/65 p-6 shadow-xl backdrop-blur-xl">
              <h2 className="text-lg font-semibold text-brand-near-black">
                Historial de auditoría
              </h2>
              <div className="mt-5 space-y-4">
                <AuditItem
                  icon={Clock}
                  title="Transacción creada"
                  detail={formatDate(transaction.createdAt)}
                />
                <AuditItem
                  icon={FileText}
                  title="Documentación registrada"
                  detail={details.adjunto ? details.adjunto : "Pendiente de adjunto real"}
                />
                <AuditItem
                  icon={ShieldCheck}
                  title="Aprobación"
                  detail={
                    visibleStatus === "completed"
                      ? "Pago aprobado"
                      : "Pendiente de aprobación"
                  }
                />
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            <section className="rounded-3xl border border-brand-beige-dark/20 bg-brand-near-black p-6 text-white shadow-xl">
              <h2 className="text-lg font-semibold">Resumen de pago</h2>
              <div className="mt-6 space-y-3 text-sm">
                <Summary label="Monto" value={formatCurrency(transaction.amount)} />
                <Summary label="Fee de servicio" value={formatCurrency(serviceFee)} />
                <Summary label="Fee financiero" value={formatCurrency(financingFee)} />
                <Summary
                  label="Método"
                  value={getMethodLabel(transaction.paymentMethod || "—")}
                />
                <div className="flex items-center justify-between border-t border-white/15 pt-4">
                  <span className="text-white/65">Total</span>
                  <span className="text-2xl font-semibold">{formatCurrency(total)}</span>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-brand-beige-dark/20 bg-white/65 p-6 shadow-xl backdrop-blur-xl">
              <h2 className="text-lg font-semibold text-brand-near-black">
                Acciones
              </h2>
              <div className="mt-5 grid gap-3">
                <ActionButton
                  icon={Save}
                  label="Guardar"
                  disabled={savingAction !== null}
                  onClick={() => handleAction("Transacción guardada")}
                />
                <ActionButton
                  icon={CheckCircle2}
                  label={
                    savingAction === "completed" ? "Aprobando..." : "Aprobar pago"
                  }
                  strong
                  disabled={savingAction !== null}
                  onClick={() =>
                    handleAction("Pago aprobado y proveedor notificado", "completed")
                  }
                />
                <ActionButton
                  icon={AlertTriangle}
                  label={savingAction === "failed" ? "Marcando..." : "Disputar"}
                  disabled={savingAction !== null}
                  onClick={() => handleAction("Transacción marcada para disputa", "failed")}
                />
                <ActionButton
                  icon={XCircle}
                  label={savingAction === "cancelled" ? "Anulando..." : "Anular"}
                  danger
                  disabled={savingAction !== null}
                  onClick={() => handleAction("Transacción anulada", "cancelled")}
                />
              </div>
            </section>

            <section className="rounded-3xl border border-brand-beige-dark/20 bg-white/65 p-6 shadow-xl backdrop-blur-xl">
              <h2 className="text-lg font-semibold text-brand-near-black">
                Flujo
              </h2>
              <div className="mt-5 space-y-4">
                {["Creada", "Validación documental", "Aprobación", "Pago enviado"].map(
                  (item, index) => (
                    <div key={item} className="flex items-center gap-3">
                      <span
                        className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                          index === 0 || (visibleStatus === "completed" && index < 4)
                            ? "bg-brand-near-black text-white"
                            : "bg-brand-beige text-brand-warm-dark"
                        }`}
                      >
                        {index + 1}
                      </span>
                      <span className="text-sm text-brand-warm-dark">{item}</span>
                    </div>
                  )
                )}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}

function parseDescription(description: string) {
  const read = (label: string) => {
    const match = description.match(new RegExp(`${label}:\\s(.+)`, "i"));
    return match?.[1]?.split("\n")[0] || "";
  };
  const referenceMatch = description.match(/Referencia\s(AWB|BOL|Factura|Otro):\s(.+)/i);

  return {
    tipoReferencia: referenceMatch?.[1] || "",
    referencia: referenceMatch?.[2]?.split("\n")[0] || "",
    relacionada: read("Referencia relacionada"),
    cliente: read("Referencia cliente"),
    servicio: read("Tipo de servicio"),
    direccion: read("Dirección"),
    cargaRecibida: read("Carga recibida"),
    salida: read("Salida"),
    llegada: read("Llegada"),
    fechaPago: read("Fecha de pago"),
    adjunto: read("Adjunto declarado"),
  };
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-brand-beige-dark/20 bg-white/70 p-4">
      <p className="text-xs font-semibold uppercase tracking-widest text-brand-gray">
        {label}
      </p>
      <p className="mt-2 break-words text-sm font-medium text-brand-near-black">
        {value}
      </p>
    </div>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-white/55">{label}</span>
      <span className="text-right font-medium text-white">{value}</span>
    </div>
  );
}

function AuditItem({
  icon: Icon,
  title,
  detail,
}: {
  icon: React.ElementType;
  title: string;
  detail: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="rounded-xl bg-brand-beige p-2 text-brand-near-black">
        <Icon size={16} />
      </div>
      <div>
        <p className="text-sm font-semibold text-brand-near-black">{title}</p>
        <p className="mt-1 text-xs text-brand-gray">{detail}</p>
      </div>
    </div>
  );
}

function ActionButton({
  icon: Icon,
  label,
  onClick,
  strong = false,
  danger = false,
  disabled = false,
}: {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  strong?: boolean;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-medium transition-all disabled:cursor-not-allowed disabled:opacity-60 ${
        strong
          ? "bg-brand-near-black text-white hover:bg-black"
          : danger
          ? "border border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
          : "border border-brand-beige-dark/30 text-brand-near-black hover:bg-brand-beige/50"
      }`}
    >
      <Icon size={16} />
      {label}
    </button>
  );
}

function getStatusLabel(status: string) {
  const labels: Record<string, string> = {
    pending: "Pendiente",
    processing: "Procesando",
    completed: "Aprobada",
    paid: "Pagada",
    failed: "En disputa",
    cancelled: "Anulada",
  };
  return labels[status] || status;
}

function getMethodLabel(method: string) {
  const labels: Record<string, string> = {
    financiamiento: "Financiamiento ITERA",
    ach: "Débito ACH",
    wire: "Transferencia",
    prepaid: "Prepago",
  };
  return labels[method] || method;
}
