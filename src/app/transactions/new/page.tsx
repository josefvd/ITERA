"use client";

import { useState, useRef, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  FileText,
  Paperclip,
  Save,
} from "lucide-react";
import Link from "next/link";
import { getInitialTransactionStatus, serviceCategories } from "@/lib/transaction-form";

export default function NewTransactionPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    vendorId: "",
    vendorName: "",
    vendorEmail: "",
    serviceType: "Flete marítimo",
    referenceType: "",
    referenceNumber: "",
    relatedReference: "",

    paymentDate: "",
    paymentTiming: "today",
    amount: "",
    commercialValue: "",
    description: "",
    paymentMethod: "local_transfer",
    attachmentName: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [ocrRunning, setOcrRunning] = useState(false);
  const [vendors, setVendors] = useState<Array<{ id: string; name: string; billingEmail: string }>>([]);
  const [vendorDraft, setVendorDraft] = useState({ name: "", billingEmail: "" });
  const [vendorError, setVendorError] = useState("");
  const [vendorSaving, setVendorSaving] = useState(false);
  useEffect(() => {
    fetch("/api/vendors").then((response) => response.json()).then((data) => {
      if (Array.isArray(data.vendors)) setVendors(data.vendors);
    }).catch(() => setVendorError("No se pudo cargar el directorio de proveedores."));
  }, []);
  const [ocrResult, setOcrResult] = useState<{
    confidence: number;
    source: string;
    message?: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleOcrFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setOcrRunning(true);
    setOcrResult(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("source", "uploaded_image");
      const res = await fetch("/api/ocr/parse", { method: "POST", body: fd });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
        return;
      }
      const ex = data.extracted;
      // The document is analyzed, but vendor/payment values are never assumed from OCR.
      setForm((previous) => ({ ...previous, attachmentName: file.name }));

      setOcrResult({
        confidence: ex.confidence,
        source: ex.source,
        message: ex.rawText,
      });
    } catch {
      setError("Error al procesar la factura");
    } finally {
      setOcrRunning(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    const initialStatus = getInitialTransactionStatus(
      form.paymentTiming as "today" | "scheduled",
      form.paymentDate
    );
    if (
      !form.vendorId ||
      !form.referenceNumber ||
      !form.amount ||
      parseFloat(form.amount) <= 0
    ) {
      setError("Proveedor, referencia y monto válido son obligatorios.");
      return;
    }
    if (!form.vendorEmail.trim()) {
      setError("El proveedor seleccionado no tiene correo facturable. Selecciona otro proveedor o agrega uno con correo válido.");
      return;
    }
    if (!initialStatus) {
      setError("Selecciona una fecha futura para programar el pago.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendorId: form.vendorId,
          amount: form.amount,
          description: buildDescription(),
          paymentMethod: form.paymentMethod,
          referenceType: form.referenceType || null,
          referenceNumber: form.referenceNumber,
          serviceType: form.serviceType,
          relatedReference: form.relatedReference || null,
          commercialValue: form.commercialValue || null,
          paymentTiming: form.paymentTiming,
          scheduledFor: form.paymentTiming === "scheduled" ? form.paymentDate : null,
          status: initialStatus,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Error al crear la transacción");
        return;
      }

      router.push("/transactions");
    } catch {
      setError("Algo salió mal. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  const updateField = (field: string) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  async function addVendor() {
    setVendorError("");
    setVendorSaving(true);
    try {
      const response = await fetch("/api/vendors", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(vendorDraft),
      });
      const data = await response.json();
      if (!response.ok) { setVendorError(data.error || "No se pudo guardar el proveedor."); return; }
      setVendors((current) => [...current, data.vendor].sort((a, b) => a.name.localeCompare(b.name)));
      setForm((current) => ({ ...current, vendorId: data.vendor.id, vendorName: data.vendor.name, vendorEmail: data.vendor.billingEmail }));
      setVendorDraft({ name: "", billingEmail: "" });
    } catch { setVendorError("No se pudo guardar el proveedor."); }
    finally { setVendorSaving(false); }
  }

  const paymentMethods = [
    {
      value: "local_transfer",
      label: "Transferencia local",
    },
    {
      value: "international_transfer",
      label: "Transferencia internacional",
    },
    {
      value: "card",
      label: "Tarjeta crédito/débito",
    },
  ];

  const selectedPayment = paymentMethods.find(
    (method) => method.value === form.paymentMethod
  );
  const amount = parseFloat(form.amount) || 0;

  function buildDescription() {
    return [
      form.attachmentName && `Adjunto declarado: ${form.attachmentName}`,
      form.description && `Notas internas: ${form.description}`,
    ].filter(Boolean).join("\n") || null;
  }

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Back link */}
        <Link
          href="/transactions"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-gray hover:text-brand-charcoal mb-6 transition-colors"
        >
          <ArrowLeft size={14} />
          Volver a transacciones
        </Link>

        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="mt-3 text-3xl font-bold text-brand-near-black">
              Crear transacción
            </h1>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
            {error}
          </div>
        )}

        <form
          onSubmit={(event) => handleSubmit(event)}
          className="grid gap-6 lg:grid-cols-[1.35fr_0.85fr]"
        >
          <div className="space-y-6">
            <section className="rounded-3xl border border-brand-beige-dark/20 bg-white/65 p-6 shadow-xl backdrop-blur-xl">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-beige text-brand-near-black">
                  <FileText size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-brand-near-black">
                    Datos de proveedor y referencia
                  </h2>
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <SelectField
                  id="vendorId"
                  label="Proveedor / facturador *"
                  value={form.vendorId}
                  onChange={(event) => {
                    const vendor = vendors.find((item) => item.id === event.target.value);
                    setForm((current) => ({ ...current, vendorId: vendor?.id || "", vendorName: vendor?.name || "", vendorEmail: vendor?.billingEmail || "" }));
                  }}
                  options={[["", "Selecciona un proveedor"], ...vendors.map((vendor) => [vendor.id, vendor.name] as [string, string])]}
                />
                <div>
                  <Field
                    id="vendorEmail"
                    type="email"
                    label="Correo facturable"
                    value={form.vendorEmail}
                    onChange={() => undefined}
                    placeholder="Se completa desde el directorio"
                    readOnly
                  />
                  {form.vendorId && !form.vendorEmail.trim() && (
                    <p role="alert" className="mt-2 text-sm text-red-700">
                      El proveedor seleccionado no tiene correo facturable. Selecciona otro proveedor o agrega uno con correo válido.
                    </p>
                  )}
                </div>
                <SelectField
                  id="serviceType"
                  label="Tipo de servicio"
                  value={form.serviceType}
                  onChange={updateField("serviceType")}
                  options={serviceCategories.map(
                    (category) => [category, category] as [string, string]
                  )}
                />
                <SelectField
                  id="referenceType"
                  label="Tipo de referencia"
                  value={form.referenceType}
                  onChange={updateField("referenceType")}
                  options={[
                    ["", "Opcional"],
                    ["AWB", "AWB"],
                    ["BOL", "BOL"],
                    ["Factura", "Factura"],
                    ["Otro", "Otro"],
                  ]}
                />
                <Field
                  id="referenceNumber"
                  label="Número de referencia *"
                  value={form.referenceNumber}
                  onChange={updateField("referenceNumber")}
                  placeholder="786 08970894"
                />
                <Field
                  id="relatedReference"
                  label="BOL / AWB relacionado"
                  value={form.relatedReference}
                  onChange={updateField("relatedReference")}
                  placeholder="Referencia opcional"
                />
              </div>
              <div className="mt-5 grid gap-3 rounded-xl bg-brand-beige-light/50 p-4 sm:grid-cols-[1fr_1fr_auto]">
                <input aria-label="Nombre del proveedor" value={vendorDraft.name} onChange={(event) => setVendorDraft((current) => ({ ...current, name: event.target.value }))} placeholder="Nombre del proveedor" maxLength={160} className="rounded-lg border border-brand-beige-dark/30 bg-white px-3 py-2 text-sm" />
                <input aria-label="Correo facturable del proveedor" type="email" value={vendorDraft.billingEmail} onChange={(event) => setVendorDraft((current) => ({ ...current, billingEmail: event.target.value }))} placeholder="Correo facturable" maxLength={254} className="rounded-lg border border-brand-beige-dark/30 bg-white px-3 py-2 text-sm" />
                <button type="button" onClick={() => void addVendor()} disabled={vendorSaving} className="rounded-lg bg-brand-near-black px-3 py-2 text-sm text-white disabled:opacity-50">{vendorSaving ? "Guardando..." : "Agregar proveedor"}</button>
                {vendorError && <p className="text-sm text-red-700 sm:col-span-3">{vendorError}</p>}
              </div>
            </section>

            <section className="rounded-3xl border border-brand-beige-dark/20 bg-white/65 p-6 shadow-xl backdrop-blur-xl">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-beige text-brand-near-black">
                  <CalendarDays size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-brand-near-black">
                    Fechas, monto y documentos
                  </h2>
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <Field
                  id="amount"
                  type="number"
                  label="Monto a pagar *"
                  value={form.amount}
                  onChange={updateField("amount")}
                  placeholder="0.00"
                />
                <Field
                  id="commercialValue"
                  type="number"
                  label="Valor comercial de la carga"
                  value={form.commercialValue}
                  onChange={updateField("commercialValue")}
                  placeholder="0.00"
                />
                <Field
                  id="paymentDate"
                  type="date"
                  label="Fecha programada"
                  value={form.paymentDate}
                  onChange={updateField("paymentDate")}
                  placeholder=""
                  min={new Date(Date.now() + 86400000).toISOString().slice(0, 10)}
                  disabled={form.paymentTiming !== "scheduled"}
                />
              </div>
              <fieldset className="mt-5">
                <legend className="mb-2 text-sm font-medium text-brand-warm-dark">Fecha del pago</legend>
                {[
                  ["today", "Pagar hoy"],
                  ["scheduled", "Programar pago"],
                ].map(([value, label]) => (
                  <label
                    key={value}
                    className="mr-5 inline-flex items-center gap-2 text-sm"
                  >
                    <input
                      type="radio"
                      name="paymentTiming"
                      value={value}
                      checked={form.paymentTiming === value}
                      onChange={updateField("paymentTiming")}
                    />
                    {label}
                  </label>
                ))}
              </fieldset>

              <div className="mt-5">
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-brand-warm-dark mb-1.5"
                >
                  Notas internas
                </label>
                <textarea
                  id="description"
                  rows={4}
                  value={form.description}
                  onChange={updateField("description")}
                  className="w-full resize-none rounded-xl border border-brand-beige-dark/30 bg-white px-4 py-2.5 text-brand-charcoal placeholder:text-brand-taupe transition-all focus:border-brand-near-black focus:outline-none focus:ring-2 focus:ring-brand-near-black/20"
                  placeholder="Notas internas, instrucciones de liberación o detalle de factura."
                />
              </div>

              <div className="mt-5 rounded-2xl border border-dashed border-brand-beige-dark/50 bg-brand-beige-light/60 p-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-start gap-3">
                    <Paperclip size={20} className="mt-0.5 text-brand-warm-dark" />
                    <div>
                      <p className="text-sm font-semibold text-brand-near-black">
                        Factura o documento comercial
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleOcrFile}
                      className="hidden"
                      id="ocr-file"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={ocrRunning}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-near-black text-white px-4 py-2 text-sm font-medium hover:bg-black transition-all disabled:opacity-50"
                    >
                      {ocrRunning ? "Procesando..." : "Subir foto de factura"}
                    </button>
                    {form.attachmentName && !ocrRunning && (
                      <span className="text-xs text-brand-gray text-center">
                        {form.attachmentName}
                      </span>
                    )}
                  </div>
                </div>
                {ocrResult && (
                  <div className="mt-3 flex items-center gap-2 rounded-xl bg-green-50 border border-green-200 px-4 py-2.5 text-sm text-green-700">
                    <CheckCircle2 size={16} />
                    <span>
                      Factura procesada ({Math.round(ocrResult.confidence * 100)}% confianza).
                    </span>
                  </div>
                )}
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            <section className="rounded-3xl border border-brand-beige-dark/20 bg-white/75 p-6 shadow-xl backdrop-blur-xl">
              <h2 className="text-lg font-semibold text-brand-near-black">
                Método de pago
              </h2>

              <div className="mt-5 grid gap-3">
                {paymentMethods.map((method) => (
                  <label
                    key={method.value}
                    className={`cursor-pointer rounded-2xl border p-4 transition-all ${
                      form.paymentMethod === method.value
                        ? "border-brand-near-black bg-brand-beige"
                        : "border-brand-beige-dark/20 bg-white"
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={method.value}
                      checked={form.paymentMethod === method.value}
                      onChange={updateField("paymentMethod")}
                      className="sr-only"
                      aria-label={method.label}
                    />
                    <span className="block text-sm font-semibold text-brand-near-black">
                      {method.label}
                    </span>

                  </label>
                ))}
              </div>
            </section>

            <section className="rounded-3xl border border-brand-beige-dark/20 bg-brand-near-black p-6 text-white shadow-xl">
              <h2 className="text-lg font-semibold">Resumen del pago</h2>
              <div className="mt-6 space-y-3 text-sm">
                <SummaryRow label="Proveedor" value={form.vendorName || "Pendiente"} dark />
                <SummaryRow
                  label="Referencia"
                  value={
                    form.referenceNumber
                      ? `${form.referenceType} ${form.referenceNumber}`
                      : "Pendiente"
                  }
                  dark
                />
                <SummaryRow label="Método" value={selectedPayment?.label || "Pendiente"} dark />
                <SummaryRow label="Monto" value={formatMoney(amount)} dark />
              </div>

              <div className="mt-6 grid gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-medium text-brand-near-black transition-all hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? (
                    "Guardando..."
                  ) : (
                    <>
                      <Save size={16} />
                      Guardar transacción
                    </>
                  )}
                </button>

              </div>
            </section>

            <section className="rounded-3xl border border-brand-beige-dark/20 bg-white/65 p-6 shadow-xl backdrop-blur-xl">
              <h2 className="text-lg font-semibold text-brand-near-black">
                Estado del pago
              </h2>
              <div className="mt-5 space-y-4">
                {["Creada", form.paymentTiming === "scheduled" ? "Programada" : "Marcar como pagada"].map(
                  (item, index) => (
                    <div key={item} className="flex items-center gap-3">
                      <span
                        className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                          index === 0
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
        </form>
      </div>
    </div>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  min,
  disabled = false,
  readOnly = false,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => void;
  placeholder: string;
  type?: string;
  min?: string;
  disabled?: boolean;
  readOnly?: boolean;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 block text-sm font-medium text-brand-warm-dark"
      >
        {label}
      </label>
      <input
        id={id}
        type={type}
        step={type === "number" ? "0.01" : undefined}
        min={min || (type === "number" ? "0" : undefined)}
        disabled={disabled}
        readOnly={readOnly}
        value={value}
        onChange={onChange}
        className="w-full rounded-xl border border-brand-beige-dark/30 bg-white px-4 py-2.5 text-brand-charcoal placeholder:text-brand-taupe transition-all focus:border-brand-near-black focus:outline-none focus:ring-2 focus:ring-brand-near-black/20"
        placeholder={placeholder}
      />
    </div>
  );
}

function SelectField({
  id,
  label,
  value,
  onChange,
  options,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => void;
  options: Array<[string, string]>;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 block text-sm font-medium text-brand-warm-dark"
      >
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={onChange}
        className="w-full rounded-xl border border-brand-beige-dark/30 bg-white px-4 py-2.5 text-brand-charcoal transition-all focus:border-brand-near-black focus:outline-none focus:ring-2 focus:ring-brand-near-black/20"
      >
        {options.map(([optionValue, label]) => (
          <option key={optionValue} value={optionValue}>
            {label}
          </option>
        ))}
      </select>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  dark = false,
}: {
  label: string;
  value: string;
  dark?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className={dark ? "text-white/55" : "text-brand-gray"}>{label}</span>
      <span
        className={`text-right font-medium ${
          dark ? "text-white" : "text-brand-near-black"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("es-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}