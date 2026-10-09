import { ArrowUpRight } from "lucide-react"

export type DashboardStats = {
  products: number
  inventoryUnits: number
  inventoryValue: number
  lowStock: number
  outOfStock: number
  customers: number
  employees: number
  pendingTasks: number
  completedTasks: number
}

interface DashboardCardsProps {
  darkMode: boolean
  stats: DashboardStats
  isLoading: boolean
}

function formatNumber(value: number) {
  return value.toLocaleString("pt-BR")
}

function formatMoney(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  })
}

function MetricCard({
  title,
  value,
  description,
  href,
  darkMode,
  isLoading,
}: {
  title: string
  value: string
  description: string
  href: string
  darkMode: boolean
  isLoading: boolean
}) {
  return (
    <article
      className={`flex min-h-40 flex-col justify-between rounded-md border p-5 transition-colors ${
        darkMode
          ? "border-border bg-card hover:border-foreground/20"
          : "border-border bg-card hover:border-foreground/20"
      }`}
    >
      <div>
        <p className="text-xs font-medium tracking-[0.12em] text-foreground/45 uppercase">
          {title}
        </p>
        <strong className="mt-3 block font-heading text-3xl font-semibold tracking-tight">
          {isLoading ? "—" : value}
        </strong>
        <p className="mt-2 text-sm text-foreground/50">
          {isLoading ? "Carregando dados..." : description}
        </p>
      </div>
      <a
        href={href}
        className="mt-5 inline-flex items-center gap-2 text-xs font-semibold text-blue-600 hover:text-blue-500 dark:text-blue-300"
      >
        Abrir módulo
        <ArrowUpRight size={14} />
      </a>
    </article>
  )
}

export default function DashboardCards({
  darkMode,
  stats,
  isLoading,
}: DashboardCardsProps) {
  const stockRows = [
    {
      label: "Disponíveis",
      value: Math.max(stats.inventoryUnits, 0),
      color: "#5DCAA5",
    },
    { label: "Estoque baixo", value: stats.lowStock, color: "#F59E0B" },
    { label: "Sem estoque", value: stats.outOfStock, color: "#F87171" },
  ]
  const maxStockValue = Math.max(...stockRows.map((row) => row.value), 1)

  return (
    <div className="grid grid-cols-1 gap-3 pb-12 sm:grid-cols-2 lg:grid-cols-3">
      <MetricCard
        title="Produtos cadastrados"
        value={formatNumber(stats.products)}
        description={`${formatNumber(stats.inventoryUnits)} unidades em estoque`}
        href="/produtos"
        darkMode={darkMode}
        isLoading={isLoading}
      />
      <MetricCard
        title="Valor do estoque"
        value={formatMoney(stats.inventoryValue)}
        description="Calculado pelo preço e quantidade cadastrados"
        href="/estoque"
        darkMode={darkMode}
        isLoading={isLoading}
      />
      <MetricCard
        title="Clientes cadastrados"
        value={formatNumber(stats.customers)}
        description="Total registrado para esta empresa"
        href="/clientes"
        darkMode={darkMode}
        isLoading={isLoading}
      />
      <MetricCard
        title="Equipe"
        value={formatNumber(stats.employees)}
        description="Membros cadastrados"
        href="/equipe"
        darkMode={darkMode}
        isLoading={isLoading}
      />

      <section className="rounded-md border border-border bg-card p-5 sm:col-span-2">
        <h2 className="text-xs font-medium tracking-[0.12em] text-foreground/45 uppercase">
          Situação do estoque
        </h2>
        <p className="mt-3 font-heading text-3xl font-semibold tracking-tight">
          {isLoading ? "—" : formatNumber(stats.inventoryUnits)}
          <span className="ml-2 text-sm font-normal text-foreground/50">
            unidades cadastradas
          </span>
        </p>
        <div className="mt-6 space-y-4">
          {stockRows.map((row) => (
            <div key={row.label}>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-foreground/60">{row.label}</span>
                <strong>{isLoading ? "—" : formatNumber(row.value)}</strong>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-foreground/10">
                <div
                  className="h-full rounded-full transition-[width]"
                  style={{
                    width: isLoading
                      ? "0%"
                      : `${Math.min((row.value / maxStockValue) * 100, 100)}%`,
                    backgroundColor: row.color,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
        <a
          href="/produtos"
          className="mt-6 inline-flex items-center gap-2 text-xs font-semibold text-blue-600 hover:text-blue-500 dark:text-blue-300"
        >
          Revisar produtos
          <ArrowUpRight size={14} />
        </a>
      </section>

      <section className="rounded-md border border-border bg-card p-5">
        <h2 className="text-xs font-medium tracking-[0.12em] text-foreground/45 uppercase">
          Tarefas da equipe
        </h2>
        <p className="mt-3 font-heading text-3xl font-semibold tracking-tight">
          {isLoading ? "—" : formatNumber(stats.pendingTasks)}
          <span className="ml-2 text-sm font-normal text-foreground/50">
            aguardando conclusão
          </span>
        </p>
        <div className="mt-5 flex items-center justify-between border-t border-border pt-4 text-sm">
          <span className="text-foreground/55">Concluídas</span>
          <strong className="text-emerald-600 dark:text-[#5DCAA5]">
            {isLoading ? "—" : formatNumber(stats.completedTasks)}
          </strong>
        </div>
        <a
          href="/equipe"
          className="mt-6 inline-flex items-center gap-2 text-xs font-semibold text-blue-600 hover:text-blue-500 dark:text-blue-300"
        >
          Ver equipe
          <ArrowUpRight size={14} />
        </a>
      </section>
    </div>
  )
}
