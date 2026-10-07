import test from "node:test";
import assert from "node:assert/strict";
import {
  serviceCategories,
  isValidTransactionReference,
  getInitialTransactionStatus,
} from "../src/lib/transaction-form.ts";

test("expone las ocho categorías logísticas acordadas en el orden requerido", () => {
  assert.deepEqual(serviceCategories, [
    "Flete marítimo",
    "Flete aéreo",
    "Flete terrestre / Trucking",
    "Aduana / Agente aduanal",
    "Terminal / Puerto / Aeropuerto",
    "Almacenaje / Bodega",
    "Seguro de carga",
    "Otros",
  ]);
});

test("exige número de referencia y deja el tipo opcional", () => {
  assert.equal(isValidTransactionReference({ referenceNumber: "  AB-12  " }), true);
  assert.equal(isValidTransactionReference({ referenceNumber: "", referenceType: "BOL" }), false);
});

test("distingue guardar para hoy de programar para fecha futura", () => {
  assert.equal(getInitialTransactionStatus("today"), "pending");
  assert.equal(getInitialTransactionStatus("scheduled", "2099-01-01"), "scheduled");
  assert.equal(getInitialTransactionStatus("scheduled", "2000-01-01"), null);
  assert.equal(getInitialTransactionStatus("scheduled", ""), null);
  assert.equal(getInitialTransactionStatus("other", "2099-01-01"), null);
});
