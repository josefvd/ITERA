"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowUpRight,
  ArrowRight,
  BarChart3,
  Clock,
  CreditCard,
  FileCheck2,
  Plus,
  Receipt,
  Search,
  Ship,
  Wallet,
} from "lucide-react";
import { formatCurrency, formatDate, getStatusColor } from "@/lib/utils";

interface Transaction {
  id: string;
  vendorName: string;
  amount: number;
  status: string;
  paymentMethod: string | null;
  createdAt: string;
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

export default function DashboardPage() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/transactions"),
      fetch("/api/shipments"),
    ])
      .then(([txRes, shipRes]) => {
        if (txRes.status === 401) {
          router.push("/signin");
          return null;
        }
        return Promise.all([txRes.json(), shipRes.json()]);
      })
      .then((data) => {
        if (data) {
          const [txData, shipData] = data;
          if (txData.error) setError(txData.error);
          else setTransactions(txData.transactions || []);
          if (shipData.error) setError(shipData.error);
          else setShipments(shipData.shipments || []);
        }
      })
      .catch(() => setError("Error al cargar el dashboard"))
      .finally(() => setLoading(false));
  }, [router]);

  const totalBalance = transactions.reduce(
    (sum, t) => (t.status === "completed" ? sum + t.amount : sum),
    0
  );
  const pendingTotal = transactions.reduce(
    (sum, t) => (t.status === "pending" ? sum + t.amount : sum),
    0
  );
  const processingTotal = transactions.reduce(
    (sum, t) => (t.status === "processing" ? sum + t.amount : sum),
    0
  );
  const creditLimit = 50000;
  const creditUsed = pendingTotal + processingTotal;
  const creditAvailable = Math.max(creditLimit - creditUsed, 0);
  const creditPercent = Math.min((creditUsed / creditLimit) * 100, 100);
  const recentTransactions = transactions.slice(0, 5);
  const recentShipments = shipments.slice(0, 5);
  const statusSummary = [
    {
      label: "Pendientes",
      value: transactions.filter((tx) => tx.status === "pending").length,
      color: "bg-yellow-500",
    },
    {
      label: "Procesando",
      value: transactions.filter((tx) => tx.status === "processing").length,
      color: "bg-blue-500",
    },
    {
      label: "Completadas",
      value: transactions.filter((tx) => tx.status === "completed" || tx.status === "paid").length,
      color: "bg-green-500",
    },
    {
      label: "Revisión",
      value: transactions.filter((tx) => !["pending", "processing", "completed", "paid"].includes(tx.status)).length,
      color: "bg-brand-taupe",
    },
  ];
  const totalStatusCount = Math.max(
    statusSummary.reduce((sum, item) => sum + item.value, 0),
    1
  );

  const getStatusBadge = (status: string) => {
    const labels: Record<string, string> = {
      pending: "Pendiente",
      paid: "Pagado",
      financed: "Financiado",
      processing: "Procesando",
      overdue: "Vencido",
      cancelled: "Cancelado",
    };
    return (
      <span
        className={`text-xs font-medium px-2.5 py-1 rounded-full ${getStatusColor(
          status
        )}`}
      >
        {labels[status] || status}
      </span>
    );
  };

  const getTransactionStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: "Pendiente",
      processing: "Procesando",
      completed: "Completada",
      paid: "Pagada",
      failed: "Fallida",
      cancelled: "Cancelada",
    };
    return labels[status] || status;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-brand-gray text-lg">Cargando dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mb-8 overflow-hidden rounded-3xl border border-brand-beige-dark/20 bg-brand-near-black shadow-xl">
          <div className="relative p-6 md:p-8">
            <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/5 blur-3xl" />
            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <span className="text-xs font-semibold uppercase tracking-widest text-white/45">
                  Panel operativo
                </span>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white md:text-4xl">
                  Dashboard de pagos
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/60">
                  Controla transacciones, disponibilidad de financiamiento y
                  actividad reciente desde un solo lugar.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/transactions"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 px-5 py-3 text-sm font-medium text-white/85 transition-all hover:bg-white/10"
                >
                  <Search size={16} />
                  Ver transacciones
                </Link>
                <Link
                  href="/transactions/new"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-medium text-brand-near-black transition-all hover:bg-white/90"
                >
                  <Plus size={16} />
                  Crear transacción
                </Link>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
            {error}
          </div>
        )}

        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            icon={Wallet}
            label="Pagado"
            value={formatCurrency(totalBalance)}
            detail="Total completado"
          />
          <MetricCard
            icon={Receipt}
            label="Transacciones"
            value={transactions.length.toString()}
            detail="Últimos registros"
          />
          <MetricCard
            icon={Clock}
            label="Pendiente"
            value={formatCurrency(pendingTotal)}
            detail="Por aprobar o pagar"
          />
          <MetricCard
            icon={Ship}
            label="Embarques"
            value={shipments.length.toString()}
            detail="Obligaciones agrupadas"
          />
        </div>

        <div className="mb-6 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <section className="rounded-3xl border border-brand-beige-dark/20 bg-white/65 p-6 shadow-xl backdrop-blur-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-xs font-semibold uppercase tracking-widest text-brand-gray">
                  Financiamiento
                </span>
                <h2 className="mt-2 text-xl font-semibold text-brand-near-black">
                  Fondos disponibles
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-brand-gray">
                  Estimación operativa para pagos con financiamiento ITERA.
                </p>
              </div>
              <div className="rounded-2xl bg-brand-beige p-3 text-brand-near-black">
                <CreditCard size={22} />
              </div>
            </div>

            <div className="mt-8">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-sm text-brand-gray">Disponible</p>
                  <p className="mt-1 text-4xl font-semibold text-brand-near-black">
                    {formatCurrency(creditAvailable)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-brand-gray">Límite</p>
                  <p className="mt-1 font-semibold text-brand-near-black">
                    {formatCurrency(creditLimit)}
                  </p>
                </div>
              </div>
              <div className="mt-5 h-3 overflow-hidden rounded-full bg-brand-beige">
                <div
                  className="h-full rounded-full bg-brand-near-black"
                  style={{ width: `${creditPercent}%` }}
                />
              </div>
              <div className="mt-3 flex justify-between text-xs text-brand-gray">
                <span>Usado: {formatCurrency(creditUsed)}</span>
                <span>{Math.round(creditPercent)}%</span>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-brand-beige-dark/20 bg-white/65 p-6 shadow-xl backdrop-blur-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-xs font-semibold uppercase tracking-widest text-brand-gray">
                  Estado
                </span>
                <h2 className="mt-2 text-xl font-semibold text-brand-near-black">
                  Transacciones por estado
                </h2>
              </div>
              <div className="rounded-2xl bg-brand-beige p-3 text-brand-near-black">
                <BarChart3 size={22} />
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {statusSummary.map((item) => (
                <div key={item.label}>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-medium text-brand-warm-dark">
                      {item.label}
                    </span>
                    <span className="text-brand-gray">{item.value}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-brand-beige">
                    <div
                      className={`h-full rounded-full ${item.color}`}
                      style={{ width: `${(item.value / totalStatusCount) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
          <section className="rounded-3xl border border-brand-beige-dark/20 bg-white/65 shadow-xl backdrop-blur-xl">
            <div className="flex items-center justify-between gap-4 border-b border-brand-beige-dark/20 px-6 py-5">
              <div>
                <h2 className="text-lg font-semibold text-brand-near-black">
                  Transacciones recientes
                </h2>
                <p className="mt-1 text-sm text-brand-gray">
                  Últimos pagos creados o procesados.
                </p>
              </div>
              <Link
                href="/transactions"
                className="inline-flex items-center gap-1 text-sm font-medium text-brand-near-black hover:underline"
              >
                Ver todas <ArrowRight size={14} />
              </Link>
            </div>

            {recentTransactions.length === 0 ? (
              <EmptyState
                icon={Receipt}
                title="Aún no hay transacciones"
                actionLabel="Crear primera transacción"
                href="/transactions/new"
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-brand-beige-dark/20 text-left text-xs font-semibold uppercase tracking-widest text-brand-gray">
                      <th className="px-6 py-4">Proveedor</th>
                      <th className="px-6 py-4">Monto</th>
                      <th className="px-6 py-4">Estado</th>
                      <th className="px-6 py-4">Método</th>
                      <th className="px-6 py-4">Fecha</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-beige-dark/20">
                    {recentTransactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-brand-beige/20">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="rounded-xl bg-brand-beige p-2 text-brand-near-black">
                              <ArrowUpRight size={15} />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-brand-charcoal">
                                {tx.vendorName}
                              </p>
                              <p className="text-xs text-brand-gray">
                                {tx.paymentMethod || "Sin método"}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-brand-near-black">
                          {formatCurrency(tx.amount)}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`text-xs font-medium px-2.5 py-1 rounded-full ${getStatusColor(
                              tx.status
                            )}`}
                          >
                            {getTransactionStatusLabel(tx.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-brand-gray">
                          {tx.paymentMethod || "—"}
                        </td>
                        <td className="px-6 py-4 text-sm text-brand-gray">
                          {formatDate(tx.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <div className="space-y-6">
            <section className="rounded-3xl border border-brand-beige-dark/20 bg-white/65 p-6 shadow-xl backdrop-blur-xl">
              <h2 className="text-lg font-semibold text-brand-near-black">
                Acciones rápidas
              </h2>
              <div className="mt-5 grid gap-3">
                <QuickAction
                  href="/transactions/new"
                  icon={Plus}
                  title="Crear transacción"
                  description="Registra un pago por AWB, BOL o factura."
                />
                <QuickAction
                  href="/transactions"
                  icon={FileCheck2}
                  title="Aprobar pagos"
                  description="Revisa transacciones pendientes."
                />
                <QuickAction
                  href="/shipments"
                  icon={Ship}
                  title="Ver embarques"
                  description="Agrupa obligaciones por carga."
                />
              </div>
            </section>

            <section className="rounded-3xl border border-brand-beige-dark/20 bg-white/65 p-6 shadow-xl backdrop-blur-xl">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-lg font-semibold text-brand-near-black">
                  Embarques recientes
                </h2>
                <Link
                  href="/shipments"
                  className="text-sm font-medium text-brand-near-black hover:underline"
                >
                  Ver todos
                </Link>
              </div>
              {recentShipments.length === 0 ? (
                <EmptyState
                  icon={Ship}
                  title="Aún no hay embarques"
                  actionLabel="Crear transacción"
                  href="/transactions/new"
                  compact
                />
              ) : (
                <div className="mt-5 divide-y divide-brand-beige-dark/20">
                  {recentShipments.map((shipment) => (
                    <button
                      key={shipment.id}
                      type="button"
                      onClick={() => router.push(`/shipments/${shipment.id}`)}
                      className="flex w-full items-center justify-between gap-4 py-4 text-left"
                    >
                      <div>
                        <p className="text-sm font-medium text-brand-charcoal">
                          {shipment.reference}
                        </p>
                        <p className="mt-1 text-xs text-brand-gray">
                          {shipment.dueDate
                            ? formatDate(shipment.dueDate)
                            : "Sin vencimiento"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-brand-near-black">
                          {formatCurrency(shipment.totalAmount)}
                        </p>
                        <div className="mt-1">{getStatusBadge(shipment.status)}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-3xl border border-brand-beige-dark/20 bg-white/65 p-5 shadow-sm backdrop-blur-xl">
      <div className="mb-5 flex items-center justify-between">
        <div className="rounded-2xl bg-brand-beige p-3 text-brand-near-black">
          <Icon size={20} />
        </div>
      </div>
      <p className="text-sm text-brand-gray">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-brand-near-black">{value}</p>
      <p className="mt-2 text-xs text-brand-taupe">{detail}</p>
    </div>
  );
}

function QuickAction({
  href,
  icon: Icon,
  title,
  description,
}: {
  href: string;
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between gap-4 rounded-2xl border border-brand-beige-dark/20 bg-white/70 p-4 transition-all hover:bg-brand-beige/40"
    >
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-brand-beige p-2.5 text-brand-near-black">
          <Icon size={16} />
        </div>
        <div>
          <p className="text-sm font-semibold text-brand-near-black">{title}</p>
          <p className="mt-1 text-xs text-brand-gray">{description}</p>
        </div>
      </div>
      <ArrowRight size={14} className="text-brand-gray" />
    </Link>
  );
}

function EmptyState({
  icon: Icon,
  title,
  actionLabel,
  href,
  compact = false,
}: {
  icon: React.ElementType;
  title: string;
  actionLabel: string;
  href: string;
  compact?: boolean;
}) {
  return (
    <div className={`text-center text-brand-gray ${compact ? "py-8" : "px-6 py-16"}`}>
      <Icon size={compact ? 24 : 32} className="mx-auto mb-3 opacity-50" />
      <p>{title}</p>
      <Link
        href={href}
        className="mt-2 inline-block font-medium text-brand-near-black hover:underline"
      >
        {actionLabel}
      </Link>
    </div>
  );
}