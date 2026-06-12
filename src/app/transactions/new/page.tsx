"use client";

import { useState, FormEvent } from "react";
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

export default function NewTransactionPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    vendorName: "",
    vendorEmail: "",
    serviceType: "cargo",
    referenceType: "AWB",
    referenceNumber: "",
    relatedReference: "",
    customerReference: "",
    departureDate: "",
    arrivalDate: "",
    paymentDate: "",
    direction: "importacion",
    hasArrived: "no",
    amount: "",
    commercialValue: "",
    description: "",
    paymentMethod: "financiamiento",
    attachmentName: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent, approveNow = false) {
    e.preventDefault();
    setError("");

    if (
      !form.vendorName ||
      !form.referenceNumber ||
      !form.amount ||
      parseFloat(form.amount) <= 0
    ) {
      setError("Proveedor, referencia y monto válido son obligatorios.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendorName: form.vendorName,
          vendorEmail: form.vendorEmail || undefined,
          amount: form.amount,
          description: buildDescription(approveNow),
          paymentMethod: form.paymentMethod,
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

  const paymentMethods = [
    {
      value: "financiamiento",
      label: "Financiamiento ITERA",
      description: "Usa crédito disponible para liberar el pago.",
    },
    {
      value: "ach",
      label: "Débito ACH",
      description: "Pago desde cuenta bancaria autorizada.",
    },
    {
      value: "wire",
      label: "Transferencia bancaria",
      description: "Para operaciones manuales o de mayor monto.",
    },
  ];

  const selectedPayment = paymentMethods.find(
    (method) => method.value === form.paymentMethod
  );
  const amount = parseFloat(form.amount) || 0;
  const serviceFee = amount > 0 ? Math.max(amount * 0.012, 8) : 0;
  const financingFee = form.paymentMethod === "financiamiento" ? amount * 0.018 : 0;
  const total = amount + serviceFee + financingFee;

  function buildDescription(approveNow: boolean) {
    return [
      form.description,
      `Referencia ${form.referenceType}: ${form.referenceNumber}`,
      form.relatedReference && `Referencia relacionada: ${form.relatedReference}`,
      form.customerReference && `Referencia cliente: ${form.customerReference}`,
      `Tipo de servicio: ${form.serviceType}`,
      `Dirección: ${form.direction}`,
      `Carga recibida: ${form.hasArrived === "si" ? "Sí" : "No"}`,
      form.departureDate && `Salida: ${form.departureDate}`,
      form.arrivalDate && `Llegada: ${form.arrivalDate}`,
      form.paymentDate && `Fecha de pago: ${form.paymentDate}`,
      form.commercialValue && `Valor comercial: ${form.commercialValue}`,
      form.attachmentName && `Adjunto declarado: ${form.attachmentName}`,
      approveNow ? "Acción: guardar y aprobar pago" : "Acción: guardar transacción",
    ]
      .filter(Boolean)
      .join("\n");
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
            <span className="text-xs font-semibold uppercase tracking-widest text-brand-gray">
              Transacción
            </span>
            <h1 className="mt-3 text-3xl font-bold text-brand-near-black">
              Crear transacción
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-brand-gray">
              Registra el proveedor, la referencia logística, el monto y los
              documentos necesarios antes de guardar o aprobar el pago.
            </p>
          </div>
          <div className="rounded-2xl border border-brand-beige-dark/20 bg-white/60 px-5 py-4 text-sm text-brand-gray backdrop-blur-xl">
            <span className="font-semibold text-brand-near-black">
              Estado inicial:
            </span>{" "}
            Creado, pendiente de aprobación
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
                  <p className="text-sm text-brand-gray">
                    Identifica a quién se paga y qué documento libera la carga.
                  </p>
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <Field
                  id="vendorName"
                  label="Proveedor / facturador *"
                  value={form.vendorName}
                  onChange={updateField("vendorName")}
                  placeholder="American Airlines Cargo"
                />
                <Field
                  id="vendorEmail"
                  type="email"
                  label="Correo del proveedor"
                  value={form.vendorEmail}
                  onChange={updateField("vendorEmail")}
                  placeholder="billing@proveedor.com"
                />
                <SelectField
                  id="serviceType"
                  label="Tipo de servicio"
                  value={form.serviceType}
                  onChange={updateField("serviceType")}
                  options={[
                    ["cargo", "Cargo / flete"],
                    ["aduana", "Aduana"],
                    ["terminal", "Terminal"],
                    ["almacenaje", "Almacenaje"],
                  ]}
                />
                <SelectField
                  id="referenceType"
                  label="Tipo de referencia"
                  value={form.referenceType}
                  onChange={updateField("referenceType")}
                  options={[
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
                <Field
                  id="customerReference"
                  label="Referencia de cliente"
                  value={form.customerReference}
                  onChange={updateField("customerReference")}
                  placeholder="Orden / PO / cliente"
                />
                <SelectField
                  id="direction"
                  label="Dirección"
                  value={form.direction}
                  onChange={updateField("direction")}
                  options={[
                    ["importacion", "Importación"],
                    ["exportacion", "Exportación"],
                    ["domestico", "Doméstico"],
                  ]}
                />
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
                  <p className="text-sm text-brand-gray">
                    Agrega la información necesaria para aprobar el pago.
                  </p>
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
                  id="departureDate"
                  type="date"
                  label="Fecha de salida"
                  value={form.departureDate}
                  onChange={updateField("departureDate")}
                  placeholder=""
                />
                <Field
                  id="arrivalDate"
                  type="date"
                  label="Fecha de llegada"
                  value={form.arrivalDate}
                  onChange={updateField("arrivalDate")}
                  placeholder=""
                />
                <Field
                  id="paymentDate"
                  type="date"
                  label="Fecha de pago"
                  value={form.paymentDate}
                  onChange={updateField("paymentDate")}
                  placeholder=""
                />
                <SelectField
                  id="hasArrived"
                  label="¿La carga ya llegó?"
                  value={form.hasArrived}
                  onChange={updateField("hasArrived")}
                  options={[
                    ["no", "No"],
                    ["si", "Sí"],
                  ]}
                />
              </div>

              <div className="mt-5">
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-brand-warm-dark mb-1.5"
                >
                  Descripción
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
                      <p className="mt-1 text-xs leading-relaxed text-brand-gray">
                        Por ahora registra el nombre del archivo. En el próximo
                        paso conectaremos carga real de adjuntos.
                      </p>
                    </div>
                  </div>
                  <Field
                    id="attachmentName"
                    label="Nombre del archivo"
                    value={form.attachmentName}
                    onChange={updateField("attachmentName")}
                    placeholder="factura-123.pdf"
                  />
                </div>
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            <section className="rounded-3xl border border-brand-beige-dark/20 bg-white/75 p-6 shadow-xl backdrop-blur-xl">
              <h2 className="text-lg font-semibold text-brand-near-black">
                Método de pago
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-brand-gray">
                Selecciona cómo quieres financiar o debitar esta transacción.
              </p>

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
                    />
                    <span className="block text-sm font-semibold text-brand-near-black">
                      {method.label}
                    </span>
                    <span className="mt-1 block text-xs leading-relaxed text-brand-gray">
                      {method.description}
                    </span>
                  </label>
                ))}
              </div>
            </section>

            <section className="rounded-3xl border border-brand-beige-dark/20 bg-brand-near-black p-6 text-white shadow-xl">
              <h2 className="text-lg font-semibold">Resumen del pago</h2>
              <p className="mt-2 text-sm leading-relaxed text-white/60">
                Revisa el total antes de guardar o aprobar.
              </p>

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
                <SummaryRow label="Fee de servicio" value={formatMoney(serviceFee)} dark />
                <SummaryRow label="Fee financiero" value={formatMoney(financingFee)} dark />
                <div className="flex items-center justify-between border-t border-white/15 pt-4">
                  <span className="text-sm font-medium text-white/70">Total</span>
                  <span className="text-2xl font-semibold">{formatMoney(total)}</span>
                </div>
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
                <button
                  type="button"
                  disabled={loading}
                  onClick={(event) => handleSubmit(event as unknown as FormEvent, true)}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 px-5 py-3 text-sm font-medium text-white transition-all hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <CheckCircle2 size={16} />
                  Guardar y aprobar pago
                </button>
              </div>
            </section>

            <section className="rounded-3xl border border-brand-beige-dark/20 bg-white/65 p-6 shadow-xl backdrop-blur-xl">
              <h2 className="text-lg font-semibold text-brand-near-black">
                Flujo de aprobación
              </h2>
              <div className="mt-5 space-y-4">
                {["Creada", "Validación documental", "Aprobación", "Pago enviado"].map(
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
}: {
  id: string;
  label: string;
  value: string;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => void;
  placeholder: string;
  type?: string;
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
        min={type === "number" ? "0" : undefined}
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