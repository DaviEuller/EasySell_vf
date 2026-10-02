import { useState } from "react";

import WelcomeScreen from "@/components/Welcomescreen";
import DashboardCards from "@/components/DashboardCards";

const USER_NAME = "Davi";

interface AdminPageProps {
  darkMode: boolean;
  setDarkMode?: React.Dispatch<React.SetStateAction<boolean>>;
}

export function AdminPage({ darkMode }: AdminPageProps) {
  const [showWelcome, setShowWelcome] = useState(true);

  if (showWelcome) {
    return (
      <div className="fixed inset-0 z-[200] bg-background">
        <WelcomeScreen
          name={USER_NAME}
          onDone={() => setShowWelcome(false)}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* CONTEÚDO */}
      <div>

        <main className="mx-auto max-w-7xl px-4 pt-20 sm:px-8">

          {/* Cabeçalho */}
          <section
            id="resumo"
            className={
              darkMode
                ? "flex scroll-mt-28 flex-col justify-between gap-6 border-b border-border py-8 sm:flex-row sm:items-end sm:py-12"
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
                    ? "mt-4 max-w-lg text-sm leading-6 text-foreground/50 sm:text-base"
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
                ? "grid gap-3 border-b border-border py-6 sm:grid-cols-3"
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
                    ? "rounded-md border border-border bg-card p-4"
                    : "rounded-md border border-black/10 bg-white p-4"
                }
              >
                <p
                  className={
                    darkMode
                      ? "text-xs text-foreground/45"
                      : "text-xs text-black/45"
                  }
                >
                  {label}
                </p>

                <div className="mt-2 flex items-baseline gap-3">
                  <strong className="font-heading text-2xl font-medium tracking-tight">
                    {value}
                  </strong>

                  <span className="text-xs font-medium text-emerald-600 dark:text-[#5DCAA5]">
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
                  ? "hidden text-xs text-foreground/40 sm:block"
                  : "hidden text-xs text-black/40 sm:block"
              }
            >
              Atualizado há 2 min
            </span>
          </div>

          <DashboardCards darkMode={darkMode} />
        </main>
      </div>
    </div>
  );
}

export default AdminPage;