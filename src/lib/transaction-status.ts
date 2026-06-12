export const allowedTransactionStatuses = [
  "pending",
  "processing",
  "completed",
  "paid",
  "failed",
  "cancelled",
] as const;

export type TransactionStatus = (typeof allowedTransactionStatuses)[number];

export const transactionActionMessages: Record<
  Extract<TransactionStatus, "completed" | "failed" | "cancelled">,
  string
> = {
  completed: "Pago aprobado y proveedor notificado.",
  failed: "Transacción marcada para disputa.",
  cancelled: "Transacción anulada.",
};

export function isAllowedTransactionStatus(
  status: unknown
): status is TransactionStatus {
  return (
    typeof status === "string" &&
    allowedTransactionStatuses.includes(status as TransactionStatus)
  );
}
