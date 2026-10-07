export const serviceCategories = [
  "Flete marítimo",
  "Flete aéreo",
  "Flete terrestre / Trucking",
  "Aduana / Agente aduanal",
  "Terminal / Puerto / Aeropuerto",
  "Almacenaje / Bodega",
  "Seguro de carga",
  "Otros",
] as const;

export const paymentMethods = ["local_transfer", "international_transfer", "card"] as const;
export type PaymentTiming = "today" | "scheduled";

export function isValidServiceCategory(category: unknown): boolean {
  return typeof category === "string" && serviceCategories.includes(category as (typeof serviceCategories)[number]);
}

export function isValidTransactionReference(input: { referenceNumber?: unknown }): boolean {
  return typeof input.referenceNumber === "string" && input.referenceNumber.trim().length > 0;
}

function parseCurrencyAmount(value: unknown): number | null {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const text = typeof value === "string" ? value.trim() : String(value);
  if (!/^\d+(?:\.\d{1,2})?$/.test(text)) return null;
  const amount = Number(text);
  return Number.isFinite(amount) ? amount : null;
}
function parseFutureDate(value: unknown, now: Date): string | null {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) return null;
  if (date.getTime() <= Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())) return null;
  return date.toISOString();
}

export function getInitialTransactionStatus(timing: PaymentTiming, scheduledDate?: string, now = new Date()): "pending" | "scheduled" | null {
  if (timing === "today") return "pending";
  if (timing !== "scheduled" || !parseFutureDate(scheduledDate, now)) return null;
  return "scheduled";
}

export type TransactionInput = {
  vendorId: string; amount: number; paymentMethod: (typeof paymentMethods)[number];
  serviceType: (typeof serviceCategories)[number]; referenceType: string | null;
  referenceNumber: string; relatedReference: string | null; commercialValue: number | null;
  paymentTiming: PaymentTiming; scheduledFor: string | null; description: string | null;
  status: "pending" | "scheduled";
};

export function validateTransactionInput(input: unknown, now = new Date()): { ok: true; value: TransactionInput } | { ok: false; error: string } {
  if (!input || typeof input !== "object" || Array.isArray(input)) return { ok: false, error: "Solicitud inválida" };
  const body = input as Record<string, unknown>;
  const vendorId = typeof body.vendorId === "string" ? body.vendorId.trim() : "";
  const amount = parseCurrencyAmount(body.amount);
  const method = body.paymentMethod;
  const serviceType = body.serviceType;
  const referenceNumber = typeof body.referenceNumber === "string" ? body.referenceNumber.trim() : "";
  const referenceType = body.referenceType == null || body.referenceType === "" ? null : body.referenceType;
  const relatedReference = body.relatedReference == null || body.relatedReference === "" ? null : body.relatedReference;
  const hasCommercialValue = body.commercialValue != null && body.commercialValue !== "";
  const commercialValue = hasCommercialValue ? parseCurrencyAmount(body.commercialValue) : null;
  const timing = body.paymentTiming;
  const description = body.description == null || body.description === "" ? null : body.description;
  if (!vendorId || vendorId.length > 100) return { ok: false, error: "Proveedor inválido" };
  if (amount === null || amount <= 0 || amount > 1_000_000_000) return { ok: false, error: "Monto inválido" };
  if (typeof method !== "string" || !paymentMethods.includes(method as (typeof paymentMethods)[number])) return { ok: false, error: "Método de pago inválido" };
  if (!isValidServiceCategory(serviceType)) return { ok: false, error: "Categoría inválida" };
  if (!referenceNumber || referenceNumber.length > 120) return { ok: false, error: "Número de referencia inválido" };
  if (referenceType !== null && (typeof referenceType !== "string" || !["AWB", "BOL", "Factura", "Otro"].includes(referenceType))) return { ok: false, error: "Tipo de referencia inválido" };
  if (relatedReference !== null && (typeof relatedReference !== "string" || relatedReference.length > 120)) return { ok: false, error: "Referencia relacionada inválida" };
  if (hasCommercialValue && commercialValue === null) return { ok: false, error: "Valor comercial inválido" };
  if (commercialValue !== null && commercialValue > 1_000_000_000) return { ok: false, error: "Valor comercial inválido" };
  if (description !== null && (typeof description !== "string" || description.length > 2000)) return { ok: false, error: "Notas demasiado largas" };
  if (timing !== "today" && timing !== "scheduled") return { ok: false, error: "Fecha de pago inválida" };
  const scheduledFor = timing === "scheduled" ? parseFutureDate(body.scheduledFor, now) : null;
  if (timing === "scheduled" && !scheduledFor) return { ok: false, error: "La fecha programada debe ser futura" };
  return { ok: true, value: { vendorId, amount, paymentMethod: method as TransactionInput["paymentMethod"], serviceType: serviceType as TransactionInput["serviceType"], referenceType: referenceType as string | null, referenceNumber, relatedReference: relatedReference as string | null, commercialValue, paymentTiming: timing, scheduledFor, description: description as string | null, status: timing === "scheduled" ? "scheduled" : "pending" } };
}

export function validateStatusUpdate(status: unknown, date: unknown, now = new Date()): { ok: true; scheduledFor: string | null } | { ok: false } {
  if (status === "scheduled") {
    const scheduledFor = parseFutureDate(date, now);
    return scheduledFor ? { ok: true, scheduledFor } : { ok: false };
  }
  return { ok: true, scheduledFor: null };
}
