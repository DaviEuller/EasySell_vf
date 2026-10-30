import { useEffect, useState } from "react"
import { ArrowUpRight } from "lucide-react"

type Row = Record<string, unknown>
type Stats = { products: number; sales: number; stock: number; lowStock: number; team: number; revenue: number }
const emptyStats: Stats = { products: 0, sales: 0, stock: 0, lowStock: 0, team: 0, revenue: 0 }

function getRows(payload: unknown): Row[] {
  const value = typeof payload === "object" && payload !== null && "data" in payload
    ? (payload as { data: unknown }).data
    : payload
  if (!Array.isArray(value)) throw new Error("A resposta da API não contém uma lista válida.")
  return value.filter((item): item is Row => typeof item === "object" && item !== null)
}

function numeric(row: Row, key: string): number {
  const value = Number(row[key] ?? 0)
  return Number.isFinite(value) ? value : 0
}

function money(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

export function DynamicResumo() {
  const [stats, setStats] = useState(emptyStats)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const userName = localStorage.getItem("userName")?.trim().split(/\s+/)[0] || ""

  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL?.trim().replace(/\/+$/, "")
    const companyId = localStorage.getItem("companyId")
    const token = localStorage.getItem("accessToken")
    if (!apiUrl || !companyId || !token) {
      setError("Não foi possível identificar sua sessão ou empresa. Entre novamente.")
      setLoading(false)
      return
    }

    const headers = { Authorization: `Bearer ${token}` }
    const company = encodeURIComponent(companyId)
    Promise.all([
      fetch(`${apiUrl}/produtos/company/${company}`, { headers }),
      fetch(`${apiUrl}/clientes/company/${company}`, { headers }),
      fetch(`${apiUrl}/equipe?companyId=${company}`, { headers }),
    ]).then(async ([productsResponse, salesResponse, teamResponse]) => {
      const responses = [productsResponse, salesResponse, teamResponse]
      const failed = responses.find(response => !response.ok)
      if (failed) throw new Error(`Não foi possível carregar o resumo (erro ${failed.status}).`)
      const [productsJson, salesJson, teamJson] = await Promise.all(responses.map(response => response.json()))
      const products = getRows(productsJson)
      const sales = getRows(salesJson)
      const team = getRows(teamJson)
      setStats({
        products: products.length,
        sales: sales.length,
        stock: products.reduce((sum, product) => sum + numeric(product, "quantidade"), 0),
        lowStock: products.filter(product => numeric(product, "quantidade") <= 10).length,
        team: team.length,
        revenue: sales.reduce((sum, sale) => sum + numeric(sale, "Preco_gasto"), 0),
      })
    }).catch((cause: unknown) => {
      setError(cause instanceof Error ? cause.message : "Não foi possível carregar o resumo.")
    }).finally(() => setLoading(false))
  }, [])

  const cards = [
    { id: "products", title: "Produtos", value: String(stats.products), hint: "cadastrados", href: "/produtos", link: "Ver produtos" },
    { id: "sales", title: "Vendas", value: String(stats.sales), hint: "registros no banco", href: "/clientes", link: "Ver vendas" },
    { id: "stock", title: "Estoque", value: `${stats.stock.toLocaleString("pt-BR")} itens`, hint: `${stats.lowStock} produtos com até 10 unidades`, href: "/estoque", link: "Ver estoque" },
    { id: "team", title: "Equipe", value: String(stats.team), hint: "membros cadastrados", href: "/equipe", link: "Ver equipe" },
    { id: "revenue", title: "Total vendido", value: money(stats.revenue), hint: "valor das vendas registradas", href: "/financias", link: "Ver financeiro" },
  ]

  return (
    <main className="min-h-screen bg-background px-4 pt-20 pb-16 text-foreground sm:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-col gap-5 border-b border-border py-8">
          <p className="text-xs font-semibold tracking-[0.24em] text-blue-600 uppercase">Visão geral</p>
          <h1 className="font-heading text-4xl font-bold sm:text-5xl">Resumo{userName ? `, ${userName}` : ""}</h1>
          <p className="max-w-xl text-sm leading-6 text-foreground/50">Informações carregadas dos cadastros e vendas da sua empresa.</p>
        </header>

        {error && <div role="alert" className="mt-6 rounded-md border border-red-500/30 bg-red-500/5 p-4 text-sm text-red-700 dark:text-red-300">{error}</div>}

        <section className="grid grid-cols-1 gap-3 py-6 sm:grid-cols-2 lg:grid-cols-5" aria-busy={loading}>
          {cards.map((card) => (
            <a key={card.id} href={card.href} className="group flex min-h-36 flex-col justify-between rounded-md border border-border bg-card p-4 transition-colors hover:border-blue-500/50">
              <div>
                <p className="text-xs text-foreground/45">{card.title}</p>
                <strong className="mt-2 block text-xl font-medium tracking-tight">{loading ? "Carregando…" : card.value}</strong>
                <p className="mt-1 text-xs text-foreground/45">{loading ? "Buscando dados" : card.hint}</p>
              </div>
              <span className="mt-5 inline-flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-300">{card.link}<ArrowUpRight size={14} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></span>
            </a>
          ))}
        </section>
      </div>
    </main>
  )
}

export default DynamicResumo
