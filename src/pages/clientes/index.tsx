import { useCallback, useEffect, useState } from "react"
import {
  MessageCircle,
  Search,
  Send,
  X,
} from "lucide-react"

type Customer = {
  id: string
  name: string
  product: string
  value: number
  quantity: number
  phone: string
}

type Product = { id: string; name: string }
type ApiRecord = Record<string, unknown>

const quickMessages = [
  { label: "Agradecimento", text: "compra" },
  { label: "Confirmar entrega", text: "entrega" },
  { label: "Pedido a caminho", text: "envio" },
  { label: "Pós-venda", text: "posvenda" },
]

function money(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

function isApiRecord(value: unknown): value is ApiRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function getId(record: ApiRecord, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = record[key]
    if (typeof value === "string" && value.trim()) return value.trim()
    if (typeof value === "number" && Number.isFinite(value)) return String(value)
  }
  return undefined
}

function getNumber(record: ApiRecord, keys: string[]): number | undefined {
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

function getArrayPayload(payload: unknown, keys: string[]): unknown[] {
  let data = payload
  if (isApiRecord(data) && "data" in data) data = data.data
  if (isApiRecord(data)) {
    for (const key of keys) {
      if (Array.isArray(data[key])) return data[key]
    }
  }
  if (Array.isArray(data)) return data
  throw new Error("A resposta da API está em um formato inválido.")
}

function parseProduct(value: unknown): Product | null {
  if (!isApiRecord(value)) return null
  const id = getId(value, ["id", "_id", "productId", "produtoId"])
  const name =
    typeof value.name === "string"
      ? value.name
      : typeof value.nome === "string"
        ? value.nome
        : undefined
  return id && name ? { id, name } : null
}

function parseCustomer(
  value: unknown,
  productsById: Map<string, string>
): Customer | null {
  if (!isApiRecord(value)) return null

  const id = getId(value, ["id", "_id"])
  const name = typeof value.name === "string" ? value.name : undefined
  const phoneValue = value.Numero ?? value.numero ?? value.phone
  const phone =
    typeof phoneValue === "string" || typeof phoneValue === "number"
      ? String(phoneValue).replace(/\D/g, "")
      : ""
  const productValue = value.Id_Produto ?? value.IdProduto ?? value.product
  const productId = isApiRecord(productValue)
    ? getId(productValue, ["id", "_id", "productId", "produtoId"])
    : typeof productValue === "string" || typeof productValue === "number"
      ? String(productValue)
      : undefined
  const embeddedProductName =
    isApiRecord(productValue) && typeof productValue.name === "string"
      ? productValue.name
      : undefined
  const product =
    embeddedProductName ??
    (productId ? productsById.get(productId) ?? productId : "Produto não informado")
  const valuePaid = getNumber(value, ["Preco_gasto", "preco_gasto", "value"])
  const quantity = getNumber(value, ["Quantidade", "quantidade", "quantity"])

  if (
    !id ||
    !name ||
    valuePaid === undefined ||
    quantity === undefined
  ) {
    return null
  }

  return { id, name, product, value: valuePaid, quantity, phone }
}

async function getApiError(response: Response) {
  const responseText = await response.text()
  if (!responseText) {
    return `Não foi possível carregar os clientes (erro ${response.status}).`
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

  return `Não foi possível carregar os clientes (erro ${response.status}).`
}

async function readApiJson(response: Response): Promise<unknown> {
  const responseText = await response.text()
  if (!responseText) return null
  try {
    return JSON.parse(responseText) as unknown
  } catch {
    throw new Error("A resposta da API está em um formato inválido.")
  }
}

function formatPhone(phone: string) {
  if (!phone) return "Não informado"
  const ddd = phone.slice(0, 2)
  const rest = phone.slice(2)
  if (rest.length === 9) {
    return `(${ddd}) ${rest.slice(0, 5)}-${rest.slice(5)}`
  }
  return `(${ddd}) ${rest.slice(0, 4)}-${rest.slice(4)}`
}

function buildMessage(kind: string, customer: Customer) {
  switch (kind) {
    case "compra":
      return `Olá, ${customer.name}! Obrigado por comprar com a gente. Foi um prazer ter você como cliente 🙌`
    case "entrega":
      return `Olá, ${customer.name}! Passando para confirmar: seu pedido de ${customer.product} já foi entregue certinho?`
    case "envio":
      return `Olá, ${customer.name}! Seu pedido de ${customer.product} (${customer.quantity} un.) já está a caminho 🚚`
    case "posvenda":
      return `Olá, ${customer.name}! Tudo certo com o(a) ${customer.product} que você comprou? Qualquer coisa, estamos por aqui.`
    default:
      return `Olá, ${customer.name}!`
  }
}

function openWhatsApp(phone: string, message: string) {
  const url = `https://wa.me/55${phone}?text=${encodeURIComponent(message)}`
  window.open(url, "_blank")
}

export function Clientes() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [search, setSearch] = useState("")
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [customMessage, setCustomMessage] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState("")

  const loadCustomers = useCallback(async () => {
    const apiUrl = import.meta.env.VITE_API_URL?.trim().replace(/\/+$/, "")
    const companyId = localStorage.getItem("companyId")
    if (!apiUrl) {
      throw new Error("A API não está configurada. Defina VITE_API_URL.")
    }
    if (!companyId) {
      throw new Error("Não foi possível identificar a empresa. Entre novamente.")
    }

    const token = localStorage.getItem("accessToken")
    const headers = token ? { Authorization: `Bearer ${token}` } : undefined
    const [customersResponse, productsResponse] = await Promise.all([
      fetch(
        `${apiUrl}/clientes/company/${encodeURIComponent(companyId)}`,
        { headers }
      ),
      fetch(
        `${apiUrl}/produtos/company/${encodeURIComponent(companyId)}`,
        { headers }
      ),
    ])
    if (!customersResponse.ok) {
      throw new Error(await getApiError(customersResponse))
    }
    if (!productsResponse.ok) {
      throw new Error(await getApiError(productsResponse))
    }

    const productRows = getArrayPayload(
      await readApiJson(productsResponse),
      ["products", "produtos", "items"]
    )
    const products = productRows.map(parseProduct)
    const validProducts = products.filter(
      (product): product is Product => product !== null
    )
    if (validProducts.length !== productRows.length) {
      throw new Error("A API retornou um produto com dados inválidos.")
    }
    const productsById = new Map(
      validProducts.map((product) => [product.id, product.name])
    )

    const customerRows = getArrayPayload(
      await readApiJson(customersResponse),
      ["customers", "clientes", "items"]
    )
    const parsedCustomers = customerRows.map((customer) =>
      parseCustomer(customer, productsById)
    )
    const validCustomers = parsedCustomers.filter(
      (customer): customer is Customer => customer !== null
    )
    if (validCustomers.length !== customerRows.length) {
      throw new Error("A API retornou um cliente com dados inválidos.")
    }
    setCustomers(validCustomers)
    setLoadError("")
  }, [])

  useEffect(() => {
    let active = true
    Promise.resolve()
      .then(loadCustomers)
      .catch((error: unknown) => {
        if (active) {
          setLoadError(
            error instanceof Error
              ? error.message
              : "Não foi possível carregar os clientes."
          )
        }
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })

    return () => {
      active = false
    }
  }, [loadCustomers])

  const filtered = customers.filter((c) =>
    `${c.name} ${c.product} ${c.phone}`.toLowerCase().includes(search.toLowerCase())
  )

  const totalRevenue = customers.reduce((sum, c) => sum + c.value, 0)
  const totalItems = customers.reduce((sum, c) => sum + c.quantity, 0)


  const toggleMenu = (id: string) => {
    setCustomMessage("")
    setOpenMenuId((current) => (current === id ? null : id))
  }

  const sendQuick = (customer: Customer, kind: string) => {
    openWhatsApp(customer.phone, buildMessage(kind, customer))
    setOpenMenuId(null)
  }

  const sendCustom = (customer: Customer) => {
    if (!customMessage.trim()) return
    openWhatsApp(customer.phone, customMessage.trim())
    setOpenMenuId(null)
    setCustomMessage("")
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-background px-4 pt-20 pb-16 text-foreground sm:px-8">

      <style>{`
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-up { animation: fade-up 0.6s ease-out both; }
        @keyframes menu-expand {
          from { opacity: 0; transform: translateY(-6px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-menu-expand { animation: menu-expand 0.18s ease-out both; }
      `}</style>

      <div className="relative z-10 mx-auto max-w-6xl">
        {/* Header */}
        <header
          className="animate-fade-up flex flex-col justify-between gap-5 border-b border-border py-8 sm:flex-row sm:items-end"
          style={{ animationDelay: "0.05s" }}
        >
          <div>
            <p className="text-xs font-semibold tracking-[0.24em] text-blue-600 dark:text-blue-300 uppercase">
              Relacionamento
            </p>
            <h1 className="mt-3 font-heading text-4xl font-bold sm:text-5xl">
              Seus clientes, em um só lugar.
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-foreground/50">
              Veja o que cada cliente comprou e fale com ele direto pelo WhatsApp.
            </p>
          </div>
        </header>

        {/* KPIs */}
        <section className="grid grid-cols-1 gap-3 py-6 sm:grid-cols-3">
          {[
            { label: "Clientes", value: isLoading || loadError ? "—" : customers.length.toLocaleString("pt-BR") },
            { label: "Itens vendidos", value: isLoading || loadError ? "—" : totalItems.toLocaleString("pt-BR") },
            { label: "Receita total", value: isLoading || loadError ? "—" : money(totalRevenue) },
          ].map((kpi, index) => (
            <div
              key={kpi.label}
              className="animate-fade-up rounded-md border border-border bg-card p-4"
              style={{ animationDelay: `${0.1 + index * 0.06}s` }}
            >
              <div>
                <p className="text-xs text-foreground/45">{kpi.label}</p>
                <strong className="mt-2 block text-xl font-medium tracking-tight text-foreground">
                  {kpi.value}
                </strong>
              </div>
            </div>
          ))}
        </section>

        {/* Tabela de clientes */}
        <section
          className="animate-fade-up rounded-md border border-border bg-card p-5 sm:p-6"
          style={{ animationDelay: "0.2s" }}
        >
          <div className="relative z-10">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <p className="text-xs font-semibold tracking-[0.16em] text-blue-600 dark:text-blue-300 uppercase">
                  Base de clientes
                </p>
                <h2 className="mt-2 font-heading text-2xl font-bold">
                  Todos os clientes
                </h2>
              </div>
              <label className="flex h-10 w-full items-center gap-2 rounded-md border border-foreground/15 bg-foreground/[0.05] px-3 text-sm text-foreground/60 focus-within:border-blue-400/60 sm:w-64">
                <Search size={15} className="shrink-0 text-foreground/35" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar cliente..."
                  className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-foreground/30"
                />
              </label>
            </div>

            <div className="mt-6 overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs tracking-wide text-foreground/35 uppercase">
                    <th className="pb-3 font-medium">Comprador</th>
                    <th className="pb-3 font-medium">Produto</th>
                    <th className="pb-3 font-medium">Valor pago</th>
                    <th className="pb-3 font-medium">Qtd.</th>
                    <th className="pb-3 font-medium">Telefone</th>
                    <th className="pb-3 text-right font-medium">Contato</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading && (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-sm text-foreground/45">
                        Carregando clientes...
                      </td>
                    </tr>
                  )}
                  {!isLoading && loadError && (
                    <tr>
                      <td colSpan={6} role="alert" className="py-10 text-center text-sm text-red-600 dark:text-red-300">
                        {loadError}
                      </td>
                    </tr>
                  )}
                  {filtered.map((customer) => (
                    <tr
                      key={customer.id}
                      className="border-b border-border transition last:border-0 hover:bg-foreground/[0.03]"
                    >
                      <td className="py-3.5 pr-4 font-medium text-foreground">
                        {customer.name}
                      </td>
                      <td className="py-3.5 pr-4 text-foreground/70">
                        {customer.product}
                      </td>
                      <td className="py-3.5 pr-4 font-medium">
                        {money(customer.value)}
                      </td>
                      <td className="py-3.5 pr-4 text-foreground/70">
                        {customer.quantity} un.
                      </td>
                      <td className="py-3.5 pr-4 text-foreground/50">
                        {formatPhone(customer.phone)}
                      </td>
                      <td className="py-3.5 text-right">
                        <div className="relative inline-block text-left">
                          <button
                            onClick={() => toggleMenu(customer.id)}
                            disabled={!customer.phone}
                            title={!customer.phone ? "Telefone não informado" : undefined}
                            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                              openMenuId === customer.id
                                ? "bg-[#25D366]/20 text-[#25D366]"
                                : "bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20"
                            }`}
                          >
                            <MessageCircle size={14} />
                            WhatsApp
                          </button>

                          {openMenuId === customer.id && (
                            <div className="animate-menu-expand absolute top-full right-0 z-20 mt-2 w-72 rounded-md border border-border bg-card p-3 text-left shadow-2xl shadow-black/40">
                              <div className="flex items-center justify-between">
                                <p className="text-xs font-semibold tracking-[0.12em] text-foreground/40 uppercase">
                                  Mensagem rápida
                                </p>
                                <button
                                  onClick={() => setOpenMenuId(null)}
                                  className="text-foreground/30 transition hover:text-foreground/70"
                                >
                                  <X size={14} />
                                </button>
                              </div>

                              <div className="mt-2 flex flex-col gap-1">
                                {quickMessages.map((option) => (
                                  <button
                                    key={option.text}
                                    onClick={() => sendQuick(customer, option.text)}
                                    className="rounded-md px-2.5 py-2 text-left text-sm text-foreground/75 transition hover:bg-foreground/[0.06] hover:text-foreground"
                                  >
                                    {option.label}
                                  </button>
                                ))}
                              </div>

                              <div className="mt-3 border-t border-border pt-3">
                                <p className="mb-1.5 text-xs font-semibold tracking-[0.12em] text-foreground/40 uppercase">
                                  Mensagem personalizada
                                </p>
                                <div className="flex items-center gap-2">
                                  <input
                                    value={customMessage}
                                    onChange={(e) => setCustomMessage(e.target.value)}
                                    placeholder="Escreva sua mensagem..."
                                    className="h-9 w-full rounded-md border border-foreground/15 bg-foreground/[0.05] px-2.5 text-xs text-foreground outline-none placeholder:text-foreground/30 focus:border-[#25D366]/60"
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") sendCustom(customer)
                                    }}
                                  />
                                  <button
                                    onClick={() => sendCustom(customer)}
                                    disabled={!customMessage.trim()}
                                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#25D366] text-[#0B1020] transition hover:bg-[#1fb958] disabled:cursor-not-allowed disabled:opacity-30"
                                  >
                                    <Send size={14} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!isLoading && !loadError && filtered.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-sm text-foreground/35">
                        {search
                          ? `Nenhum cliente encontrado para "${search}".`
                          : "Nenhum cliente cadastrado."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}

export default Clientes
