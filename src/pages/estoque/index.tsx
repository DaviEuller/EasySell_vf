import { useCallback, useEffect, useState } from "react"
import {
  ArrowUpRight,
  CircleAlert,
  Package,
  PackagePlus,
  Search,
  TriangleAlert,
} from "lucide-react"

type Product = {
  id: string | number
  name: string
  category: string
  price: number
  stock: number
}

const minimumStock = 10

type ApiRecord = Record<string, unknown>

function isApiRecord(value: unknown): value is ApiRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function getProductId(product: ApiRecord): string | number | undefined {
  for (const key of ["id", "_id", "productId", "produtoId"]) {
    const value = product[key]
    if (typeof value === "string" && value.trim()) return value.trim()
    if (typeof value === "number" && Number.isFinite(value)) return value
  }
  return undefined
}

function getNumber(record: ApiRecord, keys: string[]) {
  for (const key of keys) {
    const value = record[key]
    if (typeof value === "number" && Number.isFinite(value)) return value
    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value.replace(",", "."))
      if (Number.isFinite(parsed)) return parsed
    }
  }
  return undefined
}

function parseProduct(value: unknown): Product | null {
  if (!isApiRecord(value)) return null
  const id = getProductId(value)
  const name =
    typeof value.name === "string"
      ? value.name
      : typeof value.nome === "string"
        ? value.nome
        : undefined
  const category =
    typeof value.categoria === "string"
      ? value.categoria
      : typeof value.category === "string"
        ? value.category
        : ""
  const price = getNumber(value, ["preco", "price"])
  const stock = getNumber(value, ["quantidade", "stock"])

  if (id === undefined || !name || price === undefined || stock === undefined) {
    return null
  }

  return { id, name, category, price, stock }
}

function parseProducts(payload: unknown): Product[] {
  let data = payload
  if (isApiRecord(data) && "data" in data) data = data.data
  if (isApiRecord(data)) {
    data = data.products ?? data.produtos ?? data.items
  }
  if (!Array.isArray(data)) {
    throw new Error("A resposta da API de produtos está em um formato inválido.")
  }

  const products = data.map(parseProduct)
  if (products.some((product) => product === null)) {
    throw new Error("A API retornou um produto com dados inválidos.")
  }
  return products.filter((product): product is Product => product !== null)
}

async function getApiError(response: Response) {
  const responseText = await response.text()
  if (!responseText) {
    return `Não foi possível carregar o estoque (erro ${response.status}).`
  }

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

  return `Não foi possível carregar o estoque (erro ${response.status}).`
}

async function readApiJson(response: Response): Promise<unknown> {
  const responseText = await response.text()
  if (!responseText) return null
  try {
    return JSON.parse(responseText) as unknown
  } catch {
    throw new Error("A resposta da API de produtos está em um formato inválido.")
  }
}

function money(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

function statusOf(product: Product) {
  if (product.stock === 0)
    return { label: "Sem estoque", badge: "bg-red-400/15 text-red-600 dark:text-red-300 border-red-400/25", bar: "bg-red-400", level: 0 }
  if (product.stock <= minimumStock)
    return { label: "Estoque baixo", badge: "bg-amber-400/15 text-amber-600 dark:text-amber-300 border-amber-400/25", bar: "bg-amber-400", level: product.stock / minimumStock }
  return { label: "Em dia", badge: "bg-[#5DCAA5]/15 text-emerald-600 dark:text-[#5DCAA5] border-[#5DCAA5]/25", bar: "bg-[#5DCAA5]", level: 1 }
}

export function Estoque() {
  const [products, setProducts] = useState<Product[]>([])
  const [search, setSearch] = useState("")
  const [notice, setNotice] = useState("")
  const [loadError, setLoadError] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  const loadProducts = useCallback(async () => {
    const apiUrl = import.meta.env.VITE_API_URL?.trim().replace(/\/+$/, "")
    const companyId = localStorage.getItem("companyId")
    if (!apiUrl) {
      throw new Error("A API não está configurada. Defina VITE_API_URL.")
    }
    if (!companyId) {
      throw new Error("Não foi possível identificar a empresa. Entre novamente.")
    }

    const token = localStorage.getItem("accessToken")
    const response = await fetch(
      `${apiUrl}/produtos/company/${encodeURIComponent(companyId)}`,
      {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      }
    )
    if (!response.ok) throw new Error(await getApiError(response))
    setProducts(parseProducts(await readApiJson(response)))
    setLoadError("")
  }, [])

  useEffect(() => {
    let active = true
    Promise.resolve()
      .then(loadProducts)
      .catch((error: unknown) => {
        if (active) {
          setLoadError(
            error instanceof Error
              ? error.message
              : "Não foi possível carregar o estoque."
          )
        }
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })

    return () => {
      active = false
    }
  }, [loadProducts])

  const lowStock = products.filter(
    (p) => p.stock > 0 && p.stock <= minimumStock
  )
  const outOfStock = products.filter((p) => p.stock === 0)
  const restockList = [...lowStock, ...outOfStock]
  const totalUnits = products.reduce((sum, p) => sum + p.stock, 0)
  const stockValue = products.reduce((sum, p) => sum + p.stock * p.price, 0)

  const filtered = products.filter((p) =>
    `${p.name} ${p.category}`.toLowerCase().includes(search.toLowerCase())
  )

  const requestRestock = (product: Product) => {
    setNotice(
      `Sugestão para ${product.name}: ${minimumStock * 2 - product.stock} unidades. Esta tela ainda não registra pedidos de reposição na API.`
    )
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-background px-4 pt-20 pb-16 text-foreground sm:px-8">

      <style>{`
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-up { animation: fade-up 0.6s ease-out both; }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.8); }
        }
        .animate-pulse-dot { animation: pulse-dot 2s ease-in-out infinite; }
      `}</style>

      <div className="relative z-10 mx-auto max-w-6xl">
        {/* Header */}
        <header
          className="animate-fade-up flex flex-col justify-between gap-5 border-b border-border py-8 sm:flex-row sm:items-end"
          style={{ animationDelay: "0.05s" }}
        >
          <div>
            <p className="text-xs font-semibold tracking-[0.24em] text-blue-600 dark:text-blue-300 uppercase">
              Controle de estoque
            </p>
            <h1 className="mt-3 font-heading text-4xl font-bold sm:text-5xl">
              Seus produtos, no radar.
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-foreground/50">
              Acompanhe quantidades, preços e saiba exatamente o que repor.
            </p>
          </div>
         
        </header>

        {/* KPIs */}
        <section className="grid grid-cols-1 gap-3 py-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Total de itens", value: isLoading || loadError ? "—" : totalUnits.toLocaleString("pt-BR"), positive: true },
            { label: "Valor em estoque", value: isLoading || loadError ? "—" : money(stockValue), positive: true },
            { label: "Estoque baixo", value: isLoading || loadError ? "—" : String(lowStock.length), positive: false },
            { label: "Sem estoque", value: isLoading || loadError ? "—" : String(outOfStock.length), positive: false },
          ].map((kpi, index) => (
            <div
              key={kpi.label}
              className="animate-fade-up rounded-md border border-border bg-card p-4"
              style={{ animationDelay: `${0.1 + index * 0.06}s` }}
            >
              <div>
                <p className="text-xs text-foreground/45">{kpi.label}</p>
                <strong
                  className={`mt-2 block text-xl font-medium tracking-tight ${kpi.positive ? "text-foreground" : "text-amber-600 dark:text-amber-300"}`}
                >
                  {kpi.value}
                </strong>
              </div>
            </div>
          ))}
        </section>

        {/* Alertas */}
        {!isLoading && !loadError && restockList.length > 0 && (
          <section
            className="animate-fade-up mb-3 grid gap-3 sm:grid-cols-2"
            style={{ animationDelay: "0.2s" }}
          >
            <div className="rounded-md border border-amber-500/25 bg-card p-4 sm:p-5">
              <div className="flex items-center gap-2">
                <TriangleAlert className="text-amber-600 dark:text-amber-300" size={18} />
                <p className="text-xs font-semibold tracking-[0.16em] text-amber-600 dark:text-amber-300 uppercase">
                  Estoque baixo
                </p>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {lowStock.map((p) => (
                  <span
                    key={p.id}
                    className="rounded-md border border-amber-400/20 bg-amber-400/10 px-3 py-1.5 text-xs text-amber-700 dark:text-amber-200"
                  >
                    {p.name} · restam {p.stock}
                  </span>
                ))}
              </div>
            </div>
            <div className="rounded-md border border-red-500/25 bg-card p-4 sm:p-5">
              <div className="flex items-center gap-2">
                <CircleAlert className="text-red-600 dark:text-red-300" size={18} />
                <p className="text-xs font-semibold tracking-[0.16em] text-red-600 dark:text-red-300 uppercase">
                  Sem estoque
                </p>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {outOfStock.map((p) => (
                  <span
                    key={p.id}
                    className="rounded-md border border-red-400/20 bg-red-400/10 px-3 py-1.5 text-xs text-red-700 dark:text-red-200"
                  >
                    {p.name}
                  </span>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Tabela de produtos */}
        <section
          className="animate-fade-up rounded-md border border-border bg-card p-5 sm:p-6"
          style={{ animationDelay: "0.25s" }}
        >
          <div className="relative z-10">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <p className="text-xs font-semibold tracking-[0.16em] text-blue-600 dark:text-blue-300 uppercase">
                  Inventário
                </p>
                <h2 className="mt-2 font-heading text-2xl font-bold">
                  Todos os produtos
                </h2>
              </div>
              <label className="flex h-10 w-full items-center gap-2 rounded-md border border-foreground/15 bg-foreground/[0.05] px-3 text-sm text-foreground/60 focus-within:border-blue-400/60 sm:w-64">
                <Search size={15} className="shrink-0 text-foreground/35" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar produto..."
                  className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-foreground/30"
                />
              </label>
            </div>

            <div className="mt-6 overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs tracking-wide text-foreground/35 uppercase">
                    <th className="pb-3 font-medium">Produto</th>
                    <th className="pb-3 font-medium">Preço</th>
                    <th className="pb-3 font-medium">Quantidade</th>
                    <th className="pb-3 font-medium">Nível</th>
                    <th className="pb-3 text-right font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((product) => {
                    const status = statusOf(product)
                    return (
                      <tr
                        key={product.id}
                        className="border-b border-border transition last:border-0 hover:bg-foreground/[0.03]"
                      >
                        <td className="py-3.5 pr-4">
                          <p className="font-medium text-foreground">{product.name}</p>
                          <p className="text-xs text-foreground/35">{product.category}</p>
                        </td>
                        <td className="py-3.5 pr-4 font-medium">{money(product.price)}</td>
                        <td className="py-3.5 pr-4 text-foreground/70">
                          {product.stock} un.
                        </td>
                        <td className="py-3.5 pr-4">
                          <div className="h-1.5 w-24 overflow-hidden rounded-full bg-foreground/10">
                            <div
                              className={`h-full rounded-full ${status.bar} transition-all duration-700`}
                              style={{ width: `${Math.min(status.level * 100, 100)}%` }}
                            />
                          </div>
                        </td>
                        <td className="py-3.5 text-right">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${status.badge}`}
                          >
                            <span className="size-1.5 rounded-full bg-current" />
                            {status.label}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                  {isLoading && (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-sm text-foreground/45">
                        Carregando estoque...
                      </td>
                    </tr>
                  )}
                  {!isLoading && loadError && (
                    <tr>
                      <td colSpan={5} role="alert" className="py-10 text-center text-sm text-red-600 dark:text-red-300">
                        {loadError}
                      </td>
                    </tr>
                  )}
                  {!isLoading && !loadError && filtered.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-sm text-foreground/35">
                        {search
                          ? `Nenhum produto encontrado para "${search}".`
                          : "Nenhum produto cadastrado."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Reposição */}
        <section
          className="animate-fade-up mt-3 rounded-md border border-border bg-card p-5 sm:p-6"
          style={{ animationDelay: "0.3s" }}
        >
          <div className="relative z-10">
            <div className="flex items-center gap-3">
              <PackagePlus className="text-blue-600 dark:text-blue-300" size={22} />
              <div>
                <p className="text-xs font-semibold tracking-[0.16em] text-blue-600 dark:text-blue-300 uppercase">
                  Reposição
                </p>
                <h2 className="mt-1 font-heading text-2xl font-bold">
                  Produtos para repor
                </h2>
              </div>
            </div>

            {isLoading ? (
              <p className="mt-6 text-sm text-foreground/45">
                Carregando recomendações de reposição...
              </p>
            ) : loadError ? null : restockList.length > 0 ? (
              <div className="mt-6 overflow-x-auto">
                <table className="w-full min-w-[560px] text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs tracking-wide text-foreground/35 uppercase">
                      <th className="pb-3 font-medium">Produto</th>
                      <th className="pb-3 font-medium">Em estoque</th>
                      <th className="pb-3 font-medium">Mínimo</th>
                      <th className="pb-3 font-medium">Sugerido</th>
                      <th className="pb-3 text-right font-medium">Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {restockList.map((product) => (
                      <tr
                        key={product.id}
                        className="border-b border-border last:border-0 hover:bg-foreground/[0.03]"
                      >
                        <td className="py-3.5 pr-4">
                          <span className="flex items-center gap-2 font-medium text-foreground">
                            <Package size={15} className="text-foreground/35" />
                            {product.name}
                          </span>
                        </td>
                        <td
                          className={`py-3.5 pr-4 font-semibold ${product.stock === 0 ? "text-red-600 dark:text-red-300" : "text-amber-600 dark:text-amber-300"}`}
                        >
                          {product.stock} un.
                        </td>
                        <td className="py-3.5 pr-4 text-foreground/50">{minimumStock} un.</td>
                        <td className="py-3.5 pr-4 text-emerald-600 dark:text-[#5DCAA5]">
                          {minimumStock * 2 - product.stock} un.
                        </td>
                        <td className="py-3.5 text-right">
                          <button
                            onClick={() => requestRestock(product)}
                            className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold transition hover:bg-blue-500"
                          >
                            Ver sugestão <ArrowUpRight size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="mt-6 rounded-md border border-[#5DCAA5]/20 bg-[#5DCAA5]/5 p-4 text-sm text-emerald-600 dark:text-[#5DCAA5]">
                Tudo em dia — nenhum produto precisa de reposição no momento.
              </p>
            )}

            {notice && (
              <p className="mt-4 rounded-md border border-blue-400/15 bg-blue-400/5 px-4 py-3 text-sm text-blue-700 dark:text-blue-200">
                {notice}
              </p>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}

export default Estoque