import { ArrowUpRight } from "lucide-react"
import NavbarPreset from "@/components/navbar_preset"
import { AppDock } from "@/components/Dock"

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
  // efeito spotlight estilo ReactBits: o reflexo acompanha o mouse dentro do card
  const handleSpotlight = (event: React.MouseEvent<HTMLElement>) => {
    const card = event.currentTarget
    const rect = card.getBoundingClientRect()
    card.style.setProperty("--mouse-x", `${event.clientX - rect.left}px`)
    card.style.setProperty("--mouse-y", `${event.clientY - rect.top}px`)
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

        /* Spotlight estilo ReactBits: reflexo radial seguindo o mouse */
        .spotlight-card::before {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: inherit;
          background: radial-gradient(
            320px circle at var(--mouse-x, 50%) var(--mouse-y, 50%),
            rgba(96,165,250,0.14),
            transparent 65%
          );
          opacity: 0;
          transition: opacity 0.45s ease;
          pointer-events: none;
          z-index: 0;
        }
        .spotlight-card:hover::before {
          opacity: 1;
        }
      `}</style>

      <div className="relative z-10 mx-auto max-w-6xl">
        <header
          className="animate-fade-up flex flex-col justify-between gap-5 border-b border-white/10 py-8 sm:flex-row sm:items-end"
          style={{ animationDelay: "0.05s" }}
        >
          <div>
            <p className="text-xs font-semibold tracking-[0.24em] text-blue-300 uppercase">
              Visão geral
            </p>
            <h1 className="mt-3 font-heading text-4xl font-bold sm:text-5xl">
              Bom dia, Davi.
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-white/50">
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
              onMouseMove={handleSpotlight}
              className="spotlight-card animate-fade-up app-panel group relative flex flex-col justify-between overflow-hidden rounded-xl p-4 transition-all duration-300 hover:-translate-y-1 hover:border-blue-400/50 hover:shadow-[0_10px_40px_-10px_rgba(59,130,246,0.35)]"
              style={{ animationDelay: `${0.12 + index * 0.07}s` }}
            >
              {/* conteúdo acima do reflexo */}
              <div className="relative z-10">
                <p className="text-xs text-white/45 transition group-hover:text-white/60">
                  {card.title}
                </p>
                <strong className="mt-2 block font-heading text-2xl font-semibold transition group-hover:text-blue-100">
                  {card.value}
                </strong>
                <span
                  className={`mt-2 block text-xs font-medium ${card.positive ? "text-[#5DCAA5]" : "text-amber-300"}`}
                >
                  {card.hint}
                </span>
              </div>

              <span className="relative z-10 mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-200 transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-white">
                {card.link}{" "}
                <ArrowUpRight
                  size={15}
                  className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
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