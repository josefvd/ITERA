import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const page = await readFile(new URL("../src/app/register/page.tsx", import.meta.url), "utf8");

test("registration no longer says banking information can be added now or later", () => {
  assert.doesNotMatch(page, /La información bancaria puede agregarse ahora o más adelante/i);
});

test("payer option uses the owner's trade-payments wording", () => {
  assert.match(page, /\["pagador",\s*"Empresa que realiza pagos de comercio exterior"/);
  assert.doesNotMatch(page, /Pagador|Empresa que realiza pagos de flete/);
});

test("company step omits the rejected approvals-and-payments tagline", () => {
  assert.doesNotMatch(page, /Estos datos preparan la cuenta para aprobaciones, pagos y\s+comunicación con proveedores/i);
});

test("registration consent checkbox uses the approved concise wording", () => {
  assert.match(page, /Acepto los términos y condiciones\./);
  assert.doesNotMatch(page, /Acepto los términos de registro y entiendo que mi cuenta/);
});

test("verification copy explains review and next steps without promising a deadline", () => {
  assert.match(page, /Revisaremos la información de tu empresa para habilitar pagos de forma segura\./);
  assert.match(page, /Te enviaremos por correo los siguientes pasos\./);
  assert.doesNotMatch(page, /Pendiente de aprobación|aprobación/i);
  assert.doesNotMatch(page, /próximas 24 horas|Antes de crear la cuenta, confirma que la información será revisada/i);
});

test("registration defers one card to Settings instead of collecting payment details", () => {
  assert.doesNotMatch(
    page,
    /label:\s*"Banco"|bankingPreference|paymentMethod|cardNumber|cardholder|\bcvc\b|routingNumber|accountNumber|Configurar después|Solicitar asistencia bancaria/i,
  );
  assert.match(page, /Podrás agregar una tarjeta desde Configuración bancaria cuando la necesites\./);
});
