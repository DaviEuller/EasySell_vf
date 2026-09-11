import { useState } from "react"
import {
  ArrowUpRight,
  CircleAlert,
  Package,
  PackagePlus,
  Search,
  TriangleAlert,
} from "lucide-react"
import NavbarPreset from "@/components/navbar_preset"
import { AppDock } from "@/components/Dock"

type Product = {
  id: number
  name: string
  category: string
  price: number
  stock: number
  min: number
}

const initialProducts: Product[] = [
  { id: 1, name: "Kit organização", category: "Organização", price: 99.9, stock: 84, min: 20 },
  { id: 2, name: "Cadeira Office", category: "Mobiliário", price: 899.0, stock: 41, min: 15 },
  { id: 3, name: "Mesa compacta", category: "Mobiliário", price: 459.0, stock: 32, min: 10 },
  { id: 4, name: "Luminária LED", category: "Iluminação", price: 59.9, stock: 6, min: 15 },
  { id: 5, name: "Suporte notebook", category: "Acessórios", price: 89.9, stock: 0, min: 10 },
  { id: 6, name: "Mousepad XL", category: "Acessórios", price: 39.9, stock: 3, min: 12 },
  { id: 7, name: "Garrafa térmica", category: "Acessórios", price: 79.9, stock: 128, min: 25 },
  { id: 8, name: "Fone Bluetooth", category: "Eletrônicos", price: 149.9, stock: 0, min: 8 },
  { id: 9, name: "Teclado mecânico", category: "Eletrônicos", price: 349.0, stock: 22, min: 8 },
  { id: 10, name: "Webcam Full HD", category: "Eletrônicos", price: 229.0, stock: 14, min: 10 },
]

function money(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

function statusOf(product: Product) {
  if (product.stock === 0)
    return { label: "Sem estoque", badge: "bg-red-400/15 text-red-300 border-red-400/25", bar: "bg-red-400", level: 0 }
  if (product.stock <= product.min)
    return { label: "Estoque baixo", badge: "bg-amber-400/15 text-amber-300 border-amber-400/25", bar: "bg-amber-400", level: product.stock / product.min }
  return { label: "Em dia", badge: "bg-[#5DCAA5]/15 text-[#5DCAA5] border-[#5DCAA5]/25", bar: "bg-[#5DCAA5]", level: 1 }
}

export function Estoque() {
  const [products] = useState(initialProducts)
  const [search, setSearch] = useState("")
  const [notice, setNotice] = useState("")

  const lowStock = products.filter((p) => p.stock > 0 && p.stock <= p.min)
  const outOfStock = products.filter((p) => p.stock === 0)
  const restockList = [...lowStock, ...outOfStock]
  const totalUnits = products.reduce((sum, p) => sum + p.stock, 0)
  const stockValue = products.reduce((sum, p) => sum + p.stock * p.price, 0)

  const filtered = products.filter((p) =>
    `${p.name} ${p.category}`.toLowerCase().includes(search.toLowerCase())
  )

  // efeito spotlight estilo ReactBits
  const handleSpotlight = (event: React.MouseEvent<HTMLElement>) => {
    const el = event.currentTarget
    const rect = el.getBoundingClientRect()
    el.style.setProperty("--mouse-x", `${event.clientX - rect.left}px`)
    el.style.setProperty("--mouse-y", `${event.clientY - rect.top}px`)
  }

  const requestRestock = (product: Product) => {
    setNotice(
      `Pedido de reposição criado para ${product.name} (${product.min * 2 - product.stock} unidades sugeridas).`
    )
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#070B14] px-4 pt-20 pb-16 text-white sm:px-8">
      <NavbarPreset />
      <AppDock />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_85%_8%,rgba(37,99,235,0.16),transparent_28%),radial-gradient(circle_at_10%_90%,rgba(14,165,233,0.08),transparent_30%)]" />

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
        .spotlight-card::before {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: inherit;
          background: radial-gradient(
            420px circle at var(--mouse-x, 50%) var(--mouse-y, 50%),
            rgba(96,165,250,0.10),
            transparent 65%
          );
          opacity: 0;
          transition: opacity 0.45s ease;
          pointer-events: none;
          z-index: 0;
        }
        .spotlight-card:hover::before { opacity: 1; }
      `}</style>

      <div className="relative z-10 mx-auto max-w-6xl">
        {/* Header */}
        <header
          className="animate-fade-up flex flex-col justify-between gap-5 border-b border-white/10 py-8 sm:flex-row sm:items-end"
          style={{ animationDelay: "0.05s" }}
        >
          <div>
            <p className="text-xs font-semibold tracking-[0.24em] text-blue-300 uppercase">
              Controle de estoque
            </p>
            <h1 className="mt-3 font-heading text-4xl font-bold sm:text-5xl">
              Seus produtos, no radar.
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-white/50">
              Acompanhe quantidades, preços e saiba exatamente o que repor.
            </p>
          </div>
         
        </header>

        {/* KPIs */}
        <section className="grid grid-cols-1 gap-3 py-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Total de itens", value: totalUnits.toLocaleString("pt-BR"), positive: true },
            { label: "Valor em estoque", value: money(stockValue), positive: true },
            { label: "Estoque baixo", value: String(lowStock.length), positive: false },
            { label: "Sem estoque", value: String(outOfStock.length), positive: false },
          ].map((kpi, index) => (
            <div
              key={kpi.label}
              onMouseMove={handleSpotlight}
              className="spotlight-card animate-fade-up app-panel relative overflow-hidden rounded-xl p-4 transition-all duration-300 hover:-translate-y-1 hover:border-blue-400/40"
              style={{ animationDelay: `${0.1 + index * 0.06}s` }}
            >
              <div className="relative z-10">
                <p className="text-xs text-white/45">{kpi.label}</p>
                <strong
                  className={`mt-2 block font-heading text-2xl font-semibold ${kpi.positive ? "text-white" : "text-amber-300"}`}
                >
                  {kpi.value}
                </strong>
              </div>
            </div>
          ))}
        </section>

        {/* Alertas */}
        {restockList.length > 0 && (
          <section
            className="animate-fade-up mb-3 grid gap-3 sm:grid-cols-2"
            style={{ animationDelay: "0.2s" }}
          >
            <div className="app-panel rounded-xl border-amber-400/15 p-4 sm:p-5">
              <div className="flex items-center gap-2">
                <TriangleAlert className="text-amber-300" size={18} />
                <p className="text-xs font-semibold tracking-[0.16em] text-amber-300 uppercase">
                  Estoque baixo
                </p>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {lowStock.map((p) => (
                  <span
                    key={p.id}
                    className="rounded-lg border border-amber-400/20 bg-amber-400/10 px-3 py-1.5 text-xs text-amber-200"
                  >
                    {p.name} · restam {p.stock}
                  </span>
                ))}
              </div>
            </div>
            <div className="app-panel rounded-xl border-red-400/15 p-4 sm:p-5">
              <div className="flex items-center gap-2">
                <CircleAlert className="text-red-300" size={18} />
                <p className="text-xs font-semibold tracking-[0.16em] text-red-300 uppercase">
                  Sem estoque
                </p>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {outOfStock.map((p) => (
                  <span
                    key={p.id}
                    className="rounded-lg border border-red-400/20 bg-red-400/10 px-3 py-1.5 text-xs text-red-200"
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
          onMouseMove={handleSpotlight}
          className="spotlight-card animate-fade-up app-panel relative overflow-hidden rounded-xl p-5 sm:p-6"
          style={{ animationDelay: "0.25s" }}
        >
          <div className="relative z-10">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <p className="text-xs font-semibold tracking-[0.16em] text-blue-300 uppercase">
                  Inventário
                </p>
                <h2 className="mt-2 font-heading text-2xl font-bold">
                  Todos os produtos
                </h2>
              </div>
              <label className="flex h-10 w-full items-center gap-2 rounded-lg border border-white/15 bg-white/[0.05] px-3 text-sm text-white/60 focus-within:border-blue-400/60 sm:w-64">
                <Search size={15} className="shrink-0 text-white/35" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar produto..."
                  className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/30"
                />
              </label>
            </div>

            <div className="mt-6 overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-left text-xs tracking-wide text-white/35 uppercase">
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
                        className="border-b border-white/5 transition last:border-0 hover:bg-white/[0.03]"
                      >
                        <td className="py-3.5 pr-4">
                          <p className="font-medium text-white">{product.name}</p>
                          <p className="text-xs text-white/35">{product.category}</p>
                        </td>
                        <td className="py-3.5 pr-4 font-medium">{money(product.price)}</td>
                        <td className="py-3.5 pr-4 text-white/70">
                          {product.stock} un.
                        </td>
                        <td className="py-3.5 pr-4">
                          <div className="h-1.5 w-24 overflow-hidden rounded-full bg-white/10">
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
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-sm text-white/35">
                        Nenhum produto encontrado para "{search}".
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
          onMouseMove={handleSpotlight}
          className="spotlight-card animate-fade-up app-panel relative mt-3 overflow-hidden rounded-xl p-5 sm:p-6"
          style={{ animationDelay: "0.3s" }}
        >
          <div className="relative z-10">
            <div className="flex items-center gap-3">
              <PackagePlus className="text-blue-300" size={22} />
              <div>
                <p className="text-xs font-semibold tracking-[0.16em] text-blue-300 uppercase">
                  Reposição
                </p>
                <h2 className="mt-1 font-heading text-2xl font-bold">
                  Produtos para repor
                </h2>
              </div>
            </div>

            {restockList.length > 0 ? (
              <div className="mt-6 overflow-x-auto">
                <table className="w-full min-w-[560px] text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-left text-xs tracking-wide text-white/35 uppercase">
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
                        className="border-b border-white/5 last:border-0 hover:bg-white/[0.03]"
                      >
                        <td className="py-3.5 pr-4">
                          <span className="flex items-center gap-2 font-medium text-white">
                            <Package size={15} className="text-white/35" />
                            {product.name}
                          </span>
                        </td>
                        <td
                          className={`py-3.5 pr-4 font-semibold ${product.stock === 0 ? "text-red-300" : "text-amber-300"}`}
                        >
                          {product.stock} un.
                        </td>
                        <td className="py-3.5 pr-4 text-white/50">{product.min} un.</td>
                        <td className="py-3.5 pr-4 text-[#5DCAA5]">
                          {product.min * 2 - product.stock} un.
                        </td>
                        <td className="py-3.5 text-right">
                          <button
                            onClick={() => requestRestock(product)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold transition hover:bg-blue-500"
                          >
                            Criar pedido <ArrowUpRight size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="mt-6 rounded-lg border border-[#5DCAA5]/20 bg-[#5DCAA5]/5 p-4 text-sm text-[#5DCAA5]">
                Tudo em dia — nenhum produto precisa de reposição no momento.
              </p>
            )}

            {notice && (
              <p className="mt-4 rounded-lg border border-blue-400/15 bg-blue-400/5 px-4 py-3 text-sm text-blue-200">
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