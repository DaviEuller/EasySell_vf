import { useNavigate } from "react-router-dom"
import { LogOut, Moon, Sun, UserRound } from "lucide-react"

import { useDarkMode } from "@/lib/use-dark-mode"

export default function Configuracoes() {
  const navigate = useNavigate()
  const { darkMode, setDarkMode } = useDarkMode()
  const name = localStorage.getItem("userName")?.trim() || "Usuário EasySell"
  const email = localStorage.getItem("userEmail")?.trim() || "E-mail não disponível"
  const role = localStorage.getItem("role") || "Conta"

  const signOut = () => {
    for (const key of [
      "accessToken",
      "companyId",
      "equipeMemberId",
      "role",
      "sub",
      "userEmail",
      "userId",
      "userName",
    ]) {
      localStorage.removeItem(key)
    }
    sessionStorage.removeItem("easysell:has-company")
    navigate("/login", { replace: true })
  }

  return (
    <main className="min-h-screen bg-background px-4 pt-20 pb-16 text-foreground sm:px-8">
      <div className="mx-auto max-w-4xl">
        <header className="py-10">
          <p className="text-xs font-semibold tracking-[0.24em] text-blue-600 uppercase dark:text-blue-300">
            Preferências
          </p>
          <h1 className="mt-4 font-heading text-4xl font-bold">
            Configurações
          </h1>
          <p className="mt-3 text-sm text-foreground/55">
            Gerencie sua conta e as preferências da EasySell.
          </p>
        </header>

        <section className="app-panel rounded-md p-6 sm:p-8">
          <div className="flex items-center gap-4">
            <div className="flex size-12 items-center justify-center rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-300">
              <UserRound size={22} />
            </div>
            <div className="min-w-0">
              <h2 className="font-semibold">{name}</h2>
              <p className="mt-1 truncate text-sm text-foreground/55">{email}</p>
              <p className="mt-1 text-xs capitalize text-foreground/40">{role}</p>
            </div>
          </div>
        </section>

        <section className="app-panel mt-4 flex flex-col gap-4 rounded-md p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div>
            <h2 className="font-semibold">Aparência</h2>
            <p className="mt-1 text-sm text-foreground/55">
              Escolha o tema usado na interface.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setDarkMode(!darkMode)}
            className="inline-flex items-center justify-center gap-2 rounded-md border border-border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-foreground/[0.05]"
          >
            {darkMode ? <Sun size={17} /> : <Moon size={17} />}
            Ativar tema {darkMode ? "claro" : "escuro"}
          </button>
        </section>

        <section className="app-panel mt-4 flex flex-col gap-4 rounded-md p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div>
            <h2 className="font-semibold">Sessão</h2>
            <p className="mt-1 text-sm text-foreground/55">
              Encerre sua sessão neste dispositivo.
            </p>
          </div>
          <button
            type="button"
            onClick={signOut}
            className="inline-flex items-center justify-center gap-2 rounded-md border border-red-500/30 px-4 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-500/10 dark:text-red-300"
          >
            <LogOut size={17} />
            Sair da conta
          </button>
        </section>
      </div>
    </main>
  )
}
