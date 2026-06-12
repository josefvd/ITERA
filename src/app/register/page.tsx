"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { siteConfig } from "@/lib/constants";
import { Building2, CheckCircle2, ShieldCheck, UserPlus, WalletCards } from "lucide-react";

const steps = [
  { label: "Cuenta", icon: UserPlus },
  { label: "Empresa", icon: Building2 },
  { label: "Banco", icon: WalletCards },
  { label: "Verificación", icon: ShieldCheck },
  { label: "Confirmación", icon: CheckCircle2 },
];

export default function RegisterPage() {
  const [form, setForm] = useState({
    accountType: "pagador",
    name: "",
    email: "",
    company: "",
    phone: "",
    taxId: "",
    address: "",
    bankingPreference: "despues",
    acceptedTerms: false,
    password: "",
    confirmPassword: "",
  });
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    if (form.password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          company: form.company || undefined,
          phone: form.phone || undefined,
          password: form.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registro fallido");
        return;
      }

      window.location.assign("/dashboard");
    } catch {
      setError("Algo salió mal. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  const updateField = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({
      ...prev,
      [field]: e.target.type === "checkbox" ? e.target.checked : e.target.value,
    }));

  function validateStep(currentStep: number) {
    setError("");

    if (currentStep === 0) {
      if (!form.name || !form.email || !form.password || !form.confirmPassword) {
        setError("Completa los datos de cuenta para continuar.");
        return false;
      }

      if (form.password !== form.confirmPassword) {
        setError("Las contraseñas no coinciden.");
        return false;
      }

      if (form.password.length < 6) {
        setError("La contraseña debe tener al menos 6 caracteres.");
        return false;
      }
    }

    if (currentStep === 1 && (!form.company || !form.phone)) {
      setError("Completa la empresa y el teléfono para continuar.");
      return false;
    }

    if (currentStep === 3 && !form.acceptedTerms) {
      setError("Debes aceptar los términos para continuar.");
      return false;
    }

    return true;
  }

  function goNext() {
    if (!validateStep(step)) return;
    setStep((current) => Math.min(current + 1, steps.length - 1));
  }

  function goBack() {
    setError("");
    setStep((current) => Math.max(current - 1, 0));
  }

  return (
    <div className="min-h-screen px-4 py-24">
      <div className="mx-auto w-full max-w-5xl">
        <div className="mb-8 text-center">
          <span className="text-xs font-semibold uppercase tracking-widest text-brand-gray">
            Registro
          </span>
          <h1 className="mt-3 text-3xl font-bold text-brand-near-black">
            Crea tu cuenta en {siteConfig.name}
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-brand-gray">
            Configura tu perfil de pagos, empresa y verificación en pocos pasos.
            La información bancaria puede agregarse ahora o más adelante.
          </p>
        </div>

        <div className="rounded-3xl border border-brand-beige-dark/20 bg-white/65 p-6 shadow-xl backdrop-blur-xl md:p-8">
          <div className="mb-8 grid grid-cols-1 gap-3 md:grid-cols-5">
            {steps.map((item, index) => {
              const Icon = item.icon;
              const active = index === step;
              const completed = index < step;

              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => {
                    if (index <= step || validateStep(step)) setStep(index);
                  }}
                  className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-all ${
                    active
                      ? "border-brand-near-black bg-brand-near-black text-white"
                      : completed
                      ? "border-brand-beige-dark/30 bg-brand-beige text-brand-near-black"
                      : "border-brand-beige-dark/20 bg-white/70 text-brand-gray"
                  }`}
                >
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-full ${
                      active ? "bg-white/15" : "bg-brand-charcoal/5"
                    }`}
                  >
                    <Icon size={16} />
                  </span>
                  <span>
                    <span className="block text-[11px] font-medium uppercase tracking-widest opacity-70">
                      Paso {index + 1}
                    </span>
                    <span className="block text-sm font-semibold">{item.label}</span>
                  </span>
                </button>
              );
            })}
          </div>

          {error && (
            <div className="mb-6 rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {step === 0 && (
              <div className="grid gap-6 md:grid-cols-[0.8fr_1.2fr]">
                <div>
                  <h2 className="text-xl font-semibold text-brand-near-black">
                    Datos de acceso
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-brand-gray">
                    Crea el usuario administrador de la cuenta. Este perfil
                    gestionará pagos, proveedores y aprobaciones.
                  </p>
                  <div className="mt-6 grid gap-3">
                    {[
                      ["pagador", "Pagador", "Empresa que realiza pagos de flete."],
                      ["proveedor", "Proveedor", "Empresa que recibe pagos."],
                    ].map(([value, label, description]) => (
                      <label
                        key={value}
                        className={`cursor-pointer rounded-2xl border p-4 transition-all ${
                          form.accountType === value
                            ? "border-brand-near-black bg-brand-beige"
                            : "border-brand-beige-dark/20 bg-white/70"
                        }`}
                      >
                        <input
                          type="radio"
                          name="accountType"
                          value={value}
                          checked={form.accountType === value}
                          onChange={updateField("accountType")}
                          className="sr-only"
                        />
                        <span className="block text-sm font-semibold text-brand-near-black">
                          {label}
                        </span>
                        <span className="mt-1 block text-xs text-brand-gray">
                          {description}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid gap-4">
                  <Field
                    id="name"
                    label="Nombre completo *"
                    value={form.name}
                    onChange={updateField("name")}
                    placeholder="Andrea Martínez"
                  />
                  <Field
                    id="email"
                    type="email"
                    label="Correo electrónico *"
                    value={form.email}
                    onChange={updateField("email")}
                    placeholder="correo@empresa.com"
                  />
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field
                      id="password"
                      type="password"
                      label="Contraseña *"
                      value={form.password}
                      onChange={updateField("password")}
                      placeholder="Mín. 6 caracteres"
                    />
                    <Field
                      id="confirmPassword"
                      type="password"
                      label="Confirmar contraseña *"
                      value={form.confirmPassword}
                      onChange={updateField("confirmPassword")}
                      placeholder="Repite tu contraseña"
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="grid gap-6 md:grid-cols-[0.8fr_1.2fr]">
                <div>
                  <h2 className="text-xl font-semibold text-brand-near-black">
                    Información de empresa
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-brand-gray">
                    Estos datos preparan la cuenta para aprobaciones, pagos y
                    comunicación con proveedores.
                  </p>
                </div>

                <div className="grid gap-4">
                  <Field
                    id="company"
                    label="Empresa *"
                    value={form.company}
                    onChange={updateField("company")}
                    placeholder="Acme Logistics"
                  />
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field
                      id="taxId"
                      label="Identificación fiscal"
                      value={form.taxId}
                      onChange={updateField("taxId")}
                      placeholder="EIN / RUC / NIT"
                    />
                    <Field
                      id="phone"
                      type="tel"
                      label="Teléfono *"
                      value={form.phone}
                      onChange={updateField("phone")}
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>
                  <Field
                    id="address"
                    label="Dirección"
                    value={form.address}
                    onChange={updateField("address")}
                    placeholder="Ciudad, estado, país"
                  />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="grid gap-6 md:grid-cols-[0.8fr_1.2fr]">
                <div>
                  <h2 className="text-xl font-semibold text-brand-near-black">
                    Configuración bancaria
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-brand-gray">
                    Por ahora puedes dejar la conexión bancaria pendiente. ITERA
                    marcará la cuenta como lista para completar verificación.
                  </p>
                </div>

                <div className="grid gap-4">
                  {[
                    [
                      "despues",
                      "Configurar después",
                      "Recomendado para empezar rápido y completar datos bancarios con soporte.",
                    ],
                    [
                      "manual",
                      "Solicitar asistencia bancaria",
                      "Un especialista de ITERA ayuda a validar la cuenta para pagos.",
                    ],
                  ].map(([value, label, description]) => (
                    <label
                      key={value}
                      className={`cursor-pointer rounded-2xl border p-5 transition-all ${
                        form.bankingPreference === value
                          ? "border-brand-near-black bg-brand-beige"
                          : "border-brand-beige-dark/20 bg-white/70"
                      }`}
                    >
                      <input
                        type="radio"
                        name="bankingPreference"
                        value={value}
                        checked={form.bankingPreference === value}
                        onChange={updateField("bankingPreference")}
                        className="sr-only"
                      />
                      <span className="block text-sm font-semibold text-brand-near-black">
                        {label}
                      </span>
                      <span className="mt-1 block text-sm text-brand-gray">
                        {description}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="grid gap-6 md:grid-cols-[0.8fr_1.2fr]">
                <div>
                  <h2 className="text-xl font-semibold text-brand-near-black">
                    Verificación
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-brand-gray">
                    Antes de crear la cuenta, confirma que la información será
                    revisada para habilitar operaciones de pago.
                  </p>
                </div>

                <div className="rounded-2xl border border-brand-beige-dark/20 bg-white/70 p-5">
                  <p className="text-sm leading-relaxed text-brand-gray">
                    Al continuar, aceptas que ITERA revise la información de la
                    empresa y solicite datos adicionales antes de activar pagos,
                    financiamiento o límites operativos.
                  </p>
                  <label className="mt-5 flex items-start gap-3 text-sm text-brand-warm-dark">
                    <input
                      type="checkbox"
                      checked={form.acceptedTerms}
                      onChange={updateField("acceptedTerms")}
                      className="mt-1 h-4 w-4 rounded border-brand-beige-dark text-brand-near-black"
                    />
                    <span>
                      Acepto los términos de registro y entiendo que mi cuenta
                      puede quedar pendiente de aprobación.
                    </span>
                  </label>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="grid gap-6 md:grid-cols-[0.8fr_1.2fr]">
                <div>
                  <h2 className="text-xl font-semibold text-brand-near-black">
                    Confirma tu solicitud
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-brand-gray">
                    Revisa los datos principales. Después de crear la cuenta,
                    entrarás al dashboard de ITERA.
                  </p>
                </div>

                <div className="grid gap-3 rounded-2xl border border-brand-beige-dark/20 bg-white/70 p-5">
                  <SummaryRow label="Tipo de cuenta" value={form.accountType === "pagador" ? "Pagador" : "Proveedor"} />
                  <SummaryRow label="Administrador" value={form.name || "Pendiente"} />
                  <SummaryRow label="Correo" value={form.email || "Pendiente"} />
                  <SummaryRow label="Empresa" value={form.company || "Pendiente"} />
                  <SummaryRow label="Teléfono" value={form.phone || "Pendiente"} />
                  <SummaryRow
                    label="Banco"
                    value={
                      form.bankingPreference === "manual"
                        ? "Asistencia bancaria"
                        : "Configurar después"
                    }
                  />
                  <SummaryRow label="Estado inicial" value="Pendiente de aprobación" />
                </div>
              </div>
            )}

            <div className="mt-8 flex flex-col-reverse gap-3 border-t border-brand-beige-dark/20 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={goBack}
                disabled={step === 0}
                className="rounded-full border border-brand-beige-dark/30 px-5 py-2.5 text-sm font-medium text-brand-warm-dark transition-all hover:bg-brand-beige/60 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Anterior
              </button>

              {step < steps.length - 1 ? (
                <button
                  type="button"
                  onClick={goNext}
                  className="rounded-full bg-brand-near-black px-6 py-2.5 text-sm font-medium text-white transition-all hover:bg-black"
                >
                  Continuar
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-near-black px-6 py-2.5 text-sm font-medium text-white transition-all hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? (
                    "Creando cuenta..."
                  ) : (
                    <>
                      Crear cuenta <UserPlus size={16} />
                    </>
                  )}
                </button>
              )}
            </div>
          </form>

          <p className="text-center text-sm text-brand-gray mt-6">
            ¿Ya tienes cuenta?{" "}
            <Link
              href="/signin"
              className="text-brand-near-black font-medium hover:underline"
            >
              Inicia sesión
            </Link>
          </p>
        </div>
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
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
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
        value={value}
        onChange={onChange}
        className="w-full rounded-xl border border-brand-beige-dark/30 bg-white px-4 py-2.5 text-brand-charcoal placeholder:text-brand-taupe transition-all focus:border-brand-near-black focus:outline-none focus:ring-2 focus:ring-brand-near-black/20"
        placeholder={placeholder}
      />
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-brand-beige-dark/20 py-2 last:border-b-0">
      <span className="text-xs font-medium uppercase tracking-widest text-brand-gray">
        {label}
      </span>
      <span className="text-right text-sm font-medium text-brand-near-black">
        {value}
      </span>
    </div>
  );
}