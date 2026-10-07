import { useCallback, useEffect, useState } from "react"
import {
  LayoutGrid,
  List,
  Package,
  PackagePlus,
  Pencil,
  Search,
  Trash2,
} from "lucide-react"
import JellyRadio from "@/components/JellyRadio"

type Product = {
  id: string | number
  name: string
  category: string
  price: number
  stock: number
}

type ProductForm = {
  name: string
  category: string
  price: string
  stock: string
}

type StockFilter = "Todos" | "Em estoque" | "Estoque baixo" | "Sem estoque"
type ViewMode = "list" | "grid"

const panel = "rounded-md border border-border bg-card"

const stockFilters: StockFilter[] = [
  "Todos",
  "Em estoque",
  "Estoque baixo",
  "Sem estoque",
]

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
    typeof value.category === "string"
      ? value.category
      : typeof value.categoria === "string"
        ? value.categoria
        : ""
  const price = getNumber(value, ["price", "preco", "valor"])
  const stock = getNumber(value, ["stock", "estoque", "quantity", "quantidade"])

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
    return `Não foi possível concluir a operação (erro ${response.status}).`
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

  return `Não foi possível concluir a operação (erro ${response.status}).`
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
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  })
}

function stockInfo(stock: number) {
  if (stock === 0) {
    return {
      label: "Sem estoque",
      className: "border-red-400/25 bg-red-400/10 text-red-600 dark:text-red-300",
    }
  }

  if (stock <= 10) {
    return {
      label: `${stock} un.`,
      className: "border-amber-400/25 bg-amber-400/10 text-amber-600 dark:text-amber-300",
    }
  }

  return {
    label: `${stock} un.`,
    className: "border-[#5DCAA5]/25 bg-[#5DCAA5]/10 text-emerald-600 dark:text-[#5DCAA5]",
  }
}

function matchesStockFilter(stock: number, filter: StockFilter) {
  if (filter === "Em estoque") return stock > 10
  if (filter === "Estoque baixo") return stock > 0 && stock <= 10
  if (filter === "Sem estoque") return stock === 0
  return true
}

export default function Produtos() {
  const [products, setProducts] = useState<Product[]>([])

  const [form, setForm] = useState<ProductForm>({
    name: "",
    category: "",
    price: "",
    stock: "",
  })

  const [editingId, setEditingId] = useState<string | number | null>(null)
  const [search, setSearch] = useState("")
  const [notice, setNotice] = useState("")
  const [stockFilter, setStockFilter] = useState<StockFilter>("Todos")
  const [viewMode, setViewMode] = useState<ViewMode>("list")
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState("")
  const [isSaving, setIsSaving] = useState(false)

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
          const message =
            error instanceof Error
              ? error.message
              : "Não foi possível carregar os produtos."
          setLoadError(message)
          setNotice(message)
        }
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })

    return () => {
      active = false
    }
  }, [loadProducts])

  const totalStockValue = products.reduce(
    (sum, product) => sum + product.price * product.stock,
    0
  )

  const filteredProducts = products.filter(
    (product) =>
      matchesStockFilter(product.stock, stockFilter) &&
      `${product.name} ${product.category}`
        .toLowerCase()
        .includes(search.toLowerCase())
  )

  const updateForm = (field: keyof ProductForm, value: string) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const resetForm = () => {
    setForm({
      name: "",
      category: "",
      price: "",
      stock: "",
    })

    setEditingId(null)
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const price = Number(form.price.replace(",", "."))
    const stock = Number(form.stock)

    if (
      !form.name.trim() ||
      !form.category.trim() ||
      !form.price.trim() ||
      !form.stock.trim() ||
      !Number.isFinite(price) ||
      !Number.isInteger(stock) ||
      price < 0 ||
      stock < 0
    ) {
      setNotice("Preencha todos os campos corretamente.")
      return
    }

    const apiUrl = import.meta.env.VITE_API_URL?.trim().replace(/\/+$/, "")
    const companyId = localStorage.getItem("companyId")
    if (!apiUrl || !companyId) {
      setNotice(
        !apiUrl
          ? "A API não está configurada. Defina VITE_API_URL."
          : "Não foi possível identificar a empresa. Entre novamente."
      )
      return
    }

    const token = localStorage.getItem("accessToken")
    setIsSaving(true)
    setNotice("")
    try {
      const response = await fetch(
        editingId
          ? `${apiUrl}/produtos/${encodeURIComponent(editingId)}`
          : `${apiUrl}/produtos`,
        {
          method: editingId ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            name: form.name.trim(),
            categoria: form.category.trim(),
            preco: price,
            quantidade: stock,
            companyId,
          }),
        }
      )
      if (!response.ok) throw new Error(await getApiError(response))

      await loadProducts()
      setNotice(
        editingId
          ? "Produto atualizado com sucesso."
          : "Produto criado com sucesso."
      )
      resetForm()
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "Não foi possível salvar o produto."
      )
    } finally {
      setIsSaving(false)
    }
  }

  const startEdit = (product: Product) => {
    setEditingId(product.id)

    setForm({
      name: product.name,
      category: product.category,
      price: String(product.price).replace(".", ","),
      stock: String(product.stock),
    })

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    })
  }

  const removeProduct = async (product: Product) => {
    const confirmed = window.confirm(
      `Remover o produto "${product.name}"?`
    )

    if (!confirmed) return

    const apiUrl = import.meta.env.VITE_API_URL?.trim().replace(/\/+$/, "")
    if (!apiUrl) {
      setNotice("A API não está configurada. Defina VITE_API_URL.")
      return
    }

    const token = localStorage.getItem("accessToken")
    setIsSaving(true)
    setNotice("")
    try {
      const response = await fetch(
        `${apiUrl}/produtos/${encodeURIComponent(product.id)}`,
        {
          method: "DELETE",
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        }
      )
      if (!response.ok) throw new Error(await getApiError(response))

      await loadProducts()
      if (editingId === product.id) resetForm()
      setNotice(`Produto "${product.name}" removido.`)
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "Não foi possível remover o produto."
      )
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-background px-4 pt-20 pb-28 text-foreground sm:px-8">

      <style>{`
        @keyframes fade-up {
          from {
            opacity: 0;
            transform: translateY(16px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-up {
          animation: fade-up 0.6s ease-out both;
        }
      `}</style>

      <div className="relative z-10 mx-auto max-w-6xl">
        <header
          className="animate-fade-up flex flex-col justify-between gap-5 border-b border-border py-8 sm:flex-row sm:items-end"
          style={{ animationDelay: "0.05s" }}
        >
          <div>
            <p className="text-xs font-medium tracking-[0.24em] text-blue-600 dark:text-blue-300 uppercase">
              Catálogo de produtos
            </p>

            <h1 className="mt-3 text-4xl font-medium tracking-tight text-foreground sm:text-5xl">
              Crie, edite e acompanhe seus produtos.
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-6 text-foreground/50">
              Gerencie o catálogo, ajuste preços e acompanhe os níveis de
              estoque da empresa.
            </p>
          </div>

          <span className="inline-flex items-center gap-2 rounded-sm border border-blue-300/25 bg-blue-400/10 px-4 py-3 text-sm font-normal text-blue-700 dark:text-blue-200">
            <Package size={16} />
            {products.length}{" "}
            {products.length === 1
              ? "produto ativo"
              : "produtos ativos"}
          </span>
        </header>

        <section
          className="animate-fade-up grid grid-cols-1 gap-3 py-6 sm:grid-cols-2 lg:grid-cols-4"
          style={{ animationDelay: "0.1s" }}
        >
          {[
            {
              label: "Produtos cadastrados",
              value: String(products.length),
            },
            {
              label: "Receita das vendas",
              value: "—",
            },
            {
              label: "Unidades vendidas",
              value: "—",
            },
            {
              label: "Valor em estoque",
              value: money(totalStockValue),
            },
          ].map((item) => (
            <div key={item.label} className={`${panel} p-4`}>
              <p className="text-xs font-normal text-foreground/45">
                {item.label}
              </p>

              <strong className="mt-2 block text-2xl font-medium tracking-tight text-foreground">
                {item.value}
              </strong>
            </div>
          ))}
        </section>

        <section
          className={`animate-fade-up ${panel} p-5 sm:p-6`}
          style={{ animationDelay: "0.15s" }}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium tracking-[0.16em] text-blue-600 dark:text-blue-300 uppercase">
                {editingId ? "Editar produto" : "Novo produto"}
              </p>

              <h2 className="mt-2 text-2xl font-medium tracking-tight text-foreground">
                {editingId
                  ? "Atualize as informações"
                  : "Cadastre um produto"}
              </h2>
            </div>

            <span className="flex size-11 shrink-0 items-center justify-center rounded-sm bg-blue-400/15 text-blue-600 dark:text-blue-300">
              {editingId ? (
                <Pencil size={19} />
              ) : (
                <PackagePlus size={20} />
              )}
            </span>
          </div>

          <form
            onSubmit={handleSubmit}
            className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6"
          >
            <input
              value={form.name}
              onChange={(event) =>
                updateForm("name", event.target.value)
              }
              placeholder="Nome do produto"
              className="h-11 rounded-sm border border-border bg-inset px-3 text-sm font-normal outline-none transition placeholder:text-foreground/30 focus:border-blue-400/60 lg:col-span-2"
            />

            <input
              value={form.category}
              onChange={(event) =>
                updateForm("category", event.target.value)
              }
              placeholder="Categoria"
              className="h-11 rounded-sm border border-border bg-inset px-3 text-sm font-normal outline-none transition placeholder:text-foreground/30 focus:border-blue-400/60"
            />

            <input
              value={form.price}
              onChange={(event) =>
                updateForm("price", event.target.value)
              }
              placeholder="Valor em R$"
              inputMode="decimal"
              className="h-11 rounded-sm border border-border bg-inset px-3 text-sm font-normal outline-none transition placeholder:text-foreground/30 focus:border-blue-400/60"
            />

            <input
              value={form.stock}
              onChange={(event) =>
                updateForm("stock", event.target.value)
              }
              placeholder="Estoque"
              inputMode="numeric"
              className="h-11 rounded-sm border border-border bg-inset px-3 text-sm font-normal outline-none transition placeholder:text-foreground/30 focus:border-blue-400/60"
            />

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-sm bg-blue-500 text-sm font-medium text-white transition hover:bg-blue-400"
              >
                <PackagePlus size={16} />
                {isSaving ? "Salvando..." : editingId ? "Salvar" : "Criar"}
              </button>

              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="h-11 rounded-sm border border-foreground/15 px-4 text-sm font-normal text-foreground/70 transition hover:bg-foreground/10"
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>

          {notice && (
            <p className="mt-4 rounded-sm border border-blue-300/20 bg-blue-400/10 px-4 py-3 text-sm font-normal text-blue-700 dark:text-blue-200">
              {notice}
            </p>
          )}
        </section>

        <section
          className={`animate-fade-up ${panel} mt-8 overflow-hidden`}
          style={{ animationDelay: "0.25s" }}
        >
          <div className="border-b border-border p-5">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <p className="text-xs font-medium tracking-[0.16em] text-blue-600 dark:text-blue-300 uppercase">
                  Catálogo
                </p>

                <h2 className="mt-2 text-2xl font-medium tracking-tight text-foreground">
                  Todos os produtos
                </h2>
              </div>

              <label className="flex h-10 w-full items-center gap-2 rounded-sm border border-border bg-inset px-3 text-sm font-normal text-foreground/60 focus-within:border-blue-400/60 sm:w-72">
                <Search size={15} className="shrink-0 text-foreground/35" />

                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar produto ou categoria"
                  className="w-full bg-transparent text-foreground outline-none placeholder:text-foreground/30"
                />
              </label>
            </div>

            <div className="mt-5 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
              <JellyRadio
                items={stockFilters}
                defaultValue="Todos"
                onChange={(value: string) =>
                  setStockFilter(value as StockFilter)
                }
                chipColor="var(--surface-inset)"
                activeColor="#3B82F6"
                textColor="var(--muted-foreground)"
                activeTextColor="#FFFFFF"
                size="md"
                gap={8}
                radius={6}
                swell={0.04}
                barge={2}
                shrink={0.05}
                jelly={1}
                bounce={0.25}
                stagger={22}
                stiffness={580}
              />

              <JellyRadio
                items={[
                  {
                    value: "list",
                    label: "Lista",
                    icon: <List size={14} />,
                  },
                  {
                    value: "grid",
                    label: "Cards",
                    icon: <LayoutGrid size={14} />,
                  },
                ]}
                defaultValue="list"
                onChange={(value: string) =>
                  setViewMode(value as ViewMode)
                }
                chipColor="var(--surface-inset)"
                activeColor="#3B82F6"
                textColor="var(--muted-foreground)"
                activeTextColor="#FFFFFF"
                size="md"
                gap={8}
                radius={6}
                swell={0.04}
                barge={2}
                disabled={false}
              />
            </div>
          </div>

          {viewMode === "list" ? (
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-border text-xs font-normal tracking-[0.12em] text-foreground/40 uppercase">
                    <th className="px-5 py-4 font-normal">Produto</th>
                    <th className="px-5 py-4 font-normal">Categoria</th>
                    <th className="px-5 py-4 font-normal">Valor</th>
                    <th className="px-5 py-4 font-normal">Estoque</th>
                    <th className="px-5 py-4 text-right font-normal">
                      Ações
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredProducts.map((product) => {
                    const stock = stockInfo(product.stock)

                    return (
                      <tr
                        key={product.id}
                        className="border-b border-border text-sm transition last:border-0 hover:bg-foreground/[0.03]"
                      >
                        <td className="px-5 py-4 font-normal text-foreground">
                          {product.name}
                        </td>

                        <td className="px-5 py-4 font-normal text-foreground/60">
                          {product.category}
                        </td>

                        <td className="px-5 py-4 font-normal text-foreground">
                          {money(product.price)}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`rounded-sm border px-2.5 py-1 text-xs font-normal ${stock.className}`}
                          >
                            {stock.label}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => startEdit(product)}
                              className="inline-flex items-center gap-2 rounded-sm border border-blue-300/20 px-3 py-2 text-xs font-normal text-blue-700 dark:text-blue-200 transition hover:bg-blue-400/10"
                            >
                              <Pencil size={14} />
                              Editar
                            </button>

                            <button
                              type="button"
                              onClick={() => removeProduct(product)}
                              className="inline-flex items-center gap-2 rounded-sm border border-red-400/20 px-3 py-2 text-xs font-normal text-red-600 dark:text-red-300 transition hover:bg-red-400/10"
                            >
                              <Trash2 size={14} />
                              Remover
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3">
              {filteredProducts.map((product) => {
                const stock = stockInfo(product.stock)

                return (
                  <article
                    key={product.id}
                    className="rounded-md border border-border bg-inset p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {product.name}
                        </p>

                        <p className="mt-1 text-xs font-normal text-foreground/40">
                          {product.category}
                        </p>
                      </div>

                      <span
                        className={`shrink-0 rounded-sm border px-2.5 py-1 text-xs font-normal ${stock.className}`}
                      >
                        {stock.label}
                      </span>
                    </div>

                    <div className="mt-4 flex items-end justify-between">
                      <strong className="text-xl font-medium tracking-tight text-foreground">
                        {money(product.price)}
                      </strong>

                      <span className="text-xs font-normal text-foreground/40">
                        Estoque: {product.stock} un.
                      </span>
                    </div>

                    <div className="mt-4 flex gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(product)}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-sm border border-blue-300/20 px-3 py-2 text-xs font-normal text-blue-700 dark:text-blue-200 transition hover:bg-blue-400/10"
                      >
                        <Pencil size={14} />
                        Editar
                      </button>

                      <button
                        type="button"
                        onClick={() => removeProduct(product)}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-sm border border-red-400/20 px-3 py-2 text-xs font-normal text-red-600 dark:text-red-300 transition hover:bg-red-400/10"
                      >
                        <Trash2 size={14} />
                        Remover
                      </button>
                    </div>
                  </article>
                )
              })}
            </div>
          )}

          {isLoading && (
            <div className="p-10 text-center text-sm font-normal text-foreground/45">
              Carregando produtos...
            </div>
          )}

          {!isLoading && loadError && (
            <div role="alert" className="p-10 text-center text-sm text-red-600 dark:text-red-300">
              {loadError}
            </div>
          )}

          {!isLoading && !loadError && filteredProducts.length === 0 && (
            <div className="p-10 text-center text-sm font-normal text-foreground/45">
              Nenhum produto encontrado.
            </div>
          )}
        </section>

        <section
          id="relatorio-produtos"
          className="animate-fade-up scroll-mt-28 py-7"
          style={{ animationDelay: "0.2s" }}
        >
          <div className="mb-4">
            <p className="text-xs font-medium tracking-[0.16em] text-blue-600 dark:text-blue-300 uppercase">
              Relatório
            </p>

            <h2 className="mt-2 text-2xl font-medium tracking-tight text-foreground">
              Vendas por produto
            </h2>
          </div>

          <div className={`${panel} p-5 text-sm text-foreground/50`}>
            A API informada ainda não possui uma rota de vendas para gerar este
            relatório.
          </div>
        </section>

        <div className="mt-6 text-xs font-normal text-foreground/35">
          Os produtos são carregados e salvos na API da empresa.
        </div>
      </div>
    </main>
  )
}
