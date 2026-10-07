// @ts-ignore Node's test runner loads these TypeScript modules directly.
import { validateStatusUpdate, validateTransactionInput, type TransactionInput } from "./transaction-form.ts";
// @ts-ignore Node's test runner loads these TypeScript modules directly.
import { isAllowedTransactionStatus } from "./transaction-status.ts";

const json = (body: unknown, status = 200) => Response.json(body, { status });

function hasStringFields(value: unknown, fields: string[]): value is Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return fields.every(
    (field) => typeof record[field] === "string" && (record[field] as string).trim().length > 0,
  );
}

function hasId(value: unknown): value is Record<string, unknown> & { id: string } {
  return hasStringFields(value, ["id"]);
}

function hasVendorFields(value: unknown): value is Record<string, unknown> {
  return hasStringFields(value, ["id", "name", "billingEmail"]);
}

type UpdateResult =
  | { kind: "updated"; transaction: unknown }
  | { kind: "not-found" }
  | { kind: "invalid-transition" }
  | { kind: "conflict" };

async function parseObject(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const body: unknown = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) return null;
    return body as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function createTransactionPostHandler(deps: {
  getAuth: () => Promise<{ userId: string } | null>;
  create: (userId: string, input: TransactionInput) => Promise<unknown>;
}) {
  return async (request: Request): Promise<Response> => {
    const auth = await deps.getAuth();
    if (!auth) return json({ error: "Unauthorized" }, 401);
    const body = await parseObject(request);
    if (!body) return json({ error: "Solicitud inválida" }, 400);
    const parsed = validateTransactionInput(body);
    if (!parsed.ok) return json({ error: parsed.error }, 400);
    let created: unknown;
    try {
      created = await deps.create(auth.userId, parsed.value);
    } catch {
      return json({ error: "No se pudo crear la transacción" }, 500);
    }
    if (created === null) return json({ error: "Proveedor no encontrado" }, 404);
    if (!hasId(created)) return json({ error: "No se pudo crear la transacción" }, 500);
    return json({ transaction: created }, 201);
  };
}

export function createVendorPostHandler(deps: {
  getAuth: () => Promise<{ userId: string } | null>;
  create: (userId: string, vendor: { name: string; billingEmail: string }) => Promise<unknown>;
}) {
  return async (request: Request): Promise<Response> => {
    const auth = await deps.getAuth();
    if (!auth) return json({ error: "Unauthorized" }, 401);
    const body = await parseObject(request);
    if (!body) return json({ error: "Solicitud inválida" }, 400);
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const billingEmail = typeof body.billingEmail === "string" ? body.billingEmail.trim() : "";
    if (!name || name.length > 160 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(billingEmail) || billingEmail.length > 254) {
      return json({ error: "Nombre y correo facturable válidos son obligatorios" }, 400);
    }
    let vendor: unknown;
    try {
      vendor = await deps.create(auth.userId, { name, billingEmail });
    } catch {
      return json({ error: "No se pudo crear el proveedor" }, 500);
    }
    if (!hasVendorFields(vendor)) return json({ error: "No se pudo crear el proveedor" }, 500);
    return json({ vendor }, 201);
  };
}

export function createTransactionPatchHandler(deps: {
  getAuth: () => Promise<{ userId: string } | null>;
  update: (input: { userId: string; id: string; nextStatus: string; scheduledFor: string | null }) => Promise<UpdateResult>;
}) {
  return async (request: Request, id: string): Promise<Response> => {
    const auth = await deps.getAuth();
    if (!auth) return json({ error: "Unauthorized" }, 401);
    const body = await parseObject(request);
    if (!body) return json({ error: "Solicitud inválida" }, 400);
    const { status, scheduledFor } = body;
    if (!isAllowedTransactionStatus(status)) return json({ error: "Estado de transacción inválido" }, 400);
    const date = validateStatusUpdate(status, scheduledFor);
    if (!date.ok) return json({ error: "La fecha programada debe ser futura" }, 400);
    let result: UpdateResult;
    try {
      result = await deps.update({ userId: auth.userId, id, nextStatus: status, scheduledFor: date.scheduledFor });
    } catch {
      return json({ error: "No se pudo actualizar la transacción" }, 500);
    }
    if (!result || result.kind === "conflict") return json({ error: "La transacción cambió; vuelve a cargar e intenta otra vez" }, 409);
    if (result.kind === "not-found") return json({ error: "Transacción no encontrada" }, 404);
    if (result.kind === "invalid-transition") return json({ error: "Transición de estado no permitida" }, 400);
    return json({ transaction: result.transaction });
  };
}
