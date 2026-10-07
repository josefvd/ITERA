import test from "node:test";
import assert from "node:assert/strict";
import { isValidServiceCategory } from "../src/lib/transaction-form.ts";

test("el API acepta categorías del formulario y rechaza categorías fuera del catálogo", () => {
  assert.equal(isValidServiceCategory("Flete marítimo"), true);
  assert.equal(isValidServiceCategory("Agente inventado"), false);
});
