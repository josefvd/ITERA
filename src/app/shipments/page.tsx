"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Ship,
  Plus,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowRight,
  FileText,
  MessageCircle,
} from "lucide-react";
import { formatCurrency, formatDate, getStatusColor } from "@/lib/utils";

interface Shipment {
  id: string;
  reference: string;
  totalAmount: number;
  status: string;
  dueDate: string | null;
  urgency: string;
  invoiceCount: number;
  vendors: string[];
  createdAt: string;
}

export default function ShipmentsPage() {
  const router = useRouter();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/shipments")
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
          else setShipments(data.shipments || []);
        }
      })
      .catch(() => setError("Error al cargar los embarques"))
      .finally(() => setLoading(false));
  }, [router]);

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      paid: "bg-green-100 text-green-800",
      processing: "bg-blue-100 text-blue-800",
      overdue: "bg-red-100 text-red-800",
      cancelled: "bg-gray-100 text-gray-800",
    };
    const labels: Record<string, string> = {
      pending: "Pendiente",
      paid: "Pagado",
      processing: "Procesando",
      overdue: "Vencido",
      cancelled: "Cancelado",
    };
    return (
      <span
        className={`text-xs font-medium px-2.5 py-1 rounded-full ${
          colors[status] || "bg-gray-100 text-gray-800"
        }`}
      >
        {labels[status] || status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <div className="text-brand-gray text-lg">Cargando embarques...</div>
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
              Embarques
            </h1>
            <p className="text-brand-gray mt-1">
              Gestiona tus embarques y obligaciones de pago
            </p>
          </div>
          <Link
            href="/transactions/new"
            className="flex items-center gap-2 rounded-xl bg-brand-near-black text-white px-5 py-2.5 font-medium hover:bg-black transition-all text-sm"
          >
            <Plus size={16} />
            Nuevo Embarque
          </Link>
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {/* Forwarding info */}
        <div className="mb-8 bg-white/70 backdrop-blur-sm rounded-2xl border border-brand-beige-dark/20 p-5 flex items-start gap-4">
          <div className="flex-shrink-0 rounded-full bg-brand-beige w-10 h-10 flex items-center justify-center">
            <MessageCircle size={20} className="text-brand-warm-dark" />
          </div>
          <div>
            <p className="text-sm font-medium text-brand-charcoal mb-1">
              Reenvía facturas a <span className="font-bold text-brand-near-black">invoices@itera.com</span> o vía WhatsApp
            </p>
            <p className="text-xs text-brand-gray">
              ITERA extrae la información automáticamente y agrupa todas las obligaciones por embarque.
              Un solo clic para pagar todo.
            </p>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-brand-beige-dark/20 shadow-sm overflow-hidden">
          {shipments.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="rounded-full bg-brand-beige w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Ship size={28} className="text-brand-near-black" />
              </div>
              <h3 className="text-lg font-semibold text-brand-near-black mb-2">
                Aún no hay embarques
              </h3>
              <p className="text-brand-gray mb-6 max-w-md mx-auto">
                Crea tu primer embarque para empezar a gestionar pagos a proveedores.
              </p>
              <Link
                href="/transactions/new"
                className="inline-flex items-center gap-2 rounded-xl bg-brand-near-black text-white px-6 py-2.5 font-medium hover:bg-black transition-all text-sm"
              >
                Nuevo Embarque <ArrowRight size={14} />
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-brand-beige-dark/20">
                    <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider text-brand-gray">
                      Referencia
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider text-brand-gray">
                      Monto
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider text-brand-gray">
                      Vencimiento
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider text-brand-gray">
                      Proveedor(es)
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider text-brand-gray">
                      Estado
                    </th>
                    <th className="text-center px-6 py-4 text-xs font-semibold uppercase tracking-wider text-brand-gray">
                      Urgencia
                    </th>
                    <th className="text-center px-6 py-4 text-xs font-semibold uppercase tracking-wider text-brand-gray">
                      Facturas
                    </th>
                    <th className="text-right px-6 py-4 text-xs font-semibold uppercase tracking-wider text-brand-gray">
                      Detalle
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-beige-dark/20">
                  {shipments.map((s) => (
                    <tr
                      key={s.id}
                      className="hover:bg-brand-beige/20 transition-colors cursor-pointer"
                      onClick={() => router.push(`/shipments/${s.id}`)}
                    >
                      <td className="px-6 py-4">
                        <p className="font-medium text-brand-charcoal text-sm">
                          {s.reference}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-brand-near-black text-sm">
                          {formatCurrency(s.totalAmount)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-brand-gray">
                        {s.dueDate ? formatDate(s.dueDate) : "—"}
                      </td>
                      <td className="px-6 py-4 text-sm text-brand-charcoal">
                        {s.vendors && s.vendors.length > 0
                          ? s.vendors.filter(Boolean).join(", ")
                          : "—"}
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(s.status)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {s.urgency === "high" || s.urgency === "critical" ? (
                          <span className="inline-flex items-center gap-1 text-amber-600" title="Alta urgencia">
                            <AlertTriangle size={16} />
                          </span>
                        ) : s.urgency === "urgent" ? (
                          <span className="inline-flex items-center gap-1 text-red-600" title="Urgente">
                            <AlertTriangle size={16} />
                          </span>
                        ) : (
                          <span className="text-brand-taupe">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center justify-center text-xs font-medium bg-brand-beige/50 text-brand-charcoal px-2.5 py-1 rounded-full">
                          {s.invoiceCount || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <ArrowRight size={14} className="inline text-brand-gray" />
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