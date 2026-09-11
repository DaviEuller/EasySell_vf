import { ArrowDownRight, ArrowUpRight, CircleAlert, Package, Receipt, WalletCards } from "lucide-react"
import NavbarPreset from "@/components/navbar_preset"
import { AppDock } from "@/components/Dock"
import {
	Area,
	AreaChart,
	ChartTooltip,
	Grid,
	Ring,
	RingChart,
	RingCenter,
	XAxis,
} from "@/components/charts"

const salesByDay = [
	{ date: new Date("2026-09-01"), vendas: 1840 },
	{ date: new Date("2026-09-02"), vendas: 2320 },
	{ date: new Date("2026-09-03"), vendas: 1980 },
	{ date: new Date("2026-09-04"), vendas: 2860 },
	{ date: new Date("2026-09-05"), vendas: 3420 },
	{ date: new Date("2026-09-06"), vendas: 3180 },
	{ date: new Date("2026-09-07"), vendas: 3840 },
]

const products = [
	{ name: "Kit organização", sales: "R$ 8.420", units: 84, percentage: 88 },
	{ name: "Cadeira Office", sales: "R$ 6.180", units: 41, percentage: 66 },
	{ name: "Mesa compacta", sales: "R$ 4.960", units: 32, percentage: 52 },
	{ name: "Luminária LED", sales: "R$ 3.240", units: 54, percentage: 34 },
]

const deductions = [
	{ label: "Impostos", value: "R$ 2.480", detail: "12,4% do faturamento", color: "text-amber-300" },
	{ label: "Salários", value: "R$ 5.920", detail: "6 colaboradores", color: "text-blue-300" },
	{ label: "Operação", value: "R$ 1.180", detail: "Custos recorrentes", color: "text-white/70" },
]

function money(value: number) {
	return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

export function Financias() {
	return (
		<main className="min-h-screen overflow-hidden bg-[#070B14] px-4 pt-24 pb-32 text-white sm:px-8">
			<NavbarPreset />
			<AppDock />
			<div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_85%_8%,rgba(37,99,235,0.16),transparent_28%),radial-gradient(circle_at_10%_90%,rgba(14,165,233,0.08),transparent_30%)]" />

			<div className="relative z-10 mx-auto max-w-7xl">
				<header className="flex flex-col justify-between gap-5 border-b border-white/10 py-8 sm:flex-row sm:items-end">
					<div>
						<p className="text-xs font-semibold tracking-[0.24em] text-blue-300 uppercase">Controle financeiro</p>
						<h1 className="mt-3 font-heading text-4xl font-bold sm:text-5xl">Dinheiro em movimento.</h1>
						<p className="mt-3 max-w-xl text-sm leading-6 text-white/50">
							Acompanhe vendas, descontos e o resultado real da sua operação.
						</p>
					</div>
					<select className="h-10 rounded-lg border border-white/15 bg-white/[0.06] px-3 text-sm text-white outline-none focus:border-blue-400/60">
						<option className="bg-[#0B1120]">Últimos 7 dias</option>
						<option className="bg-[#0B1120]">Este mês</option>
						<option className="bg-[#0B1120]">Últimos 90 dias</option>
					</select>
				</header>

				<section className="grid gap-3 py-6 sm:grid-cols-2 lg:grid-cols-4">
					{[
						["Arrecadado", "R$ 24.860", "+18,6%"],
						["Resultado líquido", "R$ 15.280", "+11,2%"],
						["Impostos", "R$ 2.480", "12,4%"],
						["Folha salarial", "R$ 5.920", "24,8%"],
					].map(([label, value, change]) => (
						<div key={label} className="app-panel rounded-xl p-4">
							<p className="text-xs text-white/45">{label}</p>
							<strong className="mt-2 block font-heading text-2xl font-semibold">{value}</strong>
							<span className="mt-2 block text-xs font-medium text-[#5DCAA5]">{change} no período</span>
						</div>
					))}
				</section>

				<section className="grid gap-3 lg:grid-cols-[1.35fr_0.65fr]">
					<div className="app-panel rounded-xl p-5 sm:p-6">
						<div className="flex items-start justify-between gap-4">
							<div>
								<p className="text-xs font-semibold tracking-[0.16em] text-blue-300 uppercase">Vendas</p>
								<h2 className="mt-2 font-heading text-2xl font-bold">Faturamento diário</h2>
							</div>
							<div className="text-right">
								<strong className="block text-lg">{money(19440)}</strong>
								<span className="text-xs text-[#5DCAA5]">média do período</span>
							</div>
						</div>
						<AreaChart data={salesByDay} style={{ height: 220 }}>
							<Grid horizontal />
							<Area dataKey="vendas" fill="#3B82F6" />
							<XAxis />
							<ChartTooltip />
						</AreaChart>
					</div>

					<div className="app-panel rounded-xl p-5 sm:p-6">
						<p className="text-xs font-semibold tracking-[0.16em] text-blue-300 uppercase">Distribuição</p>
						<h2 className="mt-2 font-heading text-2xl font-bold">Destino da receita</h2>
						<RingChart
							data={[
								{ label: "Resultado", value: 15280, maxValue: 24860, color: "#60A5FA" },
								{ label: "Impostos", value: 2480, maxValue: 24860, color: "#F59E0B" },
								{ label: "Salários", value: 5920, maxValue: 24860, color: "#5DCAA5" },
							]}
							size={170}
						>
							<Ring index={0} />
							<Ring index={1} />
							<Ring index={2} />
							<RingCenter defaultLabel="Arrecadado" />
						</RingChart>
						<div className="mt-3 grid gap-2 text-sm text-white/65">
							<span className="flex justify-between"><span>Resultado</span><strong className="text-white">61,5%</strong></span>
							<span className="flex justify-between"><span>Impostos</span><strong className="text-amber-300">10%</strong></span>
							<span className="flex justify-between"><span>Salários</span><strong className="text-[#5DCAA5]">23,8%</strong></span>
						</div>
					</div>
				</section>

				<section className="mt-3 grid gap-3 lg:grid-cols-[1.1fr_0.9fr]">
					<div className="app-panel rounded-xl p-5 sm:p-6">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-xs font-semibold tracking-[0.16em] text-blue-300 uppercase">Produtos</p>
								<h2 className="mt-2 font-heading text-2xl font-bold">Vendas por produto</h2>
							</div>
							<Package className="text-blue-300" size={22} />
						</div>
						<div className="mt-6 grid gap-5">
							{products.map((product) => (
								<div key={product.name}>
									<div className="mb-2 flex items-center justify-between gap-4 text-sm">
										<span className="text-white/70">{product.name} <span className="text-white/35">· {product.units} un.</span></span>
										<strong>{product.sales}</strong>
									</div>
									<div className="h-2 overflow-hidden rounded-full bg-white/10">
										<div className="h-full rounded-full bg-blue-400" style={{ width: `${product.percentage}%` }} />
									</div>
								</div>
							))}
						</div>
					</div>

					<div className="app-panel rounded-xl p-5 sm:p-6">
						<p className="text-xs font-semibold tracking-[0.16em] text-blue-300 uppercase">Descontos</p>
						<h2 className="mt-2 font-heading text-2xl font-bold">Saídas planejadas</h2>
						<div className="mt-6 grid gap-3">
							{deductions.map((item) => (
								<div key={item.label} className="flex items-center justify-between border-b border-white/10 pb-3 last:border-0">
									<div>
										<p className="text-sm text-white/65">{item.label}</p>
										<span className="text-xs text-white/35">{item.detail}</span>
									</div>
									<strong className={item.color}>{item.value}</strong>
								</div>
							))}
						</div>
						<div className="mt-5 flex items-center gap-2 rounded-lg bg-blue-400/10 p-3 text-xs text-blue-200">
							<Receipt size={16} /> Total descontado: R$ 9.580
						</div>
					</div>
				</section>

				<section className="mt-3 grid gap-3 sm:grid-cols-2">
					<div className="app-panel rounded-xl p-5 sm:p-6">
						<div className="flex items-start gap-3">
							<CircleAlert className="mt-0.5 text-amber-300" size={21} />
							<div>
								<p className="text-xs font-semibold tracking-[0.16em] text-amber-300 uppercase">Atenção</p>
								<h2 className="mt-2 font-heading text-2xl font-bold">Produtos em falta</h2>
							</div>
						</div>
						<p className="mt-4 text-sm leading-6 text-white/55">4 produtos estão sem estoque e podem bloquear novas vendas.</p>
						<a href="/dashboard#estoque" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-amber-200 hover:text-white">Ver estoque <ArrowUpRight size={15} /></a>
					</div>
					<div className="app-panel rounded-xl p-5 sm:p-6">
						<div className="flex items-start gap-3">
							<WalletCards className="mt-0.5 text-[#5DCAA5]" size={21} />
							<div>
								<p className="text-xs font-semibold tracking-[0.16em] text-[#5DCAA5] uppercase">Pontos fortes</p>
								<h2 className="mt-2 font-heading text-2xl font-bold">O que está funcionando</h2>
							</div>
						</div>
						<div className="mt-4 grid gap-2 text-sm text-white/60">
							<span className="flex items-center gap-2"><ArrowUpRight size={15} className="text-[#5DCAA5]" /> Kit organização lidera a receita</span>
							<span className="flex items-center gap-2"><ArrowUpRight size={15} className="text-[#5DCAA5]" /> Margem líquida acima do mês anterior</span>
							<span className="flex items-center gap-2"><ArrowUpRight size={15} className="text-[#5DCAA5]" /> Arrecadação diária em alta</span>
						</div>
					</div>
				</section>

				<section className="app-panel mt-3 rounded-xl p-5 sm:p-6">
					<div className="flex items-center gap-3">
						<WalletCards className="text-blue-300" size={22} />
						<div>
							<p className="text-xs font-semibold tracking-[0.16em] text-blue-300 uppercase">Fechamento</p>
							<h2 className="mt-2 font-heading text-2xl font-bold">Dinheiro arrecadado</h2>
						</div>
					</div>
					<div className="mt-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
						<strong className="font-heading text-4xl font-bold text-white">R$ 15.280,00</strong>
						<span className="inline-flex items-center gap-2 text-sm text-[#5DCAA5]"><ArrowUpRight size={17} /> 11,2% acima do último período</span>
					</div>
				</section>
			</div>
		</main>
	)
}

export default Financias
