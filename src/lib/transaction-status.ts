export const allowedTransactionStatuses = [
  "pending",
  "processing",
  "scheduled",
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
  completed: "Transacción completada.",
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

export function getTransactionFlowSteps(
  status: string,
  scheduledFor?: string | Date | null
): readonly string[] {
  if (status === "completed") {
    return scheduledFor ? ["Creada", "Programada", "Completada"] : ["Creada", "Completada"];
  }
  return status === "scheduled" || Boolean(scheduledFor)
    ? ["Creada", "Programada", "Pagada"]
    : ["Creada", "Pagada"];
}

export function canTransitionTransactionStatus(
  current: string,
  next: string,
  scheduledFor?: string | Date | null,
  now: Date = new Date()
): boolean {
  if (current === "scheduled" && next === "paid") {
    let scheduledDay: string;
    if (scheduledFor instanceof Date) {
      if (Number.isNaN(scheduledFor.getTime())) return false;
      scheduledDay = scheduledFor.toISOString().slice(0, 10);
    } else if (typeof scheduledFor === "string") {
      const dateOnly = /^\d{4}-\d{2}-\d{2}$/;
      const timestamp = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?$/;
      if (dateOnly.test(scheduledFor)) {
        scheduledDay = scheduledFor;
      } else if (timestamp.test(scheduledFor) && !Number.isNaN(Date.parse(scheduledFor))) {
        scheduledDay = scheduledFor.slice(0, 10);
      } else {
        return false;
      }
    } else {
      return false;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(scheduledDay)) return false;
    const validDay = new Date(`${scheduledDay}T00:00:00.000Z`);
    if (Number.isNaN(validDay.getTime()) || validDay.toISOString().slice(0, 10) !== scheduledDay) return false;
    if (Number.isNaN(now.getTime())) return false;
    return scheduledDay <= now.toISOString().slice(0, 10);
  }

  return current === "pending" && (next === "paid" || next === "scheduled");
}
