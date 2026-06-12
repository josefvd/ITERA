"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowDownToLine,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  FileCheck2,
  Layers3,
  Plus,
  Search,
  ShieldCheck,
} from "lucide-react";
import { formatCurrency, formatDate, getStatusColor } from "@/lib/utils";

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

export default function TransactionsPage() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");

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
        if (data) {
          if (data.error) setError(data.error);
          else setTransactions(data.transactions || []);
        }
      })
      .catch(() => setError("Error al cargar transacciones"))
      .finally(() => setLoading(false));
  }, [router]);

  const filtered = transactions.filter((tx) => {
    const matchesSearch =
      tx.vendorName.toLowerCase().includes(search.toLowerCase()) ||
      (tx.vendorEmail &&
        tx.vendorEmail.toLowerCase().includes(search.toLowerCase())) ||
      tx.id.toLowerCase().includes(search.toLowerCase()) ||
      (tx.description &&
        tx.description.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = statusFilter === "all" || tx.status === statusFilter;
    const matchesMethod =
      methodFilter === "all" || tx.paymentMethod === methodFilter;
    const createdAt = new Date(tx.createdAt);
    const now = new Date();
    const daysDiff = Math.floor(
      (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );
    const matchesDate =
      dateFilter === "all" ||
      (dateFilter === "7" && daysDiff <= 7) ||
      (dateFilter === "30" && daysDiff <= 30);
    return matchesSearch && matchesStatus && matchesMethod && matchesDate;
  });
  const pendingCount = transactions.filter((tx) => tx.status === "pending").length;
  const approvedCount = transactions.filter((tx) =>
    ["completed", "paid"].includes(tx.status)
  ).length;
  const totalAmount = transactions.reduce((sum, tx) => sum + tx.amount, 0);
  const pendingAmount = transactions.reduce(
    (sum, tx) => (tx.status === "pending" ? sum + tx.amount : sum),
    0
  );
  const paymentMethods = Array.from(
    new Set(transactions.map((tx) => tx.paymentMethod).filter(Boolean))
  ) as string[];

  const getStatusLabel = (status: string) => {
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
      <div className="min-h-screen flex items-center justify-center pt-20">
        <div className="text-brand-gray text-lg">Cargando transacciones...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mb-8 rounded-3xl border border-brand-beige-dark/20 bg-white/65 p-6 shadow-xl backdrop-blur-xl">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <span className="text-xs font-semibold uppercase tracking-widest text-brand-gray">
                Pagos
              </span>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-brand-near-black">
                Transacciones
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-brand-gray">
                Busca, filtra y prepara aprobaciones para pagos de flete,
                proveedores y documentos logísticos.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-brand-beige-dark/30 px-5 py-3 text-sm font-medium text-brand-near-black transition-all hover:bg-brand-beige/50"
              >
                <Layers3 size={16} />
                Batch
              </button>
              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-brand-beige-dark/30 px-5 py-3 text-sm font-medium text-brand-near-black transition-all hover:bg-brand-beige/50"
              >
                <ShieldCheck size={16} />
                Aprobar
              </button>
              <Link
                href="/transactions/new"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-near-black px-5 py-3 text-sm font-medium text-white transition-all hover:bg-black"
              >
                <Plus size={16} />
                Crear transacción
              </Link>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
            {error}
          </div>
        )}

        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
          <StatCard
            icon={FileCheck2}
            label="Total"
            value={transactions.length.toString()}
            detail={formatCurrency(totalAmount)}
          />
          <StatCard
            icon={Clock}
            label="Pendientes"
            value={pendingCount.toString()}
            detail={formatCurrency(pendingAmount)}
          />
          <StatCard
            icon={CheckCircle2}
            label="Aprobadas"
            value={approvedCount.toString()}
            detail="Pagadas o completadas"
          />
          <StatCard
            icon={ArrowDownToLine}
            label="Exportación"
            value="CSV"
            detail="Disponible próximamente"
          />
        </div>

        <div className="mb-6 rounded-3xl border border-brand-beige-dark/20 bg-white/65 p-5 shadow-sm backdrop-blur-xl">
          <div className="grid gap-4 lg:grid-cols-[1.4fr_0.8fr_0.8fr_0.8fr_auto]">
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-gray"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar proveedor, correo, ID o referencia..."
                className="w-full rounded-xl border border-brand-beige-dark/30 bg-white pl-10 pr-4 py-2.5 text-sm text-brand-charcoal placeholder:text-brand-taupe transition-all focus:border-brand-near-black focus:outline-none focus:ring-2 focus:ring-brand-near-black/20"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-brand-beige-dark/30 bg-white px-4 py-2.5 text-sm text-brand-charcoal focus:outline-none focus:ring-2 focus:ring-brand-near-black/20"
            >
              <option value="all">Todos los estados</option>
              <option value="pending">Pendientes</option>
              <option value="processing">Procesando</option>
              <option value="completed">Completadas</option>
              <option value="paid">Pagadas</option>
              <option value="failed">Fallidas</option>
            </select>
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="rounded-xl border border-brand-beige-dark/30 bg-white px-4 py-2.5 text-sm text-brand-charcoal focus:outline-none focus:ring-2 focus:ring-brand-near-black/20"
            >
              <option value="all">Todos los métodos</option>
              {paymentMethods.map((method) => (
                <option key={method} value={method}>
                  {getMethodLabel(method)}
                </option>
              ))}
            </select>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="rounded-xl border border-brand-beige-dark/30 bg-white px-4 py-2.5 text-sm text-brand-charcoal focus:outline-none focus:ring-2 focus:ring-brand-near-black/20"
            >
              <option value="all">Todas las fechas</option>
              <option value="7">Últimos 7 días</option>
              <option value="30">Últimos 30 días</option>
            </select>
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setStatusFilter("all");
                setMethodFilter("all");
                setDateFilter("all");
              }}
              className="rounded-xl border border-brand-beige-dark/30 px-4 py-2.5 text-sm font-medium text-brand-warm-dark transition-all hover:bg-brand-beige/50"
            >
              Limpiar
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl border border-brand-beige-dark/20 bg-white/65 shadow-xl backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-brand-beige-dark/20 px-6 py-5">
            <div>
              <h2 className="text-lg font-semibold text-brand-near-black">
                Resultados
              </h2>
              <p className="mt-1 text-sm text-brand-gray">
                {filtered.length} de {transactions.length} transacciones
              </p>
            </div>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full border border-brand-beige-dark/30 px-4 py-2 text-sm font-medium text-brand-near-black transition-all hover:bg-brand-beige/50"
            >
              <ArrowDownToLine size={15} />
              Exportar
            </button>
          </div>

          {filtered.length === 0 ? (
            <div className="px-6 py-16 text-center text-brand-gray">
              <ArrowUpRight size={32} className="mx-auto mb-3 opacity-50" />
              <p>No se encontraron transacciones</p>
              <Link
                href="/transactions/new"
                className="text-brand-near-black font-medium hover:underline mt-2 inline-block"
              >
                Crea tu primer pago
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px]">
                <thead>
                  <tr className="border-b border-brand-beige-dark/20 bg-brand-beige-light/40">
                    <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-widest text-brand-gray">
                      Tipo
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-widest text-brand-gray">
                      ID / referencia
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-widest text-brand-gray">
                      Proveedor
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-widest text-brand-gray">
                      Monto
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-widest text-brand-gray">
                      Estado
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-widest text-brand-gray">
                      Método
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-widest text-brand-gray">
                      Fecha
                    </th>
                    <th className="text-right px-6 py-4 text-xs font-semibold uppercase tracking-widest text-brand-gray">
                      Acción
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-beige-dark/20">
                  {filtered.map((tx) => (
                    <tr
                      key={tx.id}
                      className="hover:bg-brand-beige/20 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <span className="rounded-full bg-brand-beige px-2.5 py-1 text-xs font-medium text-brand-warm-dark">
                          Pago
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-mono text-xs font-medium text-brand-near-black">
                          {tx.id.slice(0, 8).toUpperCase()}
                        </p>
                        <p className="mt-1 max-w-44 truncate text-xs text-brand-gray">
                          {extractReference(tx.description) || "Sin referencia"}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-brand-charcoal text-sm">
                          {tx.vendorName}
                        </p>
                        {tx.vendorEmail && (
                          <p className="text-xs text-brand-gray">
                            {tx.vendorEmail}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-brand-near-black text-sm">
                          {formatCurrency(tx.amount)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`text-xs font-medium px-2.5 py-1 rounded-full ${getStatusColor(
                            tx.status
                          )}`}
                        >
                          {getStatusLabel(tx.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-brand-charcoal">
                        {tx.paymentMethod ? (
                          <span>{getMethodLabel(tx.paymentMethod)}</span>
                        ) : (
                          <span className="text-brand-taupe">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-brand-gray">
                        {formatDate(tx.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/transactions/${tx.id}`}
                          className="inline-flex items-center gap-1 rounded-full border border-brand-beige-dark/30 px-3 py-1.5 text-sm font-medium text-brand-near-black transition-all hover:bg-brand-beige/50"
                        >
                          Ver <ArrowRight size={12} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
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
      <div className="mb-4 flex items-center justify-between">
        <div className="rounded-2xl bg-brand-beige p-3 text-brand-near-black">
          <Icon size={19} />
        </div>
      </div>
      <p className="text-sm text-brand-gray">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-brand-near-black">{value}</p>
      <p className="mt-2 text-xs text-brand-taupe">{detail}</p>
    </div>
  );
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

function extractReference(description: string | null) {
  if (!description) return null;
  const match = description.match(/Referencia\s(?:AWB|BOL|Factura|Otro):\s(.+)/i);
  return match?.[1]?.split("\n")[0] ?? null;
}