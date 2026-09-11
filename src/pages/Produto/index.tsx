
import { useEffect, useMemo, useState } from "react"
import {
  CircleDollarSign,
  Package,
  PackagePlus,
  Pencil,
  Search,
  Trash2,
} from "lucide-react"
import NavbarPreset from "@/components/navbar_preset"
import { AppDock } from "@/components/Dock"

type Product = {
  id: number
  name: string
  category: string
  price: number
  stock: number
}

type Sale = {
  id: number
  productId: number
  quantity: number
  total: number
  date: string
}

type ProductForm = {
  name: string
  category: string
  price: string
  stock: string
}

const productsKey = "easysell-products"
const salesKey = "easysell-product-sales"

const initialProducts: Product[] = [
  { id: 1, name: "Kit organização", category: "Organização", price: 99.9, stock: 84 },
  { id: 2, name: "Cadeira Office", category: "Mobiliário", price: 899, stock: 41 },
  { id: 3, name: "Luminária LED", category: "Iluminação", price: 59.9, stock: 6 },
  { id: 4, name: "Fone Bluetooth", category: "Eletrônicos", price: 149.9, stock: 0 },
  { id: 5, name: "Garrafa térmica", category: "Acessórios", price: 79.9, stock: 128 },
  { id: 6, name: "Teclado mecânico", category: "Eletrônicos", price: 349, stock: 22 },
]

const initialSales: Sale[] = [
  { id: 1, productId: 1, quantity: 4, total: 399.6, date: "2026-09-01" },
  { id: 2, productId: 1, quantity: 2, total: 199.8, date: "2026-09-04" },
  { id: 3, productId: 2, quantity: 1, total: 899, date: "2026-09-02" },
  { id: 4, productId: 3, quantity: 5, total: 299.5, date: "2026-09-03" },
  { id: 5, productId: 4, quantity: 6, total: 899.4, date: "2026-09-05" },
  { id: 6, productId: 4, quantity: 3, total: 449.7, date: "2026-09-07" },
  { id: 7, productId: 5, quantity: 8, total: 639.2, date: "2026-09-05" },
  { id: 8, productId: 6, quantity: 2, total: 698, date: "2026-09-06" },
]

function loadStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback

  try {
    const saved = window.localStorage.getItem(key)
    return saved ? (JSON.parse(saved) as T) : fallback
  } catch {
    return fallback
  }
}

function money(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  })
}

export default function Produtos() {
  const [products, setProducts] = useState<Product[]>(() =>
    loadStorage(productsKey, initialProducts)
  )
  const [sales, setSales] = useState<Sale[]>(() =>
    loadStorage(salesKey, initialSales)
  )

  const [form, setForm] = useState<ProductForm>({
    name: "",
    category: "",
    price: "",
    stock: "",
  })

  const [editingId, setEditingId] = useState<number | null>(null)
  const [search, setSearch] = useState("")
  const [notice, setNotice] = useState("")

  useEffect(() => {
    window.localStorage.setItem(productsKey, JSON.stringify(products))
  }, [products])

  useEffect(() => {
    window.localStorage.setItem(salesKey, JSON.stringify(sales))
  }, [sales])

  const statsByProduct = useMemo(() => {
    const map = new Map<
      number,
      {
        quantity: number
        revenue: number
        salesCount: number
        lastSale: string | null
      }
    >()

    sales.forEach((sale) => {
      const current = map.get(sale.productId) ?? {
        quantity: 0,
        revenue: 0,
        salesCount: 0,
        lastSale: null,
      }

      map.set(sale.productId, {
        quantity: current.quantity + sale.quantity,
        revenue: current.revenue + sale.total,
        salesCount: current.salesCount + 1,
        lastSale:
          !current.lastSale || sale.date > current.lastSale
            ? sale.date
            : current.lastSale,
      })
    })

    return map
  }, [sales])

  const totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0)
  const totalUnitsSold = sales.reduce((sum, sale) => sum + sale.quantity, 0)
  const totalStockValue = products.reduce(
    (sum, product) => sum + product.price * product.stock,
    0
  )

  const productReports = useMemo(() => {
    return products
      .map((product) => {
        const stats = statsByProduct.get(product.id) ?? {
          quantity: 0,
          revenue: 0,
          salesCount: 0,
          lastSale: null,
        }

        return {
          ...product,
          ...stats,
          lastSaleLabel: stats.lastSale
            ? new Date(`${stats.lastSale}T12:00:00`).toLocaleDateString("pt-BR")
            : "Sem vendas",
        }
      })
      .sort((a, b) => b.revenue - a.revenue)
  }, [products, statsByProduct])

  const maxRevenue = Math.max(...productReports.map((product) => product.revenue), 1)

  const filteredProducts = products.filter((product) =>
    `${product.name} ${product.category}`
      .toLowerCase()
      .includes(search.toLowerCase())
  )

  const updateForm = (field: keyof ProductForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }))
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

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const price = Number(form.price.replace(",", "."))
    const stock = Number.parseInt(form.stock, 10)

    if (!form.name.trim() || !form.category.trim() || price < 0 || stock < 0) {
      setNotice("Preencha todos os campos corretamente.")
      return
    }

    const nextProduct: Product = {
      id: editingId ?? Date.now(),
      name: form.name.trim(),
      category: form.category.trim(),
      price,
      stock,
    }

    setProducts((current) => {
      if (editingId) {
        return current.map((product) =>
          product.id === editingId ? nextProduct : product
        )
      }

      return [nextProduct, ...current]
    })

    setNotice(
      editingId
        ? "Produto atualizado com sucesso."
        : "Produto criado com sucesso."
    )

    resetForm()
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

  const removeProduct = (product: Product) => {
    const confirmed = window.confirm(
      `Remover o produto "${product.name}" e as vendas relacionadas?`
    )

    if (!confirmed) return

    setProducts((current) =>
      current.filter((item) => item.id !== product.id)
    )

    setSales((current) =>
      current.filter((sale) => sale.productId !== product.id)
    )

    if (editingId === product.id) resetForm()

    setNotice(`Produto "${product.name}" removido.`)
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#070B14] px-4 pt-20 pb-28 text-white sm:px-8">
      <NavbarPreset />
      <AppDock />

      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_85%_8%,rgba(37,99,235,0.16),transparent_28%),radial-gradient(circle_at_10%_90%,rgba(14,165,233,0.08),transparent_30%)]" />

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
          className="animate-fade-up flex flex-col justify-between gap-5 border-b border-white/10 py-8 sm:flex-row sm:items-end"
          style={{ animationDelay: "0.05s" }}
        >
          <div>
            <p className="text-xs font-semibold tracking-[0.24em] text-blue-300 uppercase">
              Catálogo de produtos
            </p>
            <h1 className="mt-3 font-heading text-4xl font-bold sm:text-5xl">
              Crie, edite e acompanhe seus produtos.
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-white/50">
              Gerencie o catálogo, altere preços e consulte o desempenho de
              vendas de cada produto.
            </p>
          </div>

          <span className="inline-flex items-center gap-2 rounded-lg border border-blue-300/25 bg-blue-400/10 px-4 py-3 text-sm text-blue-200">
            <Package size={16} />
            {products.length}{" "}
            {products.length === 1 ? "produto ativo" : "produtos ativos"}
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
              value: money(totalRevenue),
            },
            {
              label: "Unidades vendidas",
              value: totalUnitsSold.toLocaleString("pt-BR"),
            },
            {
              label: "Valor em estoque",
              value: money(totalStockValue),
            },
          ].map((item) => (
            <div key={item.label} className="app-panel rounded-xl p-4">
              <p className="text-xs text-white/45">{item.label}</p>
              <strong className="mt-2 block font-heading text-2xl font-semibold">
                {item.value}
              </strong>
            </div>
          ))}
        </section>

        <section
          className="animate-fade-up app-panel rounded-xl p-5 sm:p-6"
          style={{ animationDelay: "0.15s" }}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold tracking-[0.16em] text-blue-300 uppercase">
                {editingId ? "Editar produto" : "Novo produto"}
              </p>
              <h2 className="mt-2 font-heading text-2xl font-bold">
                {editingId ? "Atualize as informações" : "Cadastre um produto"}
              </h2>
            </div>

            <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-blue-400/15 text-blue-300">
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
              onChange={(event) => updateForm("name", event.target.value)}
              placeholder="Nome do produto"
              className="h-11 rounded-lg border border-white/15 bg-white/[0.05] px-3 text-sm outline-none transition placeholder:text-white/30 focus:border-blue-400/60 lg:col-span-2"
            />

            <input
              value={form.category}
              onChange={(event) => updateForm("category", event.target.value)}
              placeholder="Categoria"
              className="h-11 rounded-lg border border-white/15 bg-white/[0.05] px-3 text-sm outline-none transition placeholder:text-white/30 focus:border-blue-400/60"
            />

            <input
              value={form.price}
              onChange={(event) => updateForm("price", event.target.value)}
              placeholder="Valor em R$"
              inputMode="decimal"
              className="h-11 rounded-lg border border-white/15 bg-white/[0.05] px-3 text-sm outline-none transition placeholder:text-white/30 focus:border-blue-400/60"
            />

            <input
              value={form.stock}
              onChange={(event) => updateForm("stock", event.target.value)}
              placeholder="Estoque"
              inputMode="numeric"
              className="h-11 rounded-lg border border-white/15 bg-white/[0.05] px-3 text-sm outline-none transition placeholder:text-white/30 focus:border-blue-400/60"
            />

            <div className="flex gap-2">
              <button
                type="submit"
                className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-blue-500 text-sm font-semibold text-white transition hover:bg-blue-400"
              >
                <PackagePlus size={16} />
                {editingId ? "Salvar" : "Criar"}
              </button>

              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="h-11 rounded-lg border border-white/15 px-4 text-sm text-white/70 transition hover:bg-white/10"
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>

          {notice && (
            <p className="mt-4 rounded-lg border border-blue-300/20 bg-blue-400/10 px-4 py-3 text-sm text-blue-200">
              {notice}
            </p>
          )}
        </section>

        <section
          id="relatorio-produtos"
          className="animate-fade-up scroll-mt-28 py-7"
          style={{ animationDelay: "0.2s" }}
        >
          <div className="mb-4">
            <p className="text-xs font-semibold tracking-[0.16em] text-blue-300 uppercase">
              Relatório
            </p>
            <h2 className="mt-2 font-heading text-2xl font-bold">
              Vendas por produto
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {productReports.map((product, index) => {
              const width = Math.max(
                5,
                Math.round((product.revenue / maxRevenue) * 100)
              )

              return (
                <article
                  key={product.id}
                  className="app-panel animate-fade-up rounded-xl p-5"
                  style={{ animationDelay: `${0.22 + index * 0.03}s` }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {product.name}
                      </p>
                      <p className="mt-1 text-xs text-white/40">
                        {product.category}
                      </p>
                    </div>

                    <span className="rounded-lg border border-blue-300/20 bg-blue-400/10 px-3 py-1.5 text-xs text-blue-200">
                      {money(product.price)}
                    </span>
                  </div>

                  <div className="mt-5 grid grid-cols-3 gap-3 text-center">
                    <div>
                      <p className="text-xs text-white/40">Vendidos</p>
                      <strong className="mt-1 block text-lg">
                        {product.quantity}
                      </strong>
                    </div>

                    <div>
                      <p className="text-xs text-white/40">Pedidos</p>
                      <strong className="mt-1 block text-lg">
                        {product.salesCount}
                      </strong>
                    </div>

                    <div>
                      <p className="text-xs text-white/40">Receita</p>
                      <strong className="mt-1 block text-lg text-[#5DCAA5]">
                        {money(product.revenue)}
                      </strong>
                    </div>
                  </div>

                  <div className="mt-5">
                    <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-blue-400"
                        style={{ width: `${width}%` }}
                      />
                    </div>

                    <div className="mt-3 flex items-center justify-between text-xs text-white/40">
                      <span>Última venda: {product.lastSaleLabel}</span>
                      <span>{width}% do melhor resultado</span>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        </section>

        <section
          className="animate-fade-up app-panel overflow-hidden rounded-xl"
          style={{ animationDelay: "0.25s" }}
        >
          <div className="border-b border-white/10 p-5">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <p className="text-xs font-semibold tracking-[0.16em] text-blue-300 uppercase">
                  Catálogo
                </p>
                <h2 className="mt-2 font-heading text-2xl font-bold">
                  Todos os produtos
                </h2>
              </div>

              <label className="flex h-10 w-full items-center gap-2 rounded-lg border border-white/15 bg-white/[0.05] px-3 text-sm text-white/60 focus-within:border-blue-400/60 sm:w-72">
                <Search size={15} className="shrink-0 text-white/35" />

                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar produto ou categoria"
                  className="w-full bg-transparent text-white outline-none placeholder:text-white/30"
                />
              </label>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-white/10 text-xs tracking-[0.12em] text-white/40 uppercase">
                  <th className="px-5 py-4 font-medium">Produto</th>
                  <th className="px-5 py-4 font-medium">Categoria</th>
                  <th className="px-5 py-4 font-medium">Valor</th>
                  <th className="px-5 py-4 font-medium">Estoque</th>
                  <th className="px-5 py-4 font-medium">Vendidos</th>
                  <th className="px-5 py-4 font-medium">Receita</th>
                  <th className="px-5 py-4 text-right font-medium">Ações</th>
                </tr>
              </thead>

              <tbody>
                {filteredProducts.map((product) => {
                  const stats = statsByProduct.get(product.id) ?? {
                    quantity: 0,
                    revenue: 0,
                    salesCount: 0,
                    lastSale: null,
                  }

                  return (
                    <tr
                      key={product.id}
                      className="border-b border-white/5 text-sm transition last:border-0 hover:bg-white/[0.03]"
                    >
                      <td className="px-5 py-4 font-medium text-white">
                        {product.name}
                      </td>

                      <td className="px-5 py-4 text-white/60">
                        {product.category}
                      </td>

                      <td className="px-5 py-4 text-white">
                        {money(product.price)}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`rounded-lg border px-2.5 py-1 text-xs ${
                            product.stock === 0
                              ? "border-red-400/25 bg-red-400/10 text-red-300"
                              : product.stock <= 10
                                ? "border-amber-400/25 bg-amber-400/10 text-amber-300"
                                : "border-[#5DCAA5]/25 bg-[#5DCAA5]/10 text-[#5DCAA5]"
                          }`}
                        >
                          {product.stock === 0
                            ? "Sem estoque"
                            : `${product.stock} un.`}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-white/60">
                        {stats.quantity}
                      </td>

                      <td className="px-5 py-4 text-[#5DCAA5]">
                        {money(stats.revenue)}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => startEdit(product)}
                            className="inline-flex items-center gap-2 rounded-lg border border-blue-300/20 px-3 py-2 text-xs text-blue-200 transition hover:bg-blue-400/10"
                          >
                            <Pencil size={14} />
                            Editar
                          </button>

                          <button
                            type="button"
                            onClick={() => removeProduct(product)}
                            className="inline-flex items-center gap-2 rounded-lg border border-red-400/20 px-3 py-2 text-xs text-red-300 transition hover:bg-red-400/10"
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

            {filteredProducts.length === 0 && (
              <div className="p-10 text-center text-sm text-white/45">
                Nenhum produto encontrado.
              </div>
            )}
          </div>
        </section>

        <div className="mt-6 flex items-center gap-2 text-xs text-white/35">
          <CircleDollarSign size={14} />
          Os valores usam o formato brasileiro e ficam salvos neste navegador.
        </div>
      </div>
    </main>
  )
}