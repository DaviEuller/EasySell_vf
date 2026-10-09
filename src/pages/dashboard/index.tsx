import { useCallback, useEffect, useState } from "react"

import WelcomeScreen from "@/components/Welcomescreen"
import DashboardCards, { type DashboardStats } from "@/components/DashboardCards"

type ApiRecord = Record<string, unknown>

const EMPTY_STATS: DashboardStats = {
  products: 0,
  inventoryUnits: 0,
  inventoryValue: 0,
  lowStock: 0,
  outOfStock: 0,
  customers: 0,
  employees: 0,
  pendingTasks: 0,
  completedTasks: 0,
}

interface AdminPageProps {
  darkMode: boolean
  setDarkMode?: React.Dispatch<React.SetStateAction<boolean>>
}

function isApiRecord(value: unknown): value is ApiRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function getArrayPayload(payload: unknown, keys: string[]): unknown[] {
  let data = payload
  if (isApiRecord(data) && "data" in data) data = data.data
  if (Array.isArray(data)) return data
  if (isApiRecord(data)) {
    for (const key of keys) {
      if (Array.isArray(data[key])) return data[key]
    }
  }
  throw new Error("A API retornou uma lista do dashboard em formato inválido.")
}

function getNumber(record: ApiRecord, keys: string[]): number {
  for (const key of keys) {
    const value = record[key]
    if (typeof value === "number" && Number.isFinite(value)) return value
    if (typeof value === "string" && value.trim()) {
      const number = Number(value.replace(",", "."))
      if (Number.isFinite(number)) return number
    }
  }
  throw new Error(
    `A API retornou um registro sem um valor numérico esperado (${keys[0]}).`,
  )
}

async function getApiError(response: Response) {
  const responseText = await response.text()
  if (responseText) {
    try {
      const body: unknown = JSON.parse(responseText)
      if (isApiRecord(body)) {
        if (typeof body.message === "string") return body.message
        if (
          Array.isArray(body.message) &&
          body.message.every((item) => typeof item === "string")
        ) {
          return body.message.join(" ")
        }
        if (typeof body.error === "string") return body.error
      }
    } catch {
      return responseText
    }
  }
  return `Não foi possível carregar os dados do dashboard (erro ${response.status}).`
}

async function readApiJson(response: Response): Promise<unknown> {
  const text = await response.text()
  if (!text) return null
  try {
    return JSON.parse(text) as unknown
  } catch {
    throw new Error("A API retornou uma resposta inválida para o dashboard.")
  }
}

function greeting() {
  const hour = new Date().getHours()
  if (hour < 12) return "Bom dia"
  if (hour < 18) return "Boa tarde"
  return "Boa noite"
}

export function AdminPage({ darkMode }: AdminPageProps) {
  const [showWelcome, setShowWelcome] = useState(true)
  const [stats, setStats] = useState<DashboardStats>(EMPTY_STATS)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState("")
  const userName = localStorage.getItem("userName")?.trim() || "Olá"
  const companyId = localStorage.getItem("companyId")
  const apiUrl = import.meta.env.VITE_API_URL?.trim().replace(/\/+$/, "")
  const token = localStorage.getItem("accessToken")
  const dateLabel = new Date().toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })

  const loadDashboard = useCallback(async () => {
    if (!apiUrl) {
      throw new Error("A API não está configurada. Defina VITE_API_URL.")
    }
    if (!companyId) {
      throw new Error("Não foi possível identificar a empresa. Entre novamente.")
    }
    if (!token) {
      throw new Error("Sua sessão expirou. Entre novamente para continuar.")
    }

    const headers = { Authorization: `Bearer ${token}` }
    const companyPath = encodeURIComponent(companyId)
    const [productsResponse, customersResponse, teamResponse] =
      await Promise.all([
        fetch(`${apiUrl}/produtos/company/${companyPath}`, { headers }),
        fetch(`${apiUrl}/clientes/company/${companyPath}`, { headers }),
        fetch(`${apiUrl}/equipe?companyId=${companyPath}`, { headers }),
      ])

    for (const response of [
      productsResponse,
      customersResponse,
      teamResponse,
    ]) {
      if (!response.ok) throw new Error(await getApiError(response))
    }

    const [productsPayload, customersPayload, teamPayload] = await Promise.all([
      readApiJson(productsResponse),
      readApiJson(customersResponse),
      readApiJson(teamResponse),
    ])
    const products = getArrayPayload(productsPayload, [
      "products",
      "produtos",
      "items",
    ])
    const customers = getArrayPayload(customersPayload, [
      "customers",
      "clientes",
      "items",
    ])
    const team = getArrayPayload(teamPayload, ["members", "equipe", "items"])

    const computed: DashboardStats = {
      ...EMPTY_STATS,
      products: products.length,
      customers: customers.length,
      employees: team.length,
      inventoryUnits: products.reduce<number>((total, item) => {
        if (!isApiRecord(item)) {
          throw new Error("A API retornou um produto com dados inválidos.")
        }
        const quantity = getNumber(item, [
          "stock",
          "estoque",
          "quantity",
          "quantidade",
        ])
        return total + quantity
      }, 0),
      inventoryValue: products.reduce<number>((total, item) => {
        if (!isApiRecord(item)) {
          throw new Error("A API retornou um produto com dados inválidos.")
        }
        const quantity = getNumber(item, [
          "stock",
          "estoque",
          "quantity",
          "quantidade",
        ])
        const price = getNumber(item, ["price", "preco", "valor"])
        return total + quantity * price
      }, 0),
      lowStock: products.filter((item) => {
        if (!isApiRecord(item)) {
          throw new Error("A API retornou um produto com dados inválidos.")
        }
        const quantity = getNumber(item, [
          "stock",
          "estoque",
          "quantity",
          "quantidade",
        ])
        return quantity > 0 && quantity <= 10
      }).length,
      outOfStock: products.filter((item) => {
        if (!isApiRecord(item)) {
          throw new Error("A API retornou um produto com dados inválidos.")
        }
        return (
          getNumber(item, ["stock", "estoque", "quantity", "quantidade"]) === 0
        )
      }).length,
      pendingTasks: 0,
      completedTasks: 0,
    }

    for (const member of team) {
      if (!isApiRecord(member)) {
        throw new Error("A API retornou um membro da equipe inválido.")
      }
      const tasks = member.tasks ?? []
      if (!Array.isArray(tasks)) {
        throw new Error("A API retornou tarefas da equipe em formato inválido.")
      }
      for (const task of tasks) {
        if (!isApiRecord(task) || typeof task.completed !== "boolean") {
          throw new Error("A API retornou uma tarefa da equipe inválida.")
        }
        if (task.completed) computed.completedTasks += 1
        else computed.pendingTasks += 1
      }
    }

    setStats(computed)
    setLoadError("")
  }, [apiUrl, companyId, token])

  useEffect(() => {
    let active = true
    Promise.resolve()
      .then(loadDashboard)
      .catch((error: unknown) => {
        if (active) {
          setLoadError(
            error instanceof Error
              ? error.message
              : "Não foi possível carregar os dados do dashboard.",
          )
        }
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })

    return () => {
      active = false
    }
  }, [loadDashboard])

  if (showWelcome) {
    return (
      <div className="fixed inset-0 z-[200] bg-background">
        <WelcomeScreen
          name={userName}
          onDone={() => setShowWelcome(false)}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="mx-auto max-w-7xl px-4 pt-20 sm:px-8">
        <section
          id="resumo"
          className={`flex scroll-mt-28 flex-col justify-between gap-6 border-b py-8 sm:flex-row sm:items-end sm:py-12 ${
            darkMode ? "border-border" : "border-black/10"
          }`}
        >
          <div>
            <p className="text-xs font-medium tracking-[0.24em] text-blue-500 uppercase">
              Visão geral · {dateLabel}
            </p>
            <h1 className="mt-4 max-w-xl font-heading text-4xl font-medium leading-none tracking-tight sm:text-6xl">
              {greeting()}, {userName}.
            </h1>
            <p
              className={`mt-4 max-w-lg text-sm leading-6 sm:text-base ${
                darkMode ? "text-foreground/50" : "text-black/50"
              }`}
            >
              Acompanhe os dados atuais de produtos, estoque, clientes e equipe.
            </p>
          </div>
        </section>

        <div className="flex items-center justify-between py-7">
          <div>
            <p className="text-xs font-medium tracking-[0.2em] text-blue-500 uppercase">
              Operação
            </p>
            <h2 className="mt-2 font-heading text-2xl font-medium tracking-tight">
              Dados atuais da sua empresa
            </h2>
          </div>
          {!isLoading && !loadError && (
            <span
              className={`hidden text-xs sm:block ${
                darkMode ? "text-foreground/40" : "text-black/40"
              }`}
            >
              Atualizado agora
            </span>
          )}
        </div>

        {loadError ? (
          <div className="rounded-md border border-red-500/20 bg-red-500/5 p-5">
            <p role="alert" className="text-sm text-red-700 dark:text-red-300">
              {loadError}
            </p>
            <button
              type="button"
              onClick={() => {
                setIsLoading(true)
                void loadDashboard()
                  .catch((error: unknown) =>
                    setLoadError(
                      error instanceof Error
                        ? error.message
                        : "Não foi possível carregar os dados do dashboard.",
                    ),
                  )
                  .finally(() => setIsLoading(false))
              }}
              className="mt-3 text-sm font-semibold text-blue-600 dark:text-blue-300"
            >
              Tentar novamente
            </button>
          </div>
        ) : (
          <DashboardCards
            darkMode={darkMode}
            stats={stats}
            isLoading={isLoading}
          />
        )}
      </main>
    </div>
  )
}

export default AdminPage
