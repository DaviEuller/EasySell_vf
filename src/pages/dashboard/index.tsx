"use client";

import { useState } from "react";
import {
  BarChart3,
  Home,
  Package,
  Settings,
  Users,
  Wallet,
} from "lucide-react";
import Dock from "@/components/Dock";
import NavbarPreset from "@/components/navbar_preset";
import WelcomeScreen from "@/components/Welcomescreen";
import DashboardCards from "@/components/DashboardCards";

// troque pelo nome real do usuário logado
const USER_NAME = "Davi";

function goToSection(section: string) {
  window.location.hash = section;
}

const dockItems = [
  { icon: <Home size={18} />, label: "Resumo", onClick: () => goToSection("resumo") },
  { icon: <BarChart3 size={18} />, label: "Vendas", onClick: () => goToSection("vendas") },
  { icon: <Package size={18} />, label: "Estoque", onClick: () => goToSection("estoque") },
  { icon: <Wallet size={18} />, label: "Financeiro", onClick: () => goToSection("financeiro") },
  { icon: <Users size={18} />, label: "Clientes", onClick: () => goToSection("clientes") },
  { icon: <Settings size={18} />, label: "Equipe", onClick: () => { window.location.href = "/equipe" } },
];

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
            <div key={label} className="border-l border-blue-400/60 pl-4">
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

      <div className="fixed right-0 bottom-4 left-0 z-20 flex justify-center">
        <Dock items={dockItems} magnification={60} distance={100} panelHeight={64} />
      </div>
    </div>
  );
}

export default AdminPage;