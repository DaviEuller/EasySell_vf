import { ArrowUpRight } from "lucide-react";
import {
  AreaChart,
  Area,
  Grid,
  XAxis,
  ChartTooltip,
  LineChart,
  Line,
  RingChart,
  Ring,
  RingCenter,
} from "./charts/";

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

const cashFlow = [
  { label: "Entradas", value: 12150, maxValue: 12150, color: "#1D9E75" },
  { label: "Saídas", value: 8240, maxValue: 12150, color: "#D85A30" },
];

const stockSummary = [
  { label: "Em estoque", value: "1.248", color: "#5DCAA5" },
  { label: "Estoque baixo", value: "18", color: "#F59E0B" },
  { label: "Sem estoque", value: "04", color: "#F87171" },
];

function CardShell({
  title,
  value,
  hint,
  span,
  children,
}: {
  title: string;
  value?: string;
  hint?: string;
  span?: 2;
  children: React.ReactNode;
}) {
  return (
    <div className={`rounded-xl border border-blue-300/25 bg-white/[0.06] p-5 shadow-2xl shadow-blue-950/30 backdrop-blur-2xl sm:p-6 ${span ? "sm:col-span-2" : ""}`}>
        <div className="mb-2 text-xs font-medium tracking-[0.12em] text-white/45 uppercase">{title}</div>
        {value && (
          <div className="mb-4 font-heading text-3xl font-semibold text-white">{value}</div>
        )}
        {children}
        {hint && <div className="mt-3 text-xs text-[#5DCAA5]">{hint}</div>}
    </div>
  );
}

export default function DashboardCards() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div id="vendas" className="scroll-mt-28 sm:col-span-2">
        <CardShell title="Vendas da semana" value="R$ 8.240" span={2}>
          <AreaChart data={weekSales} style={{ height: 140 }}>
            <Grid horizontal />
            <Area dataKey="vendas" fill="#3B82F6" />
            <XAxis />
            <ChartTooltip />
          </AreaChart>
        </CardShell>
      </div>

      <div id="clientes" className="scroll-mt-28 sm:col-span-2">
        <CardShell title="Clientes ativos" value="1.284" hint="+6,2% vs mês anterior" span={2}>
          <LineChart data={monthlyUsers} style={{ height: 80 }}>
            <Line dataKey="usuarios" stroke="#60A5FA" />
            <ChartTooltip />
          </LineChart>
        </CardShell>
      </div>

      <div id="estoque" className="scroll-mt-28">
        <CardShell title="Estoque" value="1.248 itens" hint="18 produtos precisam de atenção">
          <div className="grid gap-3 pt-1">
            {stockSummary.map((item) => (
              <div className="flex items-center justify-between text-sm" key={item.label}>
                <span className="flex items-center gap-2 text-white/55">
                  <span className="size-2 rounded-full" style={{ backgroundColor: item.color }} />
                  {item.label}
                </span>
                <strong className="text-white">{item.value}</strong>
              </div>
            ))}
          </div>
          <a
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-blue-500"
            href="/dashboard#estoque"
          >
            Ir para estoque <ArrowUpRight size={14} />
          </a>
        </CardShell>
      </div>

      <div id="funcionarios" className="scroll-mt-28">
        <CardShell title="Equipe" value="12 pessoas" hint="3 tarefas aguardando revisão">
          <div className="flex items-center justify-between border-t border-white/10 pt-4 text-sm">
            <span className="text-white/55">Funcionários ativos</span>
            <span className="font-medium text-[#5DCAA5]">10</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-sm">
            <span className="text-white/55">Convites pendentes</span>
            <span className="font-medium text-amber-300">2</span>
          </div>
          <a
            className="mt-9 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-blue-500"
            href="/dashboard#funcionarios"
          >
            Ir para equipe <ArrowUpRight size={14} />
          </a>
        </CardShell>
      </div>

      <div className="scroll-mt-28 sm:col-span-2" id="ecossistema">
        <CardShell title="Ecossistema EasySell" value="Venda e cresça" hint="Ferramentas conectadas à sua operação">
          <div className="grid gap-3 sm:grid-cols-2">
            <a
              className="group rounded-lg border border-violet-400/20 bg-violet-400/10 p-4 transition hover:border-violet-300/50"
              href="#easy-market"
              id="easy-market"
            >
              <span className="text-xs font-semibold tracking-[0.16em] text-violet-300 uppercase">Easy Market</span>
              <p className="mt-2 text-sm text-white/60">Leve seus produtos para novos clientes.</p>
              <span className="mt-4 block text-xs font-medium text-violet-200 group-hover:text-white">Conhecer produto ↗</span>
            </a>
            <a
              className="group rounded-lg border border-amber-400/20 bg-amber-400/10 p-4 transition hover:border-amber-300/50"
              href="#easy-crew"
              id="easy-crew"
            >
              <span className="text-xs font-semibold tracking-[0.16em] text-amber-300 uppercase">Easy Crew</span>
              <p className="mt-2 text-sm text-white/60">Encontre as pessoas certas para o time.</p>
              <span className="mt-4 block text-xs font-medium text-amber-200 group-hover:text-white">Conhecer produto ↗</span>
            </a>
          </div>
        </CardShell>
      </div>

      <div id="financeiro" className="scroll-mt-28 sm:col-span-2">
        <CardShell title="Entradas vs saídas" span={2}>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <RingChart data={cashFlow} size={140}>
            {cashFlow.map((item, index) => (
              <Ring key={item.label} index={index} />
            ))}
            <RingCenter defaultLabel="Saldo líquido" />
          </RingChart>
            <div className="grid gap-3 text-sm text-white/70">
              {cashFlow.map((item) => (
                <div className="flex items-center gap-2" key={item.label}>
                  <span
                    aria-hidden="true"
                    className="size-2 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span>{item.label}</span>
                  <span className="font-medium text-white">
                    R$ {item.value.toLocaleString("pt-BR")}
                  </span>
                </div>
              ))}
            </div>
        </div>
        </CardShell>
      </div>
    </div>
  );
}