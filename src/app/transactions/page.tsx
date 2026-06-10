"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Search, ArrowUpRight, ArrowRight } from "lucide-react";
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
        tx.vendorEmail.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = statusFilter === "all" || tx.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-brand-near-black">
              Transacciones
            </h1>
            <p className="text-brand-gray mt-1">
              Ve y administra todos tus pagos
            </p>
          </div>
          <Link
            href="/transactions/new"
            className="flex items-center gap-2 rounded-xl bg-brand-near-black text-white px-5 py-2.5 font-medium hover:bg-black transition-all text-sm"
          >
            <Plus size={16} />
            Nueva transacción
          </Link>
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-gray"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre o correo del proveedor..."
              className="w-full rounded-xl border border-brand-beige-dark/30 bg-white/60 backdrop-blur-sm pl-10 pr-4 py-2.5 text-brand-charcoal placeholder:text-brand-taupe focus:outline-none focus:ring-2 focus:ring-brand-near-black/20 focus:border-brand-near-black transition-all text-sm"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-brand-beige-dark/30 bg-white/60 backdrop-blur-sm px-4 py-2.5 text-brand-charcoal focus:outline-none focus:ring-2 focus:ring-brand-near-black/20 text-sm"
          >
            <option value="all">Todas</option>
            <option value="pending">Pendientes</option>
            <option value="processing">Procesando</option>
            <option value="completed">Completadas</option>
            <option value="failed">Fallidas</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-brand-beige-dark/20 shadow-sm overflow-hidden">
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
                      Estado
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider text-brand-gray">
                      Método
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider text-brand-gray">
                      Fecha
                    </th>
                    <th className="text-right px-6 py-4 text-xs font-semibold uppercase tracking-wider text-brand-gray">
                      Detalles
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
                          {tx.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-brand-charcoal">
                        {tx.paymentMethod ? (
                          <span className="capitalize">{tx.paymentMethod}</span>
                        ) : (
                          <span className="text-brand-taupe">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-brand-gray">
                        {formatDate(tx.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href="#"
                          className="inline-flex items-center gap-1 text-sm font-medium text-brand-near-black hover:underline"
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