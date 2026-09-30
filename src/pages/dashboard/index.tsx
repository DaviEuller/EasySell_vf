import { useState } from "react";

import {
  Download04Icon,
  Rocket01Icon,
  Settings02Icon,
} from "@hugeicons/core-free-icons";

import NavbarPreset from "@/components/navbar_preset";
import WelcomeScreen from "@/components/Welcomescreen";
import DashboardCards from "@/components/DashboardCards";
import BranchedMenu from "@/components/BranchedMenu";

const USER_NAME = "Davi";

interface AdminPageProps {
  darkMode: boolean;
  setDarkMode: React.Dispatch<React.SetStateAction<boolean>>;
}

export function AdminPage({
  darkMode,
  setDarkMode,
}: AdminPageProps) {
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
    <div
      className={
        darkMode
          ? "min-h-screen bg-[#0B1220] text-white transition-colors duration-300"
          : "min-h-screen bg-[#F5F7FA] text-[#111827] transition-colors duration-300"
      }
    >
      {/* SIDEBAR */}
      <aside
        className={
          darkMode
            ? "fixed inset-y-0 left-0 z-50 hidden w-[260px] border-r border-white/10 bg-black lg:block"
            : "fixed inset-y-0 left-0 z-50 hidden w-[260px] border-r border-black/10 bg-white lg:block"
        }
      >
        <div className="flex h-full flex-col">

          {/* Logo */}
          <div
            className={
              darkMode
                ? "flex h-20 items-center border-b border-white/10 px-6"
                : "flex h-20 items-center border-b border-black/10 px-6"
            }
          >
            <div>
              <p className="font-heading text-lg font-medium tracking-tight">
                Admin
              </p>

              <p
                className={
                  darkMode
                    ? "mt-0.5 text-xs text-white/40"
                    : "mt-0.5 text-xs text-black/40"
                }
              >
                Painel de controle
              </p>
            </div>
          </div>

          {/* MENU */}
          <div className="flex-1 overflow-y-auto px-3 py-5">
            <BranchedMenu
              items={[
                {
                  label: "Dashboard",
                  children: [
                    {
                      value: "resumo",
                      label: "Visão geral",
                      icon: Rocket01Icon,
                    },
                    {
                      value: "vendas",
                      label: "Vendas",
                      icon: Download04Icon,
                    },
                    {
                      value: "config",
                      label: "Configurações",
                      icon: Settings02Icon,
                    },
                  ],
                },
                {
                  label: "Gerenciamento",
                  children: [
                    {
                      value: "produtos",
                      label: "Produtos",
                    },
                    {
                      value: "pedidos",
                      label: "Pedidos",
                    },
                  ],
                },
              ]}
              defaultOpen={[0, 1]}
              defaultActive="resumo"
              onSelect={(value) => {
                if (value === "resumo") {
                  document
                    .getElementById("resumo")
                    ?.scrollIntoView({
                      behavior: "smooth",
                    });
                  return;
                }

                if (value === "vendas") {
                  window.location.href = "/vendas";
                  return;
                }

                if (value === "produtos") {
                  window.location.href = "/produtos";
                  return;
                }

                if (value === "pedidos") {
                  window.location.href = "/pedidos";
                  return;
                }

                if (value === "config") {
                  window.location.href = "/configuracoes";
                }
              }}
              color={darkMode ? "#A8B3C7" : "#374151"}
              accentColor={darkMode ? "#F5F5F5" : "#111827"}
              lineColor={darkMode ? "#3F3F46" : "#D1D5DB"}
              width={230}
              rowHeight={38}
              indent={34}
              trunk={12}
              radius={8}
              lineWidth={1.5}
              fontSize={14}
              drawDuration={300}
              foldDuration={250}
            />
          </div>

          {/* RODAPÉ */}
          <div
            className={
              darkMode
                ? "space-y-3 border-t border-white/10 p-4"
                : "space-y-3 border-t border-black/10 p-4"
            }
          >
            {/* Tema */}
            <button
              type="button"
              onClick={() => setDarkMode((current) => !current)}
              className={
                darkMode
                  ? "flex w-full items-center justify-between rounded-md border border-white/10 bg-white/[0.03] px-3 py-3 text-left transition hover:bg-white/[0.06]"
                  : "flex w-full items-center justify-between rounded-md border border-black/10 bg-black/[0.02] px-3 py-3 text-left transition hover:bg-black/[0.05]"
              }
            >
              <div>
                <p className="text-sm font-medium">
                  Tema
                </p>

                <p
                  className={
                    darkMode
                      ? "mt-0.5 text-xs text-white/40"
                      : "mt-0.5 text-xs text-black/40"
                  }
                >
                  {darkMode ? "Escuro" : "Claro"}
                </p>
              </div>

              <span className="text-lg">
                {darkMode ? "☀️" : "🌙"}
              </span>
            </button>

            {/* USUÁRIO */}
            <div
              className={
                darkMode
                  ? "flex items-center gap-3 rounded-md border border-white/10 bg-white/[0.02] px-3 py-3"
                  : "flex items-center gap-3 rounded-md border border-black/10 bg-black/[0.02] px-3 py-3"
              }
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/15 text-xs font-medium text-blue-500">
                {USER_NAME.charAt(0)}
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-medium">
                  {USER_NAME}
                </p>

                <p
                  className={
                    darkMode
                      ? "text-xs text-white/40"
                      : "text-xs text-black/40"
                  }
                >
                  Administrador
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* CONTEÚDO */}
      <div className="lg:pl-[260px]">
        <NavbarPreset />

        <main className="mx-auto max-w-7xl px-4 pt-20 sm:px-8">

          {/* Cabeçalho */}
          <section
            id="resumo"
            className={
              darkMode
                ? "flex scroll-mt-28 flex-col justify-between gap-6 border-b border-white/10 py-8 sm:flex-row sm:items-end sm:py-12"
                : "flex scroll-mt-28 flex-col justify-between gap-6 border-b border-black/10 py-8 sm:flex-row sm:items-end sm:py-12"
            }
          >
            <div>
              <p className="text-xs font-medium tracking-[0.24em] text-blue-500 uppercase">
                Visão geral · 07 setembro 2026
              </p>

              <h1 className="mt-4 max-w-xl font-heading text-4xl font-medium leading-none tracking-tight sm:text-6xl">
                Bom dia, {USER_NAME}.
              </h1>

              <p
                className={
                  darkMode
                    ? "mt-4 max-w-lg text-sm leading-6 text-white/50 sm:text-base"
                    : "mt-4 max-w-lg text-sm leading-6 text-black/50 sm:text-base"
                }
              >
                Aqui está o pulso da sua operação. Tudo sob controle,
                em um só lugar.
              </p>
            </div>
          </section>

          {/* MÉTRICAS */}
          <section
            className={
              darkMode
                ? "grid gap-3 border-b border-white/10 py-6 sm:grid-cols-3"
                : "grid gap-3 border-b border-black/10 py-6 sm:grid-cols-3"
            }
          >
            {[
              ["Faturamento hoje", "R$ 3.840", "+12,4%"],
              ["Pedidos em aberto", "28", "+4 desde ontem"],
              ["Ticket médio", "R$ 184,20", "+8,1%"],
            ].map(([label, value, change]) => (
              <div
                key={label}
                className={
                  darkMode
                    ? "rounded-md border border-white/10 bg-[#111B2E] p-4"
                    : "rounded-md border border-black/10 bg-white p-4"
                }
              >
                <p
                  className={
                    darkMode
                      ? "text-xs text-white/45"
                      : "text-xs text-black/45"
                  }
                >
                  {label}
                </p>

                <div className="mt-2 flex items-baseline gap-3">
                  <strong className="font-heading text-2xl font-medium tracking-tight">
                    {value}
                  </strong>

                  <span className="text-xs font-medium text-[#5DCAA5]">
                    {change}
                  </span>
                </div>
              </div>
            ))}
          </section>

          {/* DESEMPENHO */}
          <div className="flex items-center justify-between py-7">
            <div>
              <p className="text-xs font-medium tracking-[0.2em] text-blue-500 uppercase">
                Desempenho
              </p>

              <h2 className="mt-2 font-heading text-2xl font-medium tracking-tight">
                Seus números, sem ruído.
              </h2>
            </div>

            <span
              className={
                darkMode
                  ? "hidden text-xs text-white/40 sm:block"
                  : "hidden text-xs text-black/40 sm:block"
              }
            >
              Atualizado há 2 min
            </span>
          </div>

          <DashboardCards />
        </main>
      </div>
    </div>
  );
}

export default AdminPage;