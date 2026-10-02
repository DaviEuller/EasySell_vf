import { ArrowUpRight } from "lucide-react"

const summaryCards = [
  {
    id: "Produtos",
    href: "/produtos",
    title: "Produtos",
    value: "Crie um produto",
    hint: "60 produtos",
    link: "Ver Produtos",
    positive: true,
  },
  {
    id: "clientes",
    href: "/dashboard#clientes",
    title: "Clientes",
    value: "1.284",
    hint: "+6,2% vs mês anterior",
    link: "Ver clientes",
    positive: true,
  },
  {
    id: "estoque",
    href: "/dashboard#estoque",
    title: "Estoque",
    value: "1.248 itens",
    hint: "18 produtos em atenção",
    link: "Ver estoque",
    positive: false,
  },
  {
    id: "funcionarios",
    href: "/equipe",
    title: "Equipe",
    value: "12 pessoas",
    hint: "2 convites pendentes",
    link: "Ver equipe",
    positive: false,
  },
  {
    id: "financeiro",
    href: "/financias",
    title: "Financeiro",
    value: "R$ 15.280",
    hint: "+11,2% no período",
    link: "Ver financeiro",
    positive: true,
  },
]

export function Resumo() {

  return (
    <main className="relative min-h-screen overflow-hidden bg-background px-4 pt-20 pb-16 text-foreground sm:px-8">

      <style>{`
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-up {
          animation: fade-up 0.6s ease-out both;
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.8); }
        }
        .animate-pulse-dot {
          animation: pulse-dot 2s ease-in-out infinite;
        }
      `}</style>

      <div className="relative z-10 mx-auto max-w-6xl">
        <header
          className="animate-fade-up flex flex-col justify-between gap-5 border-b border-border py-8 sm:flex-row sm:items-end"
          style={{ animationDelay: "0.05s" }}
        >
          <div>
            <p className="text-xs font-semibold tracking-[0.24em] text-blue-600 dark:text-blue-300 uppercase">
              Visão geral
            </p>
            <h1 className="mt-3 font-heading text-4xl font-bold sm:text-5xl">
              Bom dia, Davi.
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-foreground/50">
              O resumo da sua operação em um só lugar. Clique em um card para
              ir direto ao módulo.
            </p>
          </div>
         
        </header>

        <section className="grid grid-cols-1 gap-3 py-6 sm:grid-cols-2 lg:grid-cols-5">
          {summaryCards.map((card, index) => (
            <a
              key={card.id}
              href={card.href}
              className="animate-fade-up group flex flex-col justify-between rounded-md border border-border bg-card p-4 transition-colors hover:border-blue-500/50"
              style={{ animationDelay: `${0.1 + index * 0.05}s` }}
            >
              <div>
                <p className="text-xs font-normal text-foreground/45">
                  {card.title}
                </p>
                <strong className="mt-2 block text-xl font-medium tracking-tight text-foreground">
                  {card.value}
                </strong>
              </div>

              <span className="mt-5 inline-flex items-center gap-1.5 text-xs font-normal text-blue-600 dark:text-blue-300">
                {card.link}
                <ArrowUpRight
                  size={14}
                  className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                />
              </span>
            </a>
          ))}
        </section>
      </div>
    </main>
  )
}

export default Resumo