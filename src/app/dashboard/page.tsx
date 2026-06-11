"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Wallet,
  ArrowUpRight,
  Plus,
  Receipt,
  ArrowRight,
  Clock,
  Ship,
} from "lucide-react";
import { formatCurrency, formatDate, getStatusColor } from "@/lib/utils";
import { siteConfig } from "@/lib/constants";

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
  const recentTransactions = transactions.slice(0, 5);
  const recentShipments = shipments.slice(0, 5);

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
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-brand-near-black">
              Dashboard
            </h1>
            <p className="text-brand-gray mt-1">
              Bienvenido de nuevo a {siteConfig.name}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/shipments"
              className="flex items-center gap-2 rounded-xl border border-brand-beige-dark/30 text-brand-near-black px-4 py-2.5 font-medium hover:bg-brand-beige/30 transition-all text-sm"
            >
              <Ship size={16} />
              Embarques
            </Link>
            <Link
              href="/transactions/new"
              className="flex items-center gap-2 rounded-xl bg-brand-near-black text-white px-5 py-2.5 font-medium hover:bg-black transition-all text-sm"
            >
              <Plus size={16} />
              Nuevo pago
            </Link>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {/* Stat cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-brand-beige-dark/20 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="rounded-xl bg-brand-beige p-3">
                <Wallet size={20} className="text-brand-near-black" />
              </div>
            </div>
            <p className="text-sm text-brand-gray mb-1">Balance total</p>
            <p className="text-2xl font-bold text-brand-near-black">
              {formatCurrency(totalBalance)}
            </p>
          </div>

          <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-brand-beige-dark/20 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="rounded-xl bg-brand-beige p-3">
                <Receipt size={20} className="text-brand-near-black" />
              </div>
            </div>
            <p className="text-sm text-brand-gray mb-1">Transacciones</p>
            <p className="text-2xl font-bold text-brand-near-black">
              {transactions.length}
            </p>
          </div>

          <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-brand-beige-dark/20 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="rounded-xl bg-brand-beige p-3">
                <Clock size={20} className="text-brand-near-black" />
              </div>
            </div>
            <p className="text-sm text-brand-gray mb-1">Pendientes</p>
            <p className="text-2xl font-bold text-brand-near-black">
              {formatCurrency(pendingTotal)}
            </p>
          </div>
        </div>

        {/* Recent shipments */}
        <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-brand-beige-dark/20 shadow-sm mb-10">
          <div className="flex items-center justify-between px-6 py-5 border-b border-brand-beige-dark/20">
            <h2 className="text-lg font-semibold text-brand-near-black flex items-center gap-2">
              <Ship size={18} />
              Embarques recientes
            </h2>
            <Link
              href="/shipments"
              className="flex items-center gap-1 text-sm font-medium text-brand-near-black hover:underline"
            >
              Ver todos <ArrowRight size={14} />
            </Link>
          </div>

          {recentShipments.length === 0 ? (
            <div className="px-6 py-12 text-center text-brand-gray">
              <Ship size={32} className="mx-auto mb-3 opacity-50" />
              <p>Aún no hay embarques</p>
              <Link
                href="/transactions/new"
                className="text-brand-near-black font-medium hover:underline mt-2 inline-block"
              >
                Crea tu primer embarque
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-brand-beige-dark/20">
              {recentShipments.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between px-6 py-4 hover:bg-brand-beige/20 transition-colors cursor-pointer"
                  onClick={() => router.push(`/shipments/${s.id}`)}
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-brand-beige p-2">
                      <Ship size={14} className="text-brand-near-black" />
                    </div>
                    <div>
                      <p className="font-medium text-brand-charcoal text-sm">
                        {s.reference}
                      </p>
                      <p className="text-xs text-brand-gray">
                        {s.dueDate ? formatDate(s.dueDate) : "Sin vencimiento"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-brand-near-black">
                      {formatCurrency(s.totalAmount)}
                    </span>
                    {getStatusBadge(s.status)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent transactions */}
        <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-brand-beige-dark/20 shadow-sm mb-10">
          <div className="flex items-center justify-between px-6 py-5 border-b border-brand-beige-dark/20">
            <h2 className="text-lg font-semibold text-brand-near-black">
              Transacciones recientes
            </h2>
            <Link
              href="/transactions"
              className="flex items-center gap-1 text-sm font-medium text-brand-near-black hover:underline"
            >
              Ver todas <ArrowRight size={14} />
            </Link>
          </div>

          {recentTransactions.length === 0 ? (
            <div className="px-6 py-12 text-center text-brand-gray">
              <Receipt size={32} className="mx-auto mb-3 opacity-50" />
              <p>Aún no hay transacciones</p>
              <Link
                href="/transactions/new"
                className="text-brand-near-black font-medium hover:underline mt-2 inline-block"
              >
                Crea tu primer pago
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-brand-beige-dark/20">
              {recentTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between px-6 py-4 hover:bg-brand-beige/20 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-brand-beige p-2">
                      <ArrowUpRight size={14} className="text-brand-near-black" />
                    </div>
                    <div>
                      <p className="font-medium text-brand-charcoal text-sm">
                        {tx.vendorName}
                      </p>
                      <p className="text-xs text-brand-gray">
                        {formatDate(tx.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-brand-near-black">
                      {formatCurrency(tx.amount)}
                    </span>
                    <span
                      className={`text-xs font-medium px-2.5 py-1 rounded-full ${getStatusColor(
                        tx.status
                      )}`}
                    >
                      {tx.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/transactions/new"
            className="flex items-center justify-between bg-white/60 backdrop-blur-xl rounded-2xl border border-brand-beige-dark/20 p-5 hover:shadow-md transition-all"
          >
            <div>
              <p className="font-semibold text-brand-near-black">Nuevo pago</p>
              <p className="text-sm text-brand-gray">Envía un pago a un proveedor</p>
            </div>
            <div className="rounded-full bg-brand-beige p-2.5">
              <Plus size={16} className="text-brand-near-black" />
            </div>
          </Link>

          <Link
            href="/shipments"
            className="flex items-center justify-between bg-white/60 backdrop-blur-xl rounded-2xl border border-brand-beige-dark/20 p-5 hover:shadow-md transition-all"
          >
            <div>
              <p className="font-semibold text-brand-near-black">Nuevo Embarque</p>
              <p className="text-sm text-brand-gray">Gestiona tus embarques y pagos</p>
            </div>
            <div className="rounded-full bg-brand-beige p-2.5">
              <Ship size={16} className="text-brand-near-black" />
            </div>
          </Link>

          <Link
            href="/transactions"
            className="flex items-center justify-between bg-white/60 backdrop-blur-xl rounded-2xl border border-brand-beige-dark/20 p-5 hover:shadow-md transition-all"
          >
            <div>
              <p className="font-semibold text-brand-near-black">Transacciones</p>
              <p className="text-sm text-brand-gray">Ver historial de pagos</p>
            </div>
            <div className="rounded-full bg-brand-beige p-2.5">
              <Receipt size={16} className="text-brand-near-black" />
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}