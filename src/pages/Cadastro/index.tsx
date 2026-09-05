import { useState } from "react"

import Stepper, { Step } from "@/components/Stepper"

type FormData = {
  name: string
  email: string
  password: string
  password1: string
  business: string
  segment: string
}

const initialForm: FormData = {
  name: "",
  email: "",
  password: "",
  password1: "",  
  business: "",
  segment: "",
}
const inputClassName =
  "mt-2 w-full rounded-xl border border-white/12 bg-white/[0.06] px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-blue-400 focus:bg-white/[0.09]"

export function Cadastro() {
  const [form, setForm] = useState<FormData>(initialForm)
  const [currentStep, setCurrentStep] = useState(1)
  const [submitted, setSubmitted] = useState(false)
  const updateField = (field: keyof FormData, value: string) =>
    setForm((current) => ({ ...current, [field]: value }))
  const passwordMismatch =
    form.password1.length > 0 && form.password !== form.password1
  const stepIsValid =
    currentStep === 1
      ? form.name.trim().length > 2 &&
        form.email.includes("@") &&
        form.password.length >= 6 &&
        form.password === form.password1
      : currentStep === 2
        ? form.business.trim().length > 1 && form.segment.length > 0
        : true

  if (submitted) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#070B14] px-4 text-white">
        <section className="w-full max-w-lg border border-blue-400/25 bg-[#0E1426] p-8 text-center shadow-2xl shadow-blue-950/30 sm:p-12">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-500/15 text-3xl text-blue-300">
            ✓
          </div>
          <p className="mt-7 text-xs font-semibold tracking-[0.24em] text-blue-300 uppercase">
            Cadastro concluido
          </p>
          <h1 className="mt-4 font-heading text-4xl font-bold">
            Bem-vindo, {form.name.split(" ")[0]}.
          </h1>
          <p className="mt-4 leading-7 text-white/60">
            Sua conta da EasySell esta pronta. Em breve voce podera organizar
            sua operacao em um so lugar.
          </p>
          <a
            href="/"
            className="mt-8 inline-flex rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500"
          >
            Voltar para a home
          </a>
        </section>
      </main>
    )
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#070B14] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(37,99,235,0.18),transparent_32%),radial-gradient(circle_at_80%_80%,rgba(14,165,233,0.1),transparent_28%)]" />
      <header className="relative z-10 flex items-center justify-between px-5 py-6 sm:px-10">
        <a href="/" className="font-heading text-lg font-bold tracking-tight">
          EasySell<span className="text-blue-400">.</span>
        </a>
        <a
          href="/"
          className="text-sm text-white/55 transition hover:text-white"
        >
          Voltar para a home
        </a>
      </header>
      <div className="relative z-10 mx-auto grid min-h-[calc(100vh-88px)] max-w-6xl items-center gap-12 px-5 pb-12 sm:px-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
        <section className="max-w-md">
          <p className="text-xs font-semibold tracking-[0.24em] text-blue-300 uppercase">
            Comece agora
          </p>
          <h1 className="mt-5 font-heading text-5xl leading-[0.98] font-bold sm:text-6xl">
            Sua empresa merece mais controle.
          </h1>
          <p className="mt-6 leading-7 text-white/55">
            Crie sua conta gratuitamente e tenha uma visao mais clara do que
            acontece no seu negocio.
          </p>
          <div className="mt-10 space-y-4 text-sm text-white/65">
            {[
              "Organize estoque e vendas",
              "Acompanhe seu financeiro",
              "Conheca melhor seus clientes",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500/15 text-xs text-blue-300">
                  ✓
                </span>
                {item}
              </div>
            ))}
          </div>
        </section>
        <section className="py-2 sm:py-4">
          <Stepper
            initialStep={1}
            onStepChange={setCurrentStep}
            onFinalStepCompleted={() => setSubmitted(true)}
            backButtonText="Voltar"
            nextButtonText="Continuar"
            disableStepIndicators
            nextButtonProps={{
              disabled: !stepIsValid,
              className:
                "!h-11 !min-w-32 !rounded-xl border border-blue-400/30 bg-blue-600 px-5 text-sm font-semibold text-white shadow-lg shadow-blue-950/30 transition-all hover:-translate-y-0.5 hover:bg-blue-500 hover:shadow-blue-900/50 focus-visible:ring-2 focus-visible:ring-blue-300/70 active:translate-y-0 disabled:translate-y-0 disabled:border-white/10 disabled:bg-white/10 disabled:text-white/40 disabled:shadow-none",
            }}
            stepCircleContainerClassName="border-0 shadow-none"
            stepContainerClassName="px-6 sm:px-10"
            contentClassName="px-6 sm:px-10"
            footerClassName="px-6 sm:px-10"
          >
            <Step>
              <p className="text-xs font-semibold tracking-[0.2em] text-blue-300 uppercase">
                01 / seus dados
              </p>
              <h2 className="mt-3 font-heading text-3xl font-bold">
                Vamos criar seu acesso.
              </h2>
              <p className="mt-2 text-sm leading-6 text-white/50">
                Use seus dados principais para entrar na EasySell.
              </p>
              <label className="mt-7 block text-sm font-medium">
                Seu nome
                <input
                  className={inputClassName}
                  value={form.name}
                  onChange={(event) => updateField("name", event.target.value)}
                  placeholder="Ex.: Maria Oliveira"
                  autoComplete="name"
                />
              </label>
              <label className="mt-4 block text-sm font-medium">
                E-mail
                <input
                  className={inputClassName}
                  type="email"
                  value={form.email}
                  onChange={(event) => updateField("email", event.target.value)}
                  placeholder="voce@empresa.com"
                  autoComplete="email"
                />
              </label>
              <label className="mt-4 block text-sm font-medium">
                Senha
                <input
                  className={inputClassName}
                  type="password"
                  value={form.password}
                  onChange={(event) =>
                    updateField("password", event.target.value)
                  }
                  placeholder="Minimo de 6 caracteres"
                  autoComplete="new-password"
                />
              </label>

              <label className="mt-4 block text-sm font-medium">
                Confirmar Senha
                <input
                  className={`${inputClassName} ${passwordMismatch ? "border-red-400/70 focus:border-red-400" : ""}`}
                  type="password"
                  value={form.password1}
                  onChange={(event) =>
                    updateField("password1", event.target.value)
                  }
                  placeholder="Minimo de 6 caracteres"
                  autoComplete="new-password"
                />
                {passwordMismatch && (
                  <p className="mt-2 text-xs font-medium text-red-300">
                    As senhas nao coincidem.
                  </p>
                )}
              </label>
            </Step>
            <Step>
              <p className="text-xs font-semibold tracking-[0.2em] text-blue-300 uppercase">
                02 / seu negocio
              </p>
              <h2 className="mt-3 font-heading text-3xl font-bold">
                Conte sobre sua empresa.
              </h2>
              <p className="mt-2 text-sm leading-6 text-white/50">
                Assim a EasySell pode preparar uma experiencia mais relevante.
              </p>
              <label className="mt-7 block text-sm font-medium">
                Nome da empresa
                <input
                  className={inputClassName}
                  value={form.business}
                  onChange={(event) =>
                    updateField("business", event.target.value)
                  }
                  placeholder="Ex.: Loja da Maria"
                />
              </label>
              <label className="mt-4 block text-sm font-medium">
                Segmento
                <select
                  className={inputClassName}
                  value={form.segment}
                  onChange={(event) =>
                    updateField("segment", event.target.value)
                  }
                >
                  <option value="" className="bg-[#0B1120]">
                    Selecione uma opcao
                  </option>
                  <option value="varejo" className="bg-[#0B1120]">
                    Varejo
                  </option>
                  <option value="servicos" className="bg-[#0B1120]">
                    Servicos
                  </option>
                  <option value="alimentacao" className="bg-[#0B1120]">
                    Alimentacao
                  </option>
                  <option value="outro" className="bg-[#0B1120]">
                    Outro
                  </option>
                </select>
              </label>
            </Step>
            <Step>
              <p className="text-xs font-semibold tracking-[0.2em] text-blue-300 uppercase">
                03 / tudo certo
              </p>
              <h2 className="mt-3 font-heading text-3xl font-bold">
                Pronto para comecar?
              </h2>
              <p className="mt-2 text-sm leading-6 text-white/50">
                Confira seus dados e crie sua conta gratuita.
              </p>
              <div className="mt-8 space-y-4 border-y border-white/10 py-5 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-white/45">Nome</span>
                  <strong>{form.name}</strong>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-white/45">E-mail</span>
                  <strong>{form.email}</strong>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-white/45">Empresa</span>
                  <strong>{form.business}</strong>
                </div>
              </div>
              <p className="mt-6 text-xs leading-5 text-white/40">
                Ao continuar, voce concorda com os termos de uso da EasySell.
              </p>
            </Step>
          </Stepper>
        </section>
      </div>
    </main>
  )
}

export default Cadastro
