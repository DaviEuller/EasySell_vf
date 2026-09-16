import { ArrowUpRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  AreaChart,
  Area,
  Grid,
  XAxis,
  ChartTooltip,
  LineChart,
  Line,
} from "./charts";

// dados mock — troque pelos valores vindos da sua API
const weekSales = [
  { date: new Date("2026-08-31"), vendas: 620 },
  { date: new Date("2026-09-01"), vendas: 890 },
  { date: new Date("2026-09-02"), vendas: 540 },
  { date: new Date("2026-09-03"), vendas: 1120 },
  { date: new Date("2026-09-04"), vendas: 780 },
  { date: new Date("2026-09-05"), vendas: 1430 },
  { date: new Date("2026-09-06"), vendas: 1780 },
];

const monthlyUsers = [
  { date: new Date("2026-04-01"), usuarios: 980 },
  { date: new Date("2026-05-01"), usuarios: 1040 },
  { date: new Date("2026-06-01"), usuarios: 1110 },
  { date: new Date("2026-07-01"), usuarios: 1190 },
  { date: new Date("2026-08-01"), usuarios: 1210 },
  { date: new Date("2026-09-01"), usuarios: 1284 },
];

const cashFlowTrend = [
  { date: new Date("2026-09-01"), entradas: 1480, saidas: 920 },
  { date: new Date("2026-09-02"), entradas: 1820, saidas: 1240 },
  { date: new Date("2026-09-03"), entradas: 1390, saidas: 980 },
  { date: new Date("2026-09-04"), entradas: 2210, saidas: 1450 },
  { date: new Date("2026-09-05"), entradas: 2640, saidas: 1790 },
  { date: new Date("2026-09-06"), entradas: 2310, saidas: 1680 },
  { date: new Date("2026-09-07"), entradas: 2300, saidas: 2180 },
];

const stockSummary = [
  { label: "Em estoque", value: "1.248", color: "#5DCAA5" },
  { label: "Estoque baixo", value: "18", color: "#F59E0B" },
  { label: "Sem estoque", value: "04", color: "#F87171" },
];

// helper simples pra juntar classes condicionais sem template literal multilinha
function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

// hook: detecta quando o elemento entra no viewport
function useInView<T extends HTMLElement>(threshold = 0.15) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect(); // anima só na primeira vez que aparece
        }
      },
      { threshold }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return [ref, inView] as const;
}

type CardShellProps = {
  title: string;
  value?: string;
  hint?: string;
  span?: 2;
  delay?: number;
  children: React.ReactNode;
};

function CardShell({ title, value, hint, span, delay = 0, children }: CardShellProps) {
  const [ref, inView] = useInView<HTMLDivElement>();

  const wrapperClass = cx(
    "group relative overflow-hidden rounded-xl border border-white/12 bg-white/[0.045] p-5 shadow-2xl shadow-black/20 backdrop-blur-2xl transition-all duration-500 ease-out",
    "before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-white/30",
    "hover:-translate-y-1 hover:border-white/25 hover:bg-white/[0.07] hover:shadow-[0_0_35px_-10px_rgba(93,202,165,0.35)]",
    "sm:p-6",
    span ? "sm:col-span-2" : "",
    inView ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
  );

  return (
    <div
      ref={ref}
      style={{ transitionDelay: inView ? delay + "ms" : "0ms" }}
      className={wrapperClass}
    >
      <div className="mb-2 text-xs font-medium tracking-[0.12em] text-white/45 uppercase transition-colors group-hover:text-white/60">
        {title}
      </div>
      {value && (
        <div className="mb-4 font-heading text-3xl font-semibold text-white transition-transform duration-300 group-hover:translate-x-0.5">
          {value}
        </div>
      )}
      {children}
      {hint && (
        <div className="mt-3 text-xs text-[#5DCAA5] transition-opacity duration-300 group-hover:opacity-90">
          {hint}
        </div>
      )}
    </div>
  );
}

function PillLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      className="group/link mt-5 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition-all duration-300 hover:scale-[1.03] hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-500/30"
      href={href}
    >
      {children}
      <ArrowUpRight
        size={14}
        className="transition-transform duration-300 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5"
      />
    </a>
  );
}

export default function DashboardCards() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div id="vendas" className="scroll-mt-28 sm:col-span-2">
        <CardShell title="Vendas da semana" value="R$ 8.240" span={2} delay={0}>
          <AreaChart data={weekSales} style={{ height: 140 }}>
            <Grid horizontal />
            <Area dataKey="vendas" fill="#3B82F6" />
            <XAxis />
            <ChartTooltip />
          </AreaChart>
        </CardShell>
      </div>

      <div id="clientes" className="scroll-mt-28 sm:col-span-2">
        <CardShell
          title="Clientes ativos"
          value="1.284"
          hint="+6,2% vs mês anterior"
          span={2}
          delay={80}
        >
          <LineChart data={monthlyUsers} style={{ height: 80 }}>
            <Line dataKey="usuarios" stroke="#60A5FA" />
            <ChartTooltip />
          </LineChart>
        </CardShell>
      </div>

      <div id="estoque" className="scroll-mt-28">
        <CardShell
          title="Estoque"
          value="1.248 itens"
          hint="18 produtos precisam de atenção"
          delay={0}
        >
          <div className="grid gap-3 pt-1">
            {stockSummary.map((item) => (
              <div
                className="flex items-center justify-between rounded-md px-1 py-0.5 text-sm transition-colors duration-200 hover:bg-white/[0.06]"
                key={item.label}
              >
                <span className="flex items-center gap-2 text-white/55">
                  <span
                    className="size-2 rounded-full transition-transform duration-200 group-hover:scale-125"
                    style={{ backgroundColor: item.color }}
                  />
                  {item.label}
                </span>
                <strong className="text-white">{item.value}</strong>
              </div>
            ))}
          </div>
          <PillLink href="/dashboard#estoque">Ir para estoque</PillLink>
        </CardShell>
      </div>

      <div id="funcionarios" className="scroll-mt-28">
        <CardShell
          title="Equipe"
          value="12 pessoas"
          hint="3 tarefas aguardando revisão"
          delay={80}
        >
          <div className="flex items-center justify-between border-t border-white/10 pt-4 text-sm transition-colors duration-200 hover:border-white/20">
            <span className="text-white/55">Funcionários ativos</span>
            <span className="font-medium text-[#5DCAA5]">10</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-sm">
            <span className="text-white/55">Convites pendentes</span>
            <span className="font-medium text-amber-300">2</span>
          </div>
          <PillLink href="/dashboard#funcionarios">Ir para equipe</PillLink>
        </CardShell>
      </div>

      <div className="scroll-mt-28 sm:col-span-2" id="ecossistema">
        <CardShell
          title="Ecossistema EasySell"
          value="Venda e cresça"
          hint="Ferramentas conectadas à sua operação"
          delay={0}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <a
              className="group relative rounded-lg border border-violet-300/20 bg-violet-300/[0.07] p-4 shadow-lg shadow-black/10 backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-violet-300/50 hover:bg-violet-300/10 hover:shadow-violet-500/20"
              href="#easy-market"
              id="easy-market"
            >
              <span className="text-xs font-semibold tracking-[0.16em] text-violet-300 uppercase">
                Easy Market
              </span>
              <p className="mt-2 text-sm text-white/60">Leve seus produtos para novos clientes.</p>
              <span className="mt-4 flex items-center gap-1 text-xs font-medium text-violet-200 transition-colors group-hover:text-white">
                Conhecer produto
                <ArrowUpRight
                  size={12}
                  className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                />
              </span>
            </a>
            <a
              className="group relative rounded-lg border border-amber-300/20 bg-amber-300/[0.07] p-4 shadow-lg shadow-black/10 backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-amber-300/50 hover:bg-amber-300/10 hover:shadow-amber-500/20"
              href="#easy-crew"
              id="easy-crew"
            >
              <span className="text-xs font-semibold tracking-[0.16em] text-amber-300 uppercase">
                Easy Crew
              </span>
              <p className="mt-2 text-sm text-white/60">Encontre as pessoas certas para o time.</p>
              <span className="mt-4 flex items-center gap-1 text-xs font-medium text-amber-200 transition-colors group-hover:text-white">
                Conhecer produto
                <ArrowUpRight
                  size={12}
                  className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                />
              </span>
            </a>
          </div>
        </CardShell>
      </div>

      <div id="financeiro" className="scroll-mt-28 sm:col-span-2">
        <CardShell title="Entradas vs saídas" span={2} delay={80}>
          <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <div className="mb-3 flex flex-wrap gap-4 text-xs text-white/55">
                <span className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-[#1D9E75]" />
                  Entradas
                </span>
                <span className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-[#D85A30]" />
                  Saídas
                </span>
              </div>
              <AreaChart data={cashFlowTrend} style={{ height: 180 }}>
                <Grid horizontal />
                <Area dataKey="entradas" stroke="#1D9E75" fill="#1D9E75" fillOpacity={0.12} animate={false} />
                <Area dataKey="saidas" stroke="#D85A30" fill="#D85A30" fillOpacity={0.1} animate={false} />
                <XAxis />
                <ChartTooltip />
              </AreaChart>
            </div>
            <PillLink href="/financias">Ir para finanças</PillLink>
          </div>
        </CardShell>
      </div>
    </div>
  );
}