	const navbarItems = [
	{
		label: "INÍCIO",
		href: "/dashboard",
		links: [
			{ label: "Resumo", href: "/dashboard#resumo" },
			{ label: "Vendas", href: "/dashboard#vendas" },
		],
	},
	{
		label: "GESTÃO",
		href: "/financias",
		links: [
			{ label: "Estoque", href: "/dashboard#estoque" },
			{ label: "Financeiro", href: "/dashboard#financeiro" },
			{ label: "Clientes", href: "/dashboard#clientes" },
		],
	},
	{
		label: "PRODUTOS E EQUIPE",
		href: "/equipe",
		links: [
			{ label: "Funcionários", href: "/equipe" },
			{ label: "Easy Market", href: "/dashboard#easy-market" },
			{ label: "Easy Crew", href: "/dashboard#easy-crew" },
		],
	},
]

export function NavbarPreset() {
	const currentLocation = window.location.pathname + window.location.hash

	return (
		<header className="fixed top-0 right-0 left-0 z-70">
			<div className="w-full border-0 bg-transparent shadow-2xl shadow-black/30 backdrop-blur-xl">
				<div className="flex flex-wrap items-center justify-start gap-x-8 gap-y-3 px-4 py-5 sm:px-6">
					<a href="#inicio" className="flex items-center gap-3 text-white">
						<span className="text-lg font-bold tracking-tight">EasySell</span>
					</a>

							<nav className="flex flex-wrap items-center gap-x-7 gap-y-2 text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-white/80" aria-label="Navegação principal">
						{navbarItems.map((item) => (
							<div key={item.label} className="group relative">
								<a
									href={item.href}
									aria-current={currentLocation === item.href ? "page" : undefined}
									className="inline-block rounded px-1 text-white transition-colors duration-200 hover:text-white"
								>
									{item.label}
								</a>
								<div className="invisible absolute left-0 top-full z-50 w-52 translate-y-2 rounded-none border border-white/15 bg-slate-950/95 p-4 text-left opacity-0 shadow-2xl shadow-black/40 backdrop-blur-xl transition duration-200 group-hover:visible group-hover:translate-y-1 group-hover:opacity-100">
									<p className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-blue-300">{item.label}</p>
									<nav className="mt-3 flex flex-col gap-2" aria-label={item.label}>
										{item.links.map((link) => (
											<a key={link.label} href={link.href} className="rounded-none px-2 py-1.5 text-sm normal-case tracking-normal text-white/75 transition-colors hover:bg-white/10 hover:text-white">
												{link.label}
											</a>
										))}
									</nav>
								</div>
							</div>
						))}
					</nav>
				</div>
			</div>
		</header>
	)
}

export default NavbarPreset
