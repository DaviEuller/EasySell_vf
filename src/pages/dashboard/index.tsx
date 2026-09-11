"use client";

import { useState } from "react";
import { AppDock } from "@/components/Dock";
import NavbarPreset from "@/components/navbar_preset";
import WelcomeScreen from "@/components/Welcomescreen";
import DashboardCards from "@/components/DashboardCards";

// troque pelo nome real do usuário logado
const USER_NAME = "Davi";

export function AdminPage() {
  const [showWelcome, setShowWelcome] = useState(true);

  if (showWelcome) {
    return (
      <WelcomeScreen
        name={USER_NAME}
        onDone={() => setShowWelcome(false)}
      />
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#070B14] pb-32 text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_85%_8%,rgba(37,99,235,0.18),transparent_28%),radial-gradient(circle_at_10%_90%,rgba(14,165,233,0.08),transparent_30%)]" />
      <NavbarPreset />

      <main className="relative z-10 mx-auto max-w-7xl px-3 pt-24 sm:px-5 sm:pt-28">
        <section id="resumo" className="flex scroll-mt-28 flex-col justify-between gap-6 border-b border-white/10 py-8 sm:flex-row sm:items-end sm:py-12">
          <div>
            <p className="text-xs font-semibold tracking-[0.24em] text-blue-300 uppercase">
              Visão geral · 07 setembro 2026
            </p>
            <h1 className="mt-4 max-w-xl font-heading text-4xl leading-none font-bold sm:text-6xl">
              Bom dia, {USER_NAME}.
            </h1>
            <p className="mt-4 max-w-lg text-sm leading-6 text-white/50 sm:text-base">
              Aqui está o pulso da sua operação. Tudo sob controle, em um só lugar.
            </p>
          </div>
        </section>

        <section className="grid gap-3 border-b border-white/10 py-6 sm:grid-cols-3">
          {[
            ["Faturamento hoje", "R$ 3.840", "+12,4%"],
            ["Pedidos em aberto", "28", "+4 desde ontem"],
            ["Ticket médio", "R$ 184,20", "+8,1%"],
          ].map(([label, value, change]) => (
            <div key={label} className="rounded-xl border border-blue-300/20 bg-gradient-to-br from-blue-400/10 via-white/[0.04] to-blue-600/[0.08] p-4 shadow-lg shadow-blue-950/25 backdrop-blur-xl">
                <p className="text-xs text-white/45">{label}</p>
                <div className="mt-2 flex items-baseline gap-3">
                  <strong className="font-heading text-2xl font-semibold text-white">{value}</strong>
                  <span className="text-xs font-medium text-[#5DCAA5]">{change}</span>
                </div>
            </div>
          ))}
        </section>

        <div className="flex items-center justify-between py-7">
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] text-blue-300 uppercase">Desempenho</p>
            <h2 className="mt-2 font-heading text-2xl font-bold">Seus números, sem ruído.</h2>
          </div>
          <span className="hidden text-xs text-white/40 sm:block">Atualizado há 2 min</span>
        </div>
        <DashboardCards />
      </main>

      <AppDock />
    </div>
  );
}

export default AdminPage;