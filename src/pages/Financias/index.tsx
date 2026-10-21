import { useCallback, useEffect, useMemo, useState } from "react"
import type { FormEvent } from "react"
import {
  AlertCircle,
  Check,
  CircleDollarSign,
  FilePlus2,
  LoaderCircle,
  Receipt,
  RotateCcw,
} from "lucide-react"

type InvoiceStatus = "pendente" | "paga"
type Invoice = {
  id: string
  saleId: string
  customerName: string
  customerPhone: string
  description: string
  amount: number
  dueDate: string
  status: InvoiceStatus
  paidAt: string | null
}
type AvailableSale = {
  id: string
  customerName: string
  customerPhone: string
  productId: string
  amount: number
  quantity: number
}
type ApiRecord = Record<string, unknown>

const panelClass = "rounded-xl border border-border bg-card p-5 shadow-sm"

function isRecord(value: unknown): value is ApiRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function apiBaseUrl() {
  const value = import.meta.env.VITE_API_URL?.trim().replace(/\/+$/, "")
  if (!value) throw new Error("A API não está configurada. Defina VITE_API_URL.")
  return value
}

async function apiRequest(path: string, init?: RequestInit): Promise<unknown> {
  const token = localStorage.getItem("accessToken")
  if (!token) throw new Error("Sua sessão expirou. Entre novamente.")

  const response = await fetch(`${apiBaseUrl()}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  })
  const text = await response.text()
  let body: unknown = null
  if (text) {
    try {
      body = JSON.parse(text) as unknown
    } catch {
      if (response.ok) throw new Error("A API retornou uma resposta inválida.")
    }
  }
  if (!response.ok) {
    if (isRecord(body) && typeof body.message === "string") {
      throw new Error(body.message)
    }
    throw new Error(`Não foi possível acessar as faturas (erro ${response.status}).`)
  }
  return body
}

function unwrapArray(value: unknown): unknown[] {
  const payload = isRecord(value) && "data" in value ? value.data : value
  if (Array.isArray(payload)) return payload
  throw new Error("A API retornou uma lista inválida.")
}

function parseInvoice(value: unknown): Invoice | null {
  if (!isRecord(value)) return null
  const id = value.id ?? value._id
  const saleId =
    typeof value.saleId === "string"
      ? value.saleId
      : isRecord(value.saleId)
        ? String(value.saleId._id ?? value.saleId.id ?? "")
        : ""
  if (
    typeof id !== "string" ||
    !saleId ||
    typeof value.customerName !== "string" ||
    typeof value.customerPhone !== "string" ||
    typeof value.description !== "string" ||
    typeof value.amount !== "number" ||
    typeof value.dueDate !== "string" ||
    (value.status !== "paga" && value.status !== "pendente")
  ) {
    return null
  }
  return {
    id,
    saleId,
    customerName: value.customerName,
    customerPhone: value.customerPhone,
    description: value.description,
    amount: value.amount,
    dueDate: value.dueDate,
    status: value.status,
    paidAt: typeof value.paidAt === "string" ? value.paidAt : null,
  }
}

function parseSale(value: unknown): AvailableSale | null {
  if (!isRecord(value)) return null
  const id = value.id ?? value._id
  if (
    typeof id !== "string" ||
    typeof value.customerName !== "string" ||
    typeof value.customerPhone !== "string" ||
    typeof value.productId !== "string" ||
    typeof value.amount !== "number" ||
    typeof value.quantity !== "number"
  ) {
    return null
  }
  return {
    id,
    customerName: value.customerName,
    customerPhone: value.customerPhone,
    productId: value.productId,
    amount: value.amount,
    quantity: value.quantity,
  }
}

function money(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

function formatDate(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? "Data inválida"
    : date.toLocaleDateString("pt-BR", { timeZone: "UTC" })
}

function todayPlusDays(days: number) {
  const date = new Date()
  date.setDate(date.getDate() + days)
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
  return localDate.toISOString().slice(0, 10)
}

function invoiceIsOverdue(invoice: Invoice) {
  if (invoice.status === "paga") return false
  const due = new Date(invoice.dueDate)
  const today = new Date()
  due.setUTCHours(0, 0, 0, 0)
  today.setHours(0, 0, 0, 0)
  return due.getTime() < Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())
}

async function fetchInvoices(): Promise<Invoice[]> {
  const response = await apiRequest("/faturas")
  return unwrapArray(response).map((item) => {
    const invoice = parseInvoice(item)
    if (!invoice) throw new Error("A API retornou uma fatura em formato inválido.")
    return invoice
  })
}

export function Financias() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [availableSales, setAvailableSales] = useState<AvailableSale[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingSales, setIsLoadingSales] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [updatingInvoiceId, setUpdatingInvoiceId] = useState<string | null>(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [selectedSaleId, setSelectedSaleId] = useState("")
  const [dueDate, setDueDate] = useState(() => todayPlusDays(7))
  const [filter, setFilter] = useState<"todas" | "pendente" | "paga" | "atrasada">("todas")
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")

  const loadInvoices = useCallback(async () => {
    setError("")
    setIsLoading(true)
    try {
      setInvoices(await fetchInvoices())
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Não foi possível carregar as faturas."
      )
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true
    fetchInvoices()
      .then((result) => {
        if (active) setInvoices(result)
      })
      .catch((loadError: unknown) => {
        if (active) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Não foi possível carregar as faturas."
          )
        }
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const openCreateForm = async () => {
    setIsCreateOpen(true)
    setNotice("")
    setError("")
    setIsLoadingSales(true)
    try {
      const response = await apiRequest("/faturas/vendas-disponiveis")
      const parsed = unwrapArray(response).map((item) => {
        const sale = parseSale(item)
        if (!sale) throw new Error("A API retornou uma venda em formato inválido.")
        return sale
      })
      setAvailableSales(parsed)
      setSelectedSaleId(parsed[0]?.id ?? "")
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Não foi possível carregar as vendas."
      )
    } finally {
      setIsLoadingSales(false)
    }
  }

  const createInvoice = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedSaleId || !dueDate) {
      setError("Selecione uma venda e informe o vencimento.")
      return
    }
    setIsCreating(true)
    setError("")
    try {
      await apiRequest("/faturas", {
        method: "POST",
        body: JSON.stringify({ saleId: selectedSaleId, dueDate }),
      })
      setIsCreateOpen(false)
      setNotice("Fatura criada com sucesso.")
      await loadInvoices()
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : "Não foi possível criar a fatura."
      )
    } finally {
      setIsCreating(false)
    }
  }

  const changeStatus = async (invoice: Invoice) => {
    const status = invoice.status === "paga" ? "pendente" : "paga"
    setUpdatingInvoiceId(invoice.id)
    setError("")
    setNotice("")
    try {
      const result = await apiRequest(`/faturas/${encodeURIComponent(invoice.id)}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      })
      const updatedInvoice = parseInvoice(result)
      if (!updatedInvoice) {
        throw new Error("A API retornou uma fatura atualizada inválida.")
      }
      setInvoices((current) =>
        current.map((item) => (item.id === updatedInvoice.id ? updatedInvoice : item))
      )
      setNotice(status === "paga" ? "Fatura marcada como paga." : "Fatura reaberta.")
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : "Não foi possível atualizar a fatura."
      )
    } finally {
      setUpdatingInvoiceId(null)
    }
  }

  const summary = useMemo(() => {
    const outstanding = invoices.filter((invoice) => invoice.status === "pendente")
    return {
      total: invoices.length,
      pendingAmount: outstanding.reduce((sum, invoice) => sum + invoice.amount, 0),
      overdue: outstanding.filter(invoiceIsOverdue).length,
      paidAmount: invoices
        .filter((invoice) => invoice.status === "paga")
        .reduce((sum, invoice) => sum + invoice.amount, 0),
    }
  }, [invoices])

  const visibleInvoices = invoices.filter((invoice) => {
    if (filter === "pendente") return invoice.status === "pendente" && !invoiceIsOverdue(invoice)
    if (filter === "paga") return invoice.status === "paga"
    if (filter === "atrasada") return invoiceIsOverdue(invoice)
    return true
  })

  const selectedSale = availableSales.find((sale) => sale.id === selectedSaleId)

  return (
    <main className="min-h-screen bg-background px-4 pt-24 pb-16 text-foreground sm:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-col justify-between gap-5 border-b border-border py-8 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold tracking-[0.24em] text-blue-600 uppercase dark:text-blue-300">
              Controle financeiro
            </p>
            <h1 className="mt-3 font-heading text-4xl font-bold sm:text-5xl">
              Faturas
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
              Crie cobranças a partir das vendas e acompanhe vencimentos e pagamentos.
            </p>
          </div>
          <button
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-60"
            onClick={() => void openCreateForm()}
            type="button"
          >
            <FilePlus2 size={17} />
            Nova fatura
          </button>
        </header>

        {error ? (
          <div className="mt-5 flex items-start gap-2 rounded-lg border border-destructive/25 bg-destructive/5 p-3 text-sm text-destructive" role="alert">
            <AlertCircle className="mt-0.5 shrink-0" size={17} />
            <span className="flex-1">{error}</span>
            <button
              className="font-medium underline underline-offset-2"
              onClick={() => void loadInvoices()}
              type="button"
            >
              Tentar novamente
            </button>
          </div>
        ) : null}
        {notice ? (
          <p className="mt-4 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 text-sm text-emerald-700 dark:text-emerald-300" role="status">
            {notice}
          </p>
        ) : null}

        {isCreateOpen ? (
          <form className={`${panelClass} mt-5`} onSubmit={(event) => void createInvoice(event)}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-heading text-xl font-semibold">Criar fatura de venda</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Cliente e valor são obtidos da venda selecionada.
                </p>
              </div>
              <button
                className="text-sm text-muted-foreground underline underline-offset-2"
                onClick={() => setIsCreateOpen(false)}
                type="button"
              >
                Cancelar
              </button>
            </div>
            {isLoadingSales ? (
              <p className="mt-5 flex items-center gap-2 text-sm text-muted-foreground">
                <LoaderCircle className="animate-spin" size={16} /> Carregando vendas...
              </p>
            ) : availableSales.length === 0 ? (
              <p className="mt-5 rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground">
                Não há vendas sem fatura para esta empresa.
              </p>
            ) : (
              <>
                <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_220px]">
                  <label className="text-sm font-medium">
                    Venda e cliente
                    <select
                      className="mt-2 h-11 w-full rounded-lg border border-border bg-background px-3 text-sm"
                      onChange={(event) => setSelectedSaleId(event.target.value)}
                      required
                      value={selectedSaleId}
                    >
                      {availableSales.map((sale) => (
                        <option key={sale.id} value={sale.id}>
                          {sale.customerName} · {sale.quantity} un. · {money(sale.amount)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="text-sm font-medium">
                    Vencimento
                    <input
                      className="mt-2 h-11 w-full rounded-lg border border-border bg-background px-3 text-sm"
                      min={todayPlusDays(0)}
                      onChange={(event) => setDueDate(event.target.value)}
                      required
                      type="date"
                      value={dueDate}
                    />
                  </label>
                </div>
                {selectedSale ? (
                  <p className="mt-3 text-sm text-muted-foreground">
                    {selectedSale.customerPhone || "Telefone não informado"} · Total da cobrança:{" "}
                    <strong className="text-foreground">{money(selectedSale.amount)}</strong>
                  </p>
                ) : null}
                <button
                  className="mt-5 inline-flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-60"
                  disabled={isCreating || !selectedSaleId}
                  type="submit"
                >
                  {isCreating ? (
                    <LoaderCircle className="animate-spin" size={16} />
                  ) : (
                    <Receipt size={16} />
                  )}
                  {isCreating ? "Criando..." : "Criar fatura"}
                </button>
              </>
            )}
          </form>
        ) : null}

        <section className="grid gap-3 py-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Faturas", value: String(summary.total), icon: Receipt },
            { label: "Em aberto", value: money(summary.pendingAmount), icon: CircleDollarSign },
            { label: "Atrasadas", value: String(summary.overdue), icon: AlertCircle },
            { label: "Recebido", value: money(summary.paidAmount), icon: Check },
          ].map(({ label, value, icon: Icon }) => (
            <div className={panelClass} key={label}>
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-sm">{label}</span>
                <Icon size={17} />
              </div>
              <strong className="mt-3 block font-heading text-2xl font-semibold">{value}</strong>
            </div>
          ))}
        </section>

        <section className={panelClass}>
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h2 className="font-heading text-xl font-semibold">Cobranças</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Faturas vinculadas às vendas da sua empresa.
              </p>
            </div>
            <div className="flex flex-wrap gap-2" aria-label="Filtrar faturas">
              {([
                ["todas", "Todas"],
                ["pendente", "Em aberto"],
                ["atrasada", "Atrasadas"],
                ["paga", "Pagas"],
              ] as const).map(([value, label]) => (
                <button
                  aria-pressed={filter === value}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${filter === value ? "bg-blue-600 text-white" : "bg-muted text-muted-foreground hover:text-foreground"}`}
                  key={value}
                  onClick={() => setFilter(value)}
                  type="button"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12 text-muted-foreground" role="status">
              <LoaderCircle className="animate-spin" size={22} />
            </div>
          ) : visibleInvoices.length === 0 ? (
            <div className="py-12 text-center">
              <Receipt className="mx-auto text-muted-foreground/60" size={30} />
              <p className="mt-3 font-medium">
                {invoices.length === 0 ? "Nenhuma fatura cadastrada" : "Nenhuma fatura neste filtro"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Crie uma fatura a partir de uma venda existente.
              </p>
            </div>
          ) : (
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[720px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs text-muted-foreground">
                    <th className="px-3 py-3 font-medium">Cliente / venda</th>
                    <th className="px-3 py-3 font-medium">Vencimento</th>
                    <th className="px-3 py-3 font-medium">Valor</th>
                    <th className="px-3 py-3 font-medium">Status</th>
                    <th className="px-3 py-3 text-right font-medium">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleInvoices.map((invoice) => {
                    const overdue = invoiceIsOverdue(invoice)
                    return (
                      <tr className="border-b border-border/70 last:border-0" key={invoice.id}>
                        <td className="px-3 py-4">
                          <p className="font-medium">{invoice.customerName}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {invoice.description} · {invoice.customerPhone}
                          </p>
                        </td>
                        <td className={`px-3 py-4 ${overdue ? "font-medium text-destructive" : ""}`}>
                          {formatDate(invoice.dueDate)}
                        </td>
                        <td className="px-3 py-4 font-semibold">{money(invoice.amount)}</td>
                        <td className="px-3 py-4">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-medium ${invoice.status === "paga" ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : overdue ? "bg-destructive/10 text-destructive" : "bg-amber-500/10 text-amber-700 dark:text-amber-300"}`}
                          >
                            {invoice.status === "paga" ? "Paga" : overdue ? "Atrasada" : "Pendente"}
                          </span>
                        </td>
                        <td className="px-3 py-4 text-right">
                          <button
                            className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium transition hover:bg-muted disabled:opacity-50"
                            disabled={updatingInvoiceId === invoice.id}
                            onClick={() => void changeStatus(invoice)}
                            type="button"
                          >
                            {updatingInvoiceId === invoice.id ? (
                              <LoaderCircle className="animate-spin" size={14} />
                            ) : invoice.status === "paga" ? (
                              <RotateCcw size={14} />
                            ) : (
                              <Check size={14} />
                            )}
                            {invoice.status === "paga" ? "Reabrir" : "Marcar paga"}
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}

export default Financias
