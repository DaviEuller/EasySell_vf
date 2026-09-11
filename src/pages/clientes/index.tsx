import { useState } from "react"
import {
  MessageCircle,
  Search,
  Send,
  X,
} from "lucide-react"
import NavbarPreset from "@/components/navbar_preset"
import { AppDock } from "@/components/Dock"

type Customer = {
  id: number
  name: string
  product: string
  value: number
  quantity: number
  phone: string
}

const initialCustomers: Customer[] = [
  { id: 1, name: "Marina Souza", product: "Kit organização", value: 99.9, quantity: 1, phone: "11987654321" },
  { id: 2, name: "Carlos Eduardo", product: "Cadeira Office", value: 899.0, quantity: 1, phone: "21976543210" },
  { id: 3, name: "Fernanda Lima", product: "Mesa compacta", value: 918.0, quantity: 2, phone: "31965432109" },
  { id: 4, name: "João Pedro", product: "Luminária LED", value: 179.7, quantity: 3, phone: "41954321098" },
  { id: 5, name: "Beatriz Alves", product: "Suporte notebook", value: 89.9, quantity: 1, phone: "51943210987" },
  { id: 6, name: "Rafael Torres", product: "Mousepad XL", value: 79.8, quantity: 2, phone: "61932109876" },
  { id: 7, name: "Camila Rocha", product: "Garrafa térmica", value: 79.9, quantity: 1, phone: "71921098765" },
  { id: 8, name: "Lucas Martins", product: "Fone Bluetooth", value: 299.8, quantity: 2, phone: "81910987654" },
  { id: 9, name: "Juliana Costa", product: "Teclado mecânico", value: 349.0, quantity: 1, phone: "91909876543" },
  { id: 10, name: "Pedro Henrique", product: "Webcam Full HD", value: 458.0, quantity: 2, phone: "11998765432" },
]

const quickMessages = [
  { label: "Agradecimento", text: "compra" },
  { label: "Confirmar entrega", text: "entrega" },
  { label: "Pedido a caminho", text: "envio" },
  { label: "Pós-venda", text: "posvenda" },
]

function money(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

function formatPhone(phone: string) {
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
  const [customers] = useState(initialCustomers)
  const [search, setSearch] = useState("")
  const [openMenuId, setOpenMenuId] = useState<number | null>(null)
  const [customMessage, setCustomMessage] = useState("")

  const filtered = customers.filter((c) =>
    `${c.name} ${c.product} ${c.phone}`.toLowerCase().includes(search.toLowerCase())
  )

  const totalRevenue = customers.reduce((sum, c) => sum + c.value, 0)
  const totalItems = customers.reduce((sum, c) => sum + c.quantity, 0)

  const handleSpotlight = (event: React.MouseEvent<HTMLElement>) => {
    const el = event.currentTarget
    const rect = el.getBoundingClientRect()
    el.style.setProperty("--mouse-x", `${event.clientX - rect.left}px`)
    el.style.setProperty("--mouse-y", `${event.clientY - rect.top}px`)
  }

  const toggleMenu = (id: number) => {
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
        @keyframes menu-expand {
          from { opacity: 0; transform: translateY(-6px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-menu-expand { animation: menu-expand 0.18s ease-out both; }
      `}</style>

      <div className="relative z-10 mx-auto max-w-6xl">
        {/* Header */}
        <header
          className="animate-fade-up flex flex-col justify-between gap-5 border-b border-white/10 py-8 sm:flex-row sm:items-end"
          style={{ animationDelay: "0.05s" }}
        >
          <div>
            <p className="text-xs font-semibold tracking-[0.24em] text-blue-300 uppercase">
              Relacionamento
            </p>
            <h1 className="mt-3 font-heading text-4xl font-bold sm:text-5xl">
              Seus clientes, em um só lugar.
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-white/50">
              Veja o que cada cliente comprou e fale com ele direto pelo WhatsApp.
            </p>
          </div>
        </header>

        {/* KPIs */}
        <section className="grid grid-cols-1 gap-3 py-6 sm:grid-cols-3">
          {[
            { label: "Clientes", value: customers.length.toLocaleString("pt-BR") },
            { label: "Itens vendidos", value: totalItems.toLocaleString("pt-BR") },
            { label: "Receita total", value: money(totalRevenue) },
          ].map((kpi, index) => (
            <div
              key={kpi.label}
              onMouseMove={handleSpotlight}
              className="spotlight-card animate-fade-up app-panel relative overflow-hidden rounded-xl p-4 transition-all duration-300 hover:-translate-y-1 hover:border-blue-400/40"
              style={{ animationDelay: `${0.1 + index * 0.06}s` }}
            >
              <div className="relative z-10">
                <p className="text-xs text-white/45">{kpi.label}</p>
                <strong className="mt-2 block font-heading text-2xl font-semibold text-white">
                  {kpi.value}
                </strong>
              </div>
            </div>
          ))}
        </section>

        {/* Tabela de clientes */}
        <section
          onMouseMove={handleSpotlight}
          className="spotlight-card animate-fade-up app-panel relative overflow-visible rounded-xl p-5 sm:p-6"
          style={{ animationDelay: "0.2s" }}
        >
          <div className="relative z-10">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <p className="text-xs font-semibold tracking-[0.16em] text-blue-300 uppercase">
                  Base de clientes
                </p>
                <h2 className="mt-2 font-heading text-2xl font-bold">
                  Todos os clientes
                </h2>
              </div>
              <label className="flex h-10 w-full items-center gap-2 rounded-lg border border-white/15 bg-white/[0.05] px-3 text-sm text-white/60 focus-within:border-blue-400/60 sm:w-64">
                <Search size={15} className="shrink-0 text-white/35" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar cliente..."
                  className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/30"
                />
              </label>
            </div>

            <div className="mt-6 overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-left text-xs tracking-wide text-white/35 uppercase">
                    <th className="pb-3 font-medium">Comprador</th>
                    <th className="pb-3 font-medium">Produto</th>
                    <th className="pb-3 font-medium">Valor pago</th>
                    <th className="pb-3 font-medium">Qtd.</th>
                    <th className="pb-3 font-medium">Telefone</th>
                    <th className="pb-3 text-right font-medium">Contato</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((customer) => (
                    <tr
                      key={customer.id}
                      className="border-b border-white/5 transition last:border-0 hover:bg-white/[0.03]"
                    >
                      <td className="py-3.5 pr-4 font-medium text-white">
                        {customer.name}
                      </td>
                      <td className="py-3.5 pr-4 text-white/70">
                        {customer.product}
                      </td>
                      <td className="py-3.5 pr-4 font-medium">
                        {money(customer.value)}
                      </td>
                      <td className="py-3.5 pr-4 text-white/70">
                        {customer.quantity} un.
                      </td>
                      <td className="py-3.5 pr-4 text-white/50">
                        {formatPhone(customer.phone)}
                      </td>
                      <td className="py-3.5 text-right">
                        <div className="relative inline-block text-left">
                          <button
                            onClick={() => toggleMenu(customer.id)}
                            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                              openMenuId === customer.id
                                ? "bg-[#25D366]/20 text-[#25D366]"
                                : "bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20"
                            }`}
                          >
                            <MessageCircle size={14} />
                            WhatsApp
                          </button>

                          {openMenuId === customer.id && (
                            <div className="animate-menu-expand absolute top-full right-0 z-20 mt-2 w-72 rounded-xl border border-white/10 bg-[#0B1020] p-3 text-left shadow-2xl shadow-black/40">
                              <div className="flex items-center justify-between">
                                <p className="text-xs font-semibold tracking-[0.12em] text-white/40 uppercase">
                                  Mensagem rápida
                                </p>
                                <button
                                  onClick={() => setOpenMenuId(null)}
                                  className="text-white/30 transition hover:text-white/70"
                                >
                                  <X size={14} />
                                </button>
                              </div>

                              <div className="mt-2 flex flex-col gap-1">
                                {quickMessages.map((option) => (
                                  <button
                                    key={option.text}
                                    onClick={() => sendQuick(customer, option.text)}
                                    className="rounded-lg px-2.5 py-2 text-left text-sm text-white/75 transition hover:bg-white/[0.06] hover:text-white"
                                  >
                                    {option.label}
                                  </button>
                                ))}
                              </div>

                              <div className="mt-3 border-t border-white/10 pt-3">
                                <p className="mb-1.5 text-xs font-semibold tracking-[0.12em] text-white/40 uppercase">
                                  Mensagem personalizada
                                </p>
                                <div className="flex items-center gap-2">
                                  <input
                                    value={customMessage}
                                    onChange={(e) => setCustomMessage(e.target.value)}
                                    placeholder="Escreva sua mensagem..."
                                    className="h-9 w-full rounded-lg border border-white/15 bg-white/[0.05] px-2.5 text-xs text-white outline-none placeholder:text-white/30 focus:border-[#25D366]/60"
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") sendCustom(customer)
                                    }}
                                  />
                                  <button
                                    onClick={() => sendCustom(customer)}
                                    disabled={!customMessage.trim()}
                                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#25D366] text-[#0B1020] transition hover:bg-[#1fb958] disabled:cursor-not-allowed disabled:opacity-30"
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
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-sm text-white/35">
                        Nenhum cliente encontrado para "{search}".
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
