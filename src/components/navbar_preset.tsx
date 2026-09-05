import { useState } from "react"

const navbarItems = [
	{
		label: "Explorar",
		bgColor: "#172554",
		links: [
			{ label: "Início", href: "#inicio" },
			{ label: "Como funciona", href: "#como-funciona" },
		],
	},
	{
		label: "Soluções",
		bgColor: "#1e3a8a",
		links: [
			{ label: "Recursos", href: "#como-funciona" },
			{ label: "Planos", href: "#planos" },
		],
	},
	{
		label: "Comece agora",
		bgColor: "#065f46",
		links: [
			{ label: "Escolher um plano", href: "#planos" },
			{ label: "Falar com a EasySell", href: "#comecar" },
		],
	},
]

export function NavbarPreset() {
	const [isOpen, setIsOpen] = useState(false)

	const closeMenu = () => setIsOpen(false)

	return (
		<header className="fixed top-0 right-0 left-0 z-50 px-4 pt-5 sm:px-6">
			<div className="mx-auto max-w-5xl overflow-hidden rounded-2xl border border-white/15 bg-black/70 shadow-2xl shadow-black/30 backdrop-blur-xl">
				<div className="flex items-center justify-between px-4 py-3 sm:px-5">
					<a href="#inicio" onClick={closeMenu} className="flex items-center gap-3 text-white">
						<span className="text-lg font-bold tracking-tight">EasySell</span>
					</a>

					<button
						type="button"
						aria-expanded={isOpen}
						aria-controls="easysell-navigation"
						onClick={() => setIsOpen((open) => !open)}
						className="flex items-center gap-3 rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/15"
					>
						<span>{isOpen ? "Fechar" : "Menu"}</span>
						<span className="flex w-5 flex-col gap-1" aria-hidden="true">
							<span className="h-px w-full bg-current" />
							<span className="h-px w-full bg-current" />
						</span>
					</button>
				</div>

				<div
					id="easysell-navigation"
					className={`grid transition-[grid-template-rows,opacity,padding] duration-300 ease-out ${isOpen ? "grid-rows-[1fr] px-3 pb-3 opacity-100 sm:px-4 sm:pb-4" : "grid-rows-[0fr] opacity-0"}`}
				>
					<div className="min-h-0 overflow-hidden">
						<div className="grid gap-2 sm:grid-cols-3">
							{navbarItems.map((item) => (
								<div key={item.label} className="rounded-xl p-4 text-white" style={{ backgroundColor: item.bgColor }}>
									<p className="text-sm font-semibold text-white/60">EasySell</p>
									<h2 className="mt-1 text-lg font-semibold">{item.label}</h2>
									<nav className="mt-5 flex flex-col gap-2" aria-label={item.label}>
										{item.links.map((link) => (
											<a
												key={link.label}
												href={link.href}
												onClick={closeMenu}
												className="w-fit text-sm text-white/80 transition-colors hover:text-white hover:underline"
											>
												{link.label}
											</a>
										))}
									</nav>
								</div>
							))}
						</div>
					</div>
				</div>
			</div>
		</header>
	)
}

export default NavbarPreset
