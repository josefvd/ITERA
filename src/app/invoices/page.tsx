"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FileText, ArrowRight, Plus } from "lucide-react";
import { formatCurrency, formatDate, getStatusColor } from "@/lib/utils";

interface Invoice {
  id: string;
  invoiceNumber: string;
  amount: number;
  status: string;
  dueDate: string | null;
  issuedAt: string;
  paidAt: string | null;
  transaction: {
    vendorName: string;
  } | null;
}

export default function InvoicesPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    // Check auth first
    fetch("/api/transactions")
      .then((res) => {
        if (res.status === 401) {
          router.push("/signin");
          return null;
        }
        return res.json();
      })
      .then(() => {
        // Invoices would come from a dedicated API, but for now show placeholder
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load invoices");
        setLoading(false);
      });
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <div className="text-brand-gray text-lg">Loading invoices...</div>
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
              Invoices
            </h1>
            <p className="text-brand-gray mt-1">
              View and manage your invoices
            </p>
          </div>
          <Link
            href="/transactions/new"
            className="flex items-center gap-2 rounded-xl bg-brand-near-black text-white px-5 py-2.5 font-medium hover:bg-black transition-all text-sm"
          >
            <Plus size={16} />
            New Payment
          </Link>
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {/* Empty state */}
        <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-brand-beige-dark/20 shadow-sm">
          <div className="px-6 py-20 text-center">
            <div className="rounded-full bg-brand-beige w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <FileText size={28} className="text-brand-near-black" />
            </div>
            <h3 className="text-lg font-semibold text-brand-near-black mb-2">
              No invoices yet
            </h3>
            <p className="text-brand-gray mb-6 max-w-md mx-auto">
              Invoices will appear here once you create payments with invoice references.
            </p>
            <Link
              href="/transactions/new"
              className="inline-flex items-center gap-2 rounded-xl bg-brand-near-black text-white px-6 py-2.5 font-medium hover:bg-black transition-all text-sm"
            >
              Create a Payment <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}